# Phase 3: Database and Data Migration - Research

**Researched:** 2026-03-17
**Domain:** Cloudflare D1, Drizzle ORM, DynamoDB-to-D1 data migration
**Confidence:** HIGH

## Summary

This phase sets up a Cloudflare D1 (SQLite) database with three tables (`events`, `users`, `users_to_events`) using Drizzle ORM for schema definition and migration generation. A TypeScript migration script reads 4 DynamoDB JSON exports and 1 Auth0 user export, deduplicates, transforms, and generates SQL INSERT statements, which are applied via `wrangler d1 execute --file`.

D1 enforces foreign keys by default (no PRAGMA needed), supports Time Travel for backup/restore (30 days on paid plan), and handles SQL files up to 5 GB via `wrangler d1 execute --file`. The key constraint is that individual SQL statements must stay under 100 KB, so INSERT batches should be chunked (roughly 50-100 rows per INSERT to be safe given HTML description fields).

**Primary recommendation:** Use `drizzle-kit generate` to produce SQL migration files from a Drizzle schema, apply with `wrangler d1 migrations apply`, then seed data via a generated `.sql` file applied with `wrangler d1 execute --file`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Three tables: `events`, `users`, `users_to_events` (schema already designed -- see existing SQL)
- `eventType` stored as text, validated via Zod enum in the API layer (not CHECK constraint)
- `description` field stores raw HTML as-is from DynamoDB (events app renders it)
- No `email_preferences` table -- deferred to Phase 6 (currently stored in Auth0)
- Event types are not enforced at DB level
- 4 JSON dump files from DynamoDB containing event data -- merge all, deduplicate by eventId/ULID
- Separate Auth0 user export JSON with ~75 users (Id, Nickname, Picture)
- All source files are gitignored, placed locally before running migration
- Users table populated from Auth0 export (canonical source), not extracted from DynamoDB events
- Some DynamoDB event participants won't exist in the Auth0 user export (deleted accounts)
- Schema: `drizzle-kit generate` -> `wrangler d1 migrations apply`
- Data seeding: Generate a SQL file with INSERT statements from JSON, apply via `wrangler d1 execute`
- Migrate events, users, AND participation data (full history preserved)
- Event `creatorId` resolved to user ID -- migration fails if creator not found in users table
- Orphaned participants (auth0 sub not in users export): skip and print warning to console
- Migration requires fresh DB (not idempotent) -- to re-run: drop DB, apply schema, then seed
- Automated count checks: event count, user count, participation counts per event compared to source
- Console output only -- no report file generated
- No custom backup procedure -- D1 Time Travel is sufficient

### Claude's Discretion
- Deduplication strategy for merging 4 JSON files (by eventId ULID)
- SQL generation script implementation details
- Exact console output format for warnings and validation summary

### Deferred Ideas (OUT OF SCOPE)
- Email preferences table -- Phase 6 (currently in Auth0)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DATA-01 | D1 database schema for events, participation, email preferences | Drizzle ORM schema definition with `sqliteTable`, foreign keys, indexes. Note: email preferences deferred to Phase 6 per CONTEXT.md -- only events, users, users_to_events tables in this phase |
| DATA-02 | ~1000 existing events migrated from DynamoDB to D1 | TypeScript migration script reads DynamoDB JSON + Auth0 export, generates SQL file, applied via `wrangler d1 execute --file`. Chunked INSERTs to stay under 100 KB statement limit |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| drizzle-orm | 0.45.1 | Type-safe ORM for D1/SQLite | Official Cloudflare D1 integration, TypeScript-first, lightweight |
| drizzle-kit | 0.31.10 | Schema migration generation | Generates SQL migrations from Drizzle schema, works with wrangler d1 |
| wrangler | 4.72.0 (already in catalog) | D1 CLI operations | `d1 create`, `d1 execute --file`, `d1 migrations apply` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| tsx | 4.21.0 (already in catalog) | Run TypeScript migration script | Execute the seed data generation script locally |
| zod | 4.3.5 (already in catalog) | Validate DynamoDB/Auth0 JSON input | Parse and validate source data before transformation |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Drizzle ORM | Raw SQL | Drizzle provides type safety and migration tooling; raw SQL is error-prone for schema evolution |
| drizzle-kit generate | drizzle-kit push | `push` skips migration files -- `generate` creates reviewable SQL files tracked in git |

