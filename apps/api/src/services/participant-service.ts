import { and, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { eventIdCondition } from '@/db/query-helpers';
import { events, usersToEvents } from '@/db/schema';

type ParticipantResult = { ok: true } | { ok: false; error: 'NOT_FOUND' | 'PAST_EVENT' };

async function findEvent(db: ReturnType<typeof drizzle>, idParam: string) {
  const condition = eventIdCondition(idParam);
  const rows = await db.select().from(events).where(condition).limit(1);
  return rows[0] ?? null;
}

function isEventPast(dateStart: string): boolean {
  const today = new Date().toISOString().split('T')[0] as string;
  return dateStart < today;
}

export async function joinEvent(
  d1: D1Database,
  idParam: string,
  userId: number,
): Promise<ParticipantResult> {
  const db = drizzle(d1);

  const event = await findEvent(db, idParam);
  if (!event) {
    return { ok: false, error: 'NOT_FOUND' };
  }

  if (isEventPast(event.dateStart)) {
    return { ok: false, error: 'PAST_EVENT' };
  }

  const now = new Date().toISOString();

  await db
    .insert(usersToEvents)
    .values({
      userId,
      eventId: event.id,
      joinedAt: now,
    })
    .onConflictDoNothing();

  return { ok: true };
}

export async function leaveEvent(
  d1: D1Database,
  idParam: string,
  userId: number,
): Promise<ParticipantResult> {
  const db = drizzle(d1);

  const event = await findEvent(db, idParam);
  if (!event) {
    return { ok: false, error: 'NOT_FOUND' };
  }

  if (isEventPast(event.dateStart)) {
    return { ok: false, error: 'PAST_EVENT' };
  }

  await db
    .delete(usersToEvents)
    .where(and(eq(usersToEvents.userId, userId), eq(usersToEvents.eventId, event.id)));

  return { ok: true };
}
