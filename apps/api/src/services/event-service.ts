import { EVENT_TYPES, type EventType } from '@dt65/shared';
import { asc, eq, gte, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import z from 'zod';
import { eventIdCondition } from '@/db/query-helpers';
import { events, users, usersToEvents } from '@/db/schema';

type EventInput = {
  type: EventType;
  title: string;
  dateStart: string;
  timeStart?: string | undefined;
  location?: string | undefined;
  subtitle?: string | undefined;
  description?: string | undefined;
  race: boolean;
};

type EventUpdateInput = {
  type?: EventType | undefined;
  title?: string | undefined;
  dateStart?: string | undefined;
  timeStart?: string | undefined;
  location?: string | undefined;
  subtitle?: string | undefined;
  description?: string | undefined;
  race?: boolean | undefined;
};

type EventRow = {
  id: number;
  type: EventType;
  title: string;
  dateStart: string;
  timeStart: string | null;
  location: string | null;
  subtitle: string | null;
  description: string | null;
  race: boolean;
  creatorId: number;
  createdAt: string;
  updatedAt: string;
  participantCount: number;
};

type EventDetail = Omit<EventRow, 'participantCount'> & {
  participants: Array<{
    userId: number;
    nickname: string;
    joinedAt: string;
  }>;
};

const EventSummarySchema = z.object({
  id: z.number(),
  title: z.string(),
  subtitle: z.string(),
  dateStart: z.iso.date(),
  timeStart: z.iso.time().nullable(),
  type: z.enum(EVENT_TYPES),
  location: z.string().nullable(),
  race: z.coerce.boolean(),
  participantCount: z.number(),
  creator: z.object({
    id: z.number(),
    nickname: z.string(),
  }),
});

type EventSummary = z.infer<typeof EventSummarySchema>;

type Result<T> = { ok: true; data: T } | { ok: false; error: 'FORBIDDEN' | 'NOT_FOUND' };

function toBool(value: number): boolean {
  return value === 1;
}

function buildUpdateFields(data: EventUpdateInput): Record<string, unknown> {
  const fields: Record<string, unknown> = {};
  const fieldMap: Record<string, unknown> = {
    eventType: data.type,
    title: data.title,
    dateStart: data.dateStart,
    timeStart: data.timeStart,
    location: data.location,
    subtitle: data.subtitle,
    description: data.description,
  };

  for (const [key, value] of Object.entries(fieldMap)) {
    if (value !== undefined) {
      fields[key] = value;
    }
  }

  if (data.race !== undefined) {
    fields.race = data.race ? 1 : 0;
  }

  return fields;
}

function toEventRow(event: typeof events.$inferSelect, participantCount: number): EventRow {
  return {
    id: event.id,
    type: event.eventType as EventType,
    title: event.title,
    dateStart: event.dateStart,
    timeStart: event.timeStart,
    location: event.location,
    subtitle: event.subtitle,
    description: event.description,
    race: toBool(event.race),
    creatorId: event.creatorId,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
    participantCount,
  };
}

async function findEventById(db: ReturnType<typeof drizzle>, idParam: string) {
  const condition = eventIdCondition(idParam);
  const rows = await db.select().from(events).where(condition).limit(1);
  return rows[0] ?? null;
}

async function getParticipantCount(
  db: ReturnType<typeof drizzle>,
  eventId: number,
): Promise<number> {
  const rows = await db
    .select({ count: sql<number>`count(*)` })
    .from(usersToEvents)
    .where(eq(usersToEvents.eventId, eventId));
  return rows[0]?.count ?? 0;
}

export async function createEvent(
  d1: D1Database,
  data: EventInput,
  creatorId: number,
): Promise<EventRow> {
  const db = drizzle(d1);
  const now = new Date().toISOString();

  const rows = await db
    .insert(events)
    .values({
      title: data.title,
      subtitle: data.subtitle ?? null,
      eventType: data.type,
      dateStart: data.dateStart,
      timeStart: data.timeStart ?? null,
      location: data.location ?? null,
      description: data.description ?? null,
      race: data.race ? 1 : 0,
      creatorId,
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: events.id });

  const id = rows[0]?.id as number;

  return {
    id,
    type: data.type,
    title: data.title,
    dateStart: data.dateStart,
    timeStart: data.timeStart ?? null,
    location: data.location ?? null,
    subtitle: data.subtitle ?? null,
    description: data.description ?? null,
    race: data.race,
    creatorId,
    createdAt: now,
    updatedAt: now,
    participantCount: 0,
  };
}

export async function getEventById(d1: D1Database, idParam: string): Promise<EventDetail | null> {
  const db = drizzle(d1);

  const event = await findEventById(db, idParam);
  if (!event) {
    return null;
  }

  const participantRows = await db
    .select({
      userId: usersToEvents.userId,
      nickname: users.nickname,
      joinedAt: usersToEvents.joinedAt,
    })
    .from(usersToEvents)
    .innerJoin(users, eq(usersToEvents.userId, users.id))
    .where(eq(usersToEvents.eventId, event.id));

  return {
    id: event.id,
    type: event.eventType as EventType,
    title: event.title,
    dateStart: event.dateStart,
    timeStart: event.timeStart,
    location: event.location,
    subtitle: event.subtitle,
    description: event.description,
    race: toBool(event.race),
    creatorId: event.creatorId,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
    participants: participantRows,
  };
}

export async function updateEvent(
  d1: D1Database,
  idParam: string,
  data: EventUpdateInput,
  requesterId: number,
): Promise<Result<EventRow>> {
  const db = drizzle(d1);

  const event = await findEventById(db, idParam);
  if (!event) {
    return { ok: false, error: 'NOT_FOUND' };
  }

  if (event.creatorId !== requesterId) {
    return { ok: false, error: 'FORBIDDEN' };
  }

  const now = new Date().toISOString();
  const updateFields = { ...buildUpdateFields(data), updatedAt: now };

  await db.update(events).set(updateFields).where(eq(events.id, event.id));

  const updatedRows = await findEventById(db, String(event.id));
  const count = await getParticipantCount(db, event.id);

  return { ok: true, data: toEventRow(updatedRows ?? event, count) };
}

export async function deleteEvent(
  d1: D1Database,
  idParam: string,
  requesterId: number,
): Promise<Result<void>> {
  const db = drizzle(d1);

  const event = await findEventById(db, idParam);
  if (!event) {
    return { ok: false, error: 'NOT_FOUND' };
  }

  if (event.creatorId !== requesterId) {
    return { ok: false, error: 'FORBIDDEN' };
  }

  await db.delete(events).where(eq(events.id, event.id));

  return { ok: true, data: undefined };
}

export async function listUpcomingEvents(d1: D1Database): Promise<EventSummary[]> {
  const db = drizzle(d1);
  const today = new Date().toISOString().split('T')[0] as string;

  const rows = await db
    .select({
      id: events.id,
      title: events.title,
      subtitle: events.subtitle,
      dateStart: events.dateStart,
      timeStart: events.timeStart,
      type: events.eventType,
      location: events.location,
      race: events.race,
      creator: {
        id: users.id,
        nickname: users.nickname,
      },
      participantCount: sql<number>`(
        SELECT count(*) FROM users_to_events
        WHERE users_to_events.event_id = ${events.id}
      )`,
    })
    .from(events)
    .innerJoin(users, eq(events.creatorId, users.id))
    .where(gte(events.dateStart, today))
    .orderBy(asc(events.dateStart));

  return rows.map((row) => EventSummarySchema.parse(row));
}