**Installation:**
```bash
pnpm --filter @dt65/api add drizzle-orm
pnpm --filter @dt65/api add -D drizzle-kit
```

Also add to `pnpm-workspace.yaml` catalog:
```yaml
drizzle-orm: 0.45.1
drizzle-kit: 0.31.10
```

## Architecture Patterns

### Recommended Project Structure
```
apps/api/
├── src/
│   └── db/
│       └── schema.ts          # Drizzle schema (events, users, users_to_events)
├── drizzle/                   # Generated SQL migration files (tracked in git)
│   └── 0000_initial.sql
├── drizzle.config.ts          # Drizzle Kit configuration
├── scripts/
│   └── seed-from-dynamo.ts    # Migration script: JSON -> SQL file
├── data/                      # gitignored: DynamoDB + Auth0 JSON exports
│   ├── events-dump-1.json
│   ├── events-dump-2.json
│   ├── events-dump-3.json
│   ├── events-dump-4.json
│   └── auth0-users.json
└── wrangler.jsonc             # D1 binding configuration
```

### Pattern 1: Drizzle Schema Definition for D1
**What:** Define all tables in a single schema file using Drizzle's SQLite column types
**When to use:** Always -- this is the schema source of truth

```typescript
// apps/api/src/db/schema.ts
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),           // Auth0 sub (e.g., "auth0|abc123")
  nickname: text('nickname').notNull(),
  picture: text('picture').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const events = sqliteTable(
  'events',
  {
    id: text('id').primaryKey(),            // ULID from DynamoDB
    title: text('title').notNull(),
    subtitle: text('subtitle'),
    eventType: text('event_type').notNull(), // validated in API layer, not DB
    dateStart: text('date_start').notNull(), // ISO date string
    timeStart: text('time_start'),
    location: text('location'),
    description: text('description'),        // raw HTML
    race: integer('race').notNull().default(0), // boolean as 0/1
    creatorId: text('creator_id')
      .notNull()
      .references(() => users.id),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    index('events_date_start_idx').on(table.dateStart),
    index('events_event_type_idx').on(table.eventType),
    index('events_creator_id_idx').on(table.creatorId),
  ],
);

export const usersToEvents = sqliteTable(
  'users_to_events',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    eventId: text('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.eventId] }),
  ],
);
```

### Pattern 2: Drizzle Config for D1
**What:** Configure drizzle-kit to generate SQL migrations for D1
**When to use:** Required for `drizzle-kit generate`

```typescript
// apps/api/drizzle.config.ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'sqlite',
});
```

Note: The `driver: 'd1-http'` and `dbCredentials` are only needed for `drizzle-kit push` or `drizzle-kit pull` (remote operations). For `drizzle-kit generate` (which only reads the schema file and produces SQL), no credentials are needed.

### Pattern 3: Wrangler D1 Binding
**What:** Configure D1 database binding in wrangler.jsonc
**When to use:** Required to connect the Worker to D1

```jsonc
// apps/api/wrangler.jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "downtown65-db",
      "database_id": "<from wrangler d1 create>",
      "migrations_dir": "drizzle"
    }
  ]
}
```

Setting `migrations_dir` to `"drizzle"` tells `wrangler d1 migrations apply` to look for SQL files in the `drizzle/` directory (where `drizzle-kit generate` outputs them).

### Pattern 4: Migration Script Structure
**What:** TypeScript script that reads JSON files, transforms data, generates SQL
**When to use:** One-time data seeding from DynamoDB/Auth0 exports

```typescript
// Pseudocode for scripts/seed-from-dynamo.ts
// 1. Read all 4 DynamoDB JSON files
// 2. Merge and deduplicate events by ULID (from PK: EVENT#<ULID>)
// 3. Read Auth0 user export
// 4. Build userId lookup map from Auth0 data (keyed by Auth0 sub/Id)
// 5. Generate INSERT statements for users
// 6. Generate INSERT statements for events (resolve creatorId via lookup)
// 7. Generate INSERT statements for users_to_events (skip orphaned participants)
// 8. Write seed.sql file
// 9. Print validation summary (counts, warnings)
```

