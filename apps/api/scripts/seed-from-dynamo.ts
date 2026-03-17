/**
 * DynamoDB to D1 Migration Script
 *
 * Reads 4 DynamoDB JSON exports + 1 Auth0 user export, merges and deduplicates
 * events, resolves user references, and generates a seed.sql file with INSERT
 * statements for the D1 database.
 *
 * Usage: cd apps/api && npx tsx scripts/seed-from-dynamo.ts
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function log(message: string): void {
  // biome-ignore lint/suspicious/noConsole: CLI migration script
  console.info(message);
}

function logWarn(message: string): void {
  // biome-ignore lint/suspicious/noConsole: CLI migration script
  console.warn(message);
}

function logError(message: string): void {
  // biome-ignore lint/suspicious/noConsole: CLI migration script
  console.error(message);
}

function escapeSql(value: string | null | undefined): string {
  if (value == null) return 'NULL';
  // Replace single quotes with doubled single quotes for SQL escaping
  // Also strip null bytes which can corrupt SQL
  return `'${value.replace(/\0/g, '').replace(/'/g, "''")}'`;
}

function boolToInt(value: unknown): number {
  return value === true || value === 'true' || value === 1 ? 1 : 0;
}

/**
 * Recursively unmarshall DynamoDB typed JSON to plain values.
 * Handles S, N, BOOL, NULL, M, L, and SS/NS/BS set types.
 */
function unmarshallValue(attr: unknown): unknown {
  if (attr === null || attr === undefined || typeof attr !== 'object') {
    return attr;
  }

  const obj = attr as Record<string, unknown>;

  if ('S' in obj) return obj.S;
  if ('N' in obj) return Number(obj.N);
  if ('BOOL' in obj) return obj.BOOL;
  if ('NULL' in obj) return null;
  if ('L' in obj) return (obj.L as unknown[]).map(unmarshallValue);
  if ('SS' in obj) return obj.SS;
  if ('NS' in obj) return (obj.NS as string[]).map(Number);
  if ('M' in obj) {
    const map = obj.M as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(map)) {
      result[key] = unmarshallValue(val);
    }
    return result;
  }

  // Plain object — recurse into each key
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj)) {
    result[key] = unmarshallValue(val);
  }
  return result;
}

function unmarshallItem(line: unknown): unknown {
  const obj = line as Record<string, unknown>;
  const item = (obj.Item ?? obj) as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(item)) {
    result[key] = unmarshallValue(val);
  }
  return result;
}

function extractEventId(pk: string): string {
  const parts = pk.split('#');
  const id = parts[1];
  if (!id) {
    throw new Error(`Invalid PK format: ${pk}`);
  }
  return id;
}

function isDynamoEventItem(item: unknown): boolean {
  return (
    typeof item === 'object' &&
    item !== null &&
    'PK' in item &&
    typeof (item as Record<string, unknown>).PK === 'string' &&
    ((item as Record<string, unknown>).PK as string).startsWith('EVENT#')
  );
}

// ---------------------------------------------------------------------------
// Zod Schemas
// ---------------------------------------------------------------------------

const Auth0UserSchema = z.object({
  Id: z.string(),
  Nickname: z.string(),
  Picture: z.string(),
  'Created At': z.string(),
  'Updated At': z.string(),
});

const CreatedBySchema = z.object({
  id: z.string(),
  nickname: z.string(),
  picture: z.string(),
});

const ParticipantSchema = z.object({
  nickname: z.string(),
  picture: z.string(),
});

const DynamoEventSchema = z.object({
  PK: z.string(),
  SK: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  type: z.string(),
  dateStart: z.string(),
  timeStart: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  race: z.union([z.boolean(), z.number()]).optional(),
  createdBy: CreatedBySchema,
  participants: z.record(z.string(), ParticipantSchema).optional(),
  _ct: z.string(),
  _md: z.string(),
});

type DynamoEvent = z.infer<typeof DynamoEventSchema>;

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const DATA_DIR = resolve(import.meta.dirname ?? '.', '..', 'data');

const EVENT_FILES = [
  'events-dump-1.json',
  'events-dump-2.json',
  'events-dump-3.json',
  'events-dump-4.json',
];

const AUTH0_FILE = 'auth0-users.json';
const SEED_FILE = join(DATA_DIR, 'seed.sql');

// ---------------------------------------------------------------------------
// 1. Read and validate source files
// ---------------------------------------------------------------------------

function readJsonLinesFile(filePath: string): unknown[] {
  const content = readFileSync(filePath, 'utf-8');
  return content
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map((line) => JSON.parse(line) as unknown);
}