### Anti-Patterns to Avoid
- **Giant single INSERT:** Never put all 1000 events in one INSERT statement. D1 has a 100 KB per-statement limit. Batch into groups of ~50 rows.
- **Using drizzle-kit push in production:** Always use `generate` + `wrangler d1 migrations apply` for reproducible, auditable migrations.
- **Storing dates as integers:** Use ISO 8601 text strings -- SQLite has no native date type, and text is human-readable and sortable.
- **Relying on AUTOINCREMENT for IDs:** Events already have ULIDs, users have Auth0 subs. Use text primary keys to preserve existing IDs.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Schema migrations | Manual CREATE TABLE SQL | `drizzle-kit generate` | Tracks schema changes, generates correct SQL, handles diffs |
| D1 backup/restore | Custom backup scripts | D1 Time Travel | Built-in, 30-day retention on paid plan, zero config |
| SQL escaping | String concatenation | Parameterized values or proper SQL escaping | SQL injection, special characters in HTML descriptions |
| ULID generation | Custom implementation | Existing ULIDs from DynamoDB | Events already have stable IDs -- preserve them |

**Key insight:** The migration is a one-time data transformation, not an ongoing ETL pipeline. Keep it simple -- a single TypeScript script that generates a SQL file is sufficient. No need for streaming, queuing, or retry logic for ~1000 events.

## Common Pitfalls

### Pitfall 1: SQL Statement Size Limit
**What goes wrong:** A single INSERT with many rows or rows containing large HTML descriptions exceeds 100 KB.
**Why it happens:** D1 enforces a 100 KB max per individual SQL statement.
**How to avoid:** Batch INSERT statements into groups of ~50 rows. For very large description fields, consider even smaller batches.
**Warning signs:** "Statement too long" error from `wrangler d1 execute`.

### Pitfall 2: Foreign Key Enforcement During Seed
**What goes wrong:** INSERT into `events` fails because `creatorId` references a user not yet inserted.
**Why it happens:** D1 enforces foreign keys by default (no PRAGMA needed). Insert order matters.
**How to avoid:** Insert in dependency order: 1) users, 2) events, 3) users_to_events. Use `PRAGMA defer_foreign_keys = ON` at the top of the seed file if needed for flexibility.
**Warning signs:** "FOREIGN KEY constraint failed" error.

### Pitfall 3: HTML Content in SQL
**What goes wrong:** HTML in description fields contains single quotes, newlines, or other characters that break SQL strings.
**Why it happens:** String concatenation without proper escaping.
**How to avoid:** Use proper SQL string escaping -- replace `'` with `''` in all text values. Also handle null bytes and other special characters.
**Warning signs:** SQL syntax errors during seed execution.

### Pitfall 4: DynamoDB Field Name Mapping
**What goes wrong:** Fields are silently dropped or misnamed during transformation.
**Why it happens:** DynamoDB uses `_ct`/`_md`, `type`, `PK`/`SK`, `createdBy.id` while D1 uses `created_at`/`updated_at`, `event_type`, `id`, `creator_id`.
**How to avoid:** Create an explicit field mapping and validate every event has all required fields before generating SQL.
**Warning signs:** NULL values in D1 where data should exist.

### Pitfall 5: drizzle/ Directory as migrations_dir
**What goes wrong:** `wrangler d1 migrations apply` cannot find migration files.
**Why it happens:** By default, wrangler looks in `migrations/` but Drizzle Kit outputs to `drizzle/` (configurable via `out` in drizzle.config.ts).
**How to avoid:** Set `migrations_dir: "drizzle"` in wrangler.jsonc D1 binding config, matching the `out` path in drizzle.config.ts.
**Warning signs:** "No migrations to apply" when migrations exist.

### Pitfall 6: Boolean/Integer Mismatch for race Field
**What goes wrong:** DynamoDB stores `race` as boolean (`true`/`false`), D1 needs integer (`1`/`0`).
**Why it happens:** SQLite has no native boolean type.
**How to avoid:** Explicitly convert `true` -> `1`, `false` -> `0` in the migration script.
**Warning signs:** Type errors or unexpected query results.

## Code Examples

### Generating and Applying Schema Migration
```bash
# 1. Generate SQL migration from Drizzle schema
cd apps/api
npx drizzle-kit generate

# 2. Create D1 database (first time only)
npx wrangler d1 create downtown65-db

# 3. Apply migrations locally
npx wrangler d1 migrations apply downtown65-db --local

# 4. Apply migrations to remote/production
npx wrangler d1 migrations apply downtown65-db --remote
```