function checkFilesExist(): void {
  const missing: string[] = [];

  for (const file of EVENT_FILES) {
    const path = join(DATA_DIR, file);
    if (!existsSync(path)) {
      missing.push(path);
    }
  }

  const auth0Path = join(DATA_DIR, AUTH0_FILE);
  if (!existsSync(auth0Path)) {
    missing.push(auth0Path);
  }

  if (missing.length > 0) {
    logError('ERROR: Missing source files:');
    for (const m of missing) {
      logError(`  - ${m}`);
    }
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// 2. Parse Auth0 users
// ---------------------------------------------------------------------------

interface UserRecord {
  id: string;
  nickname: string;
  picture: string;
  createdAt: string;
  updatedAt: string;
}

function parseAuth0Users(): Map<string, UserRecord> {
  const raw = readJsonLinesFile(join(DATA_DIR, AUTH0_FILE));
  const users = new Map<string, UserRecord>();

  for (const item of raw) {
    const parsed = Auth0UserSchema.parse(item);
    users.set(parsed.Id, {
      id: parsed.Id,
      nickname: parsed.Nickname,
      picture: parsed.Picture,
      createdAt: parsed['Created At'],
      updatedAt: parsed['Updated At'],
    });
  }

  log(`Parsed ${users.size} users from Auth0 export`);
  return users;
}

// ---------------------------------------------------------------------------
// 3. Parse and merge DynamoDB events
// ---------------------------------------------------------------------------

function parseDynamoEvents(): DynamoEvent[] {
  const eventMap = new Map<string, DynamoEvent>();
  let totalCount = 0;

  for (const file of EVENT_FILES) {
    const rawLines = readJsonLinesFile(join(DATA_DIR, file));
    const unmarshalled = rawLines.map(unmarshallItem);
    const eventItems = unmarshalled.filter(isDynamoEventItem);

    totalCount += eventItems.length;

    for (const item of eventItems) {
      const parsed = DynamoEventSchema.parse(item);
      const eventId = extractEventId(parsed.PK);

      // Deduplicate: keep first occurrence
      if (!eventMap.has(eventId)) {
        eventMap.set(eventId, parsed);
      }
    }
  }

  const duplicates = totalCount - eventMap.size;
  log(
    `Parsed ${eventMap.size} unique events from ${totalCount} total across ${EVENT_FILES.length} files (${duplicates} duplicates removed)`,
  );

  // Log first event for manual inspection
  const firstEntry = eventMap.entries().next();
  if (!firstEntry.done) {
    const [id, event] = firstEntry.value;
    log(`\nSample event (id: ${id}):`);
    log(JSON.stringify(event, null, 2).slice(0, 500));
    log('...\n');
  }

  return Array.from(eventMap.values());
}

// ---------------------------------------------------------------------------
// 4-6. Transform and resolve references
// ---------------------------------------------------------------------------

interface EventRecord {
  id: string;
  title: string;
  subtitle: string | null;
  eventType: string;
  dateStart: string;
  timeStart: string | null;
  location: string | null;
  description: string | null;
  race: number;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
}

interface ParticipationRecord {
  userId: string;
  eventId: string;
}

function resolveParticipants(
  eventId: string,
  participants: Record<string, unknown> | undefined,
  users: Map<string, UserRecord>,
): { records: ParticipationRecord[]; orphaned: number } {
  const records: ParticipationRecord[] = [];
  let orphaned = 0;

  if (!participants) {
    return { records, orphaned };
  }

  for (const sub of Object.keys(participants)) {
    if (!users.has(sub)) {
      logWarn(`WARNING: Skipping orphaned participant ${sub} for event ${eventId}`);
      orphaned++;
      continue;
    }
    records.push({ userId: sub, eventId });
  }

  return { records, orphaned };
}

function transformEvents(
  dynamoEvents: DynamoEvent[],
  users: Map<string, UserRecord>,
): {
  events: EventRecord[];
  participations: ParticipationRecord[];
  orphanedCount: number;
} {
  const events: EventRecord[] = [];
  const participations: ParticipationRecord[] = [];
  let orphanedCount = 0;

  for (const dynEvent of dynamoEvents) {
    const eventId = extractEventId(dynEvent.PK);

    // Resolve creator -- fail if not found
    const creatorId = dynEvent.createdBy.id;
    if (!users.has(creatorId)) {
      logError(
        `ERROR: Creator not found for event ${eventId}. createdBy.id="${creatorId}", nickname="${dynEvent.createdBy.nickname}"`,
      );
      process.exit(1);
    }

    events.push({
      id: eventId,
      title: dynEvent.title,
      subtitle: dynEvent.subtitle ?? null,
      eventType: dynEvent.type,
      dateStart: dynEvent.dateStart,
      timeStart: dynEvent.timeStart ?? null,
      location: dynEvent.location ?? null,
      description: dynEvent.description ?? null,
      race: boolToInt(dynEvent.race),
      creatorId,
      createdAt: dynEvent._ct,
      updatedAt: dynEvent._md,
    });

    // Resolve participation
    const { records, orphaned } = resolveParticipants(eventId, dynEvent.participants, users);
    participations.push(...records);
    orphanedCount += orphaned;
  }

  return { events, participations, orphanedCount };
}

// ---------------------------------------------------------------------------
// 7. Generate seed.sql
// ---------------------------------------------------------------------------

function generateUserInserts(users: Map<string, UserRecord>): string[] {
  const statements: string[] = [];
  const allUsers = Array.from(users.values());
  const batchSize = 50;

  for (let i = 0; i < allUsers.length; i += batchSize) {
    const batch = allUsers.slice(i, i + batchSize);
    const values = batch.map(
      (u) =>
        `(${escapeSql(u.id)}, ${escapeSql(u.nickname)}, ${escapeSql(u.picture)}, ${escapeSql(u.createdAt)}, ${escapeSql(u.updatedAt)})`,
    );
    statements.push(
      `INSERT INTO users (id, nickname, picture, created_at, updated_at) VALUES\n${values.join(',\n')};`,
    );
  }

  return statements;
}

function generateEventInserts(events: EventRecord[]): string[] {
  const statements: string[] = [];
  const batchSize = 50;

  for (let i = 0; i < events.length; i += batchSize) {
    const batch = events.slice(i, i + batchSize);
    const values = batch.map(
      (e) =>
        `(${escapeSql(e.id)}, ${escapeSql(e.title)}, ${escapeSql(e.subtitle)}, ${escapeSql(e.eventType)}, ${escapeSql(e.dateStart)}, ${escapeSql(e.timeStart)}, ${escapeSql(e.location)}, ${escapeSql(e.description)}, ${e.race}, ${escapeSql(e.creatorId)}, ${escapeSql(e.createdAt)}, ${escapeSql(e.updatedAt)})`,
    );
    statements.push(
      `INSERT INTO events (id, title, subtitle, event_type, date_start, time_start, location, description, race, creator_id, created_at, updated_at) VALUES\n${values.join(',\n')};`,
    );
  }

  return statements;
}

function generateParticipationInserts(participations: ParticipationRecord[]): string[] {
  const statements: string[] = [];
  const batchSize = 50;

  for (let i = 0; i < participations.length; i += batchSize) {
    const batch = participations.slice(i, i + batchSize);
    const values = batch.map((p) => `(${escapeSql(p.userId)}, ${escapeSql(p.eventId)})`);
    statements.push(
      `INSERT INTO users_to_events (user_id, event_id) VALUES\n${values.join(',\n')};`,
    );
  }

  return statements;
}

function generateSeedSql(
  users: Map<string, UserRecord>,
  events: EventRecord[],
  participations: ParticipationRecord[],
): void {
  const parts: string[] = [];

  // Safety pragma
  parts.push('PRAGMA defer_foreign_keys = ON;');
  parts.push('');

  // Users first (dependency order)
  const userInserts = generateUserInserts(users);
  parts.push('-- Users');
  parts.push(...userInserts);
  parts.push('');

  // Events second
  const eventInserts = generateEventInserts(events);
  parts.push('-- Events');
  parts.push(...eventInserts);
  parts.push('');

  // Participation last
  const participationInserts = generateParticipationInserts(participations);
  parts.push('-- Participation');
  parts.push(...participationInserts);
  parts.push('');

  const sql = parts.join('\n');
  writeFileSync(SEED_FILE, sql, 'utf-8');

  log(
    `Generated seed.sql with ${userInserts.length} user insert(s), ${eventInserts.length} event insert(s), ${participationInserts.length} participation insert(s)`,
  );
}

// ---------------------------------------------------------------------------
// 8. Main
// ---------------------------------------------------------------------------

function main(): void {
  log('=== DynamoDB to D1 Migration ===\n');

  // Check all source files exist
  checkFilesExist();

  // Parse source data
  const users = parseAuth0Users();
  const dynamoEvents = parseDynamoEvents();

  // Transform and resolve references
  const { events, participations, orphanedCount } = transformEvents(dynamoEvents, users);

  // Generate seed SQL
  generateSeedSql(users, events, participations);

  // Print validation summary
  log('\n=== Validation Summary ===');
  log(`Total users: ${users.size}`);
  log(`Total events: ${events.length}`);
  log(`Total participation records: ${participations.length}`);
  log(`Orphaned participants skipped: ${orphanedCount}`);
  log('\nDone.');
}

main();