### Seeding Data
```bash
# 1. Run migration script to generate SQL
cd apps/api
npx tsx scripts/seed-from-dynamo.ts

# 2. Apply seed SQL locally
npx wrangler d1 execute downtown65-db --local --file=./data/seed.sql

# 3. Apply seed SQL to remote/production
npx wrangler d1 execute downtown65-db --remote --file=./data/seed.sql
```

### SQL Escaping Utility
```typescript
function escapeSql(value: string | null | undefined): string {
  if (value == null) return 'NULL';
  return `'${value.replace(/'/g, "''")}'`;
}
```

### DynamoDB Event ID Extraction
```typescript
// DynamoDB PK format: "EVENT#01GPXYZ..."
function extractEventId(pk: string): string {
  const parts = pk.split('#');
  const id = parts[1];
  if (!id) {
    throw new Error(`Invalid PK format: ${pk}`);
  }
  return id;
}
```

### D1 Time Travel Backup/Restore
```bash
# Check current time travel info
npx wrangler d1 time-travel info downtown65-db

# Restore to a specific timestamp (Unix timestamp)
npx wrangler d1 time-travel restore downtown65-db --timestamp=1710000000
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `drizzle-kit migrate` applies to D1 directly | `drizzle-kit generate` + `wrangler d1 migrations apply` | Drizzle Kit 0.30+ | Wrangler manages D1 migration state, Drizzle just generates SQL |
| PRAGMA foreign_keys = ON needed | D1 enforces foreign keys by default | D1 GA (2024) | No PRAGMA needed, foreign keys always enforced |
| Manual D1 backups | D1 Time Travel (30-day retention) | D1 GA (2024) | Zero-config backup with point-in-time restore |
| `driver: 'd1'` in drizzle config | `driver: 'd1-http'` for remote, no driver for generate-only | Drizzle Kit 0.29+ | Config depends on use case |

**Deprecated/outdated:**
- `drizzle-kit migrate` for D1: Use `wrangler d1 migrations apply` instead -- wrangler manages the migration tracking table
- `driver: 'd1'` in drizzle.config.ts: Replaced by `'d1-http'` for remote operations

## Open Questions

1. **Exact DynamoDB JSON structure**
   - What we know: PK/SK pattern with `EVENT#<ULID>`, `createdBy` object with `{nickname, picture, id}`, `participants` map, fields `_ct`/`_md`/`type`/`race`/`title`/`subtitle`/`description`/`location`/`dateStart`/`timeStart`
   - What's unclear: Exact shape of `participants` map (is it `{ auth0Sub: { nickname, picture } }` or different?), whether `timeStart` is always present or optional, exact timestamp format of `_ct`/`_md`
   - Recommendation: The migration script should use Zod to parse and validate the DynamoDB JSON, catching structural surprises early. Print a sample event on first run to verify assumptions.

2. **Auth0 User ID Format**
   - What we know: Auth0 exports have `Id` field, DynamoDB events reference users by `createdBy.id`
   - What's unclear: Whether Auth0 `Id` matches `createdBy.id` exactly (e.g., `auth0|abc123` vs just `abc123`)
   - Recommendation: Log the first few matched/unmatched IDs during migration to verify the mapping works.

3. **Schema Design Reference**
   - What we know: CONTEXT.md says "schema already designed -- see existing SQL"
   - What's unclear: Where this existing SQL lives (not found in codebase search)
   - Recommendation: The schema example in this research should be treated as a starting point. Verify against any existing SQL the user can provide.

## Sources

### Primary (HIGH confidence)
- Drizzle ORM official docs (orm.drizzle.team) - schema definition, D1 setup, indexes, foreign keys
- Cloudflare D1 official docs (developers.cloudflare.com/d1) - foreign keys (enabled by default), Time Travel (30-day retention), limits (100 KB statement, 5 GB file import), migration commands
- npm registry - drizzle-orm 0.45.1, drizzle-kit 0.31.10 (current latest)

### Secondary (MEDIUM confidence)
- Drizzle Kit migration workflow for D1 - `generate` + `wrangler d1 migrations apply` as recommended approach (verified across multiple docs pages)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Drizzle ORM + D1 is the documented and recommended approach by both Cloudflare and Drizzle
- Architecture: HIGH - Schema pattern, migration workflow, and seed approach are well-documented
- Pitfalls: HIGH - D1 limits (100 KB statement, foreign key enforcement) are documented in official Cloudflare docs

**Research date:** 2026-03-17
**Valid until:** 2026-04-17 (stable ecosystem, 30-day validity)
