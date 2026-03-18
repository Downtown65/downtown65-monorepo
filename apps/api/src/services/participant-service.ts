import { and, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { events, usersToEvents } from '@/db/schema';

type ParticipantResult = { ok: true } | { ok: false; error: 'NOT_FOUND' | 'PAST_EVENT' };

async function findUpcomingEvent(db: ReturnType<typeof drizzle>, eventId: string) {
  const rows = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  return rows[0] ?? null;
}

function isEventPast(dateStart: string): boolean {
  const today = new Date().toISOString().split('T')[0] as string;
  return dateStart < today;
}

export async function joinEvent(
  d1: D1Database,
  eventId: string,
  userId: string,
): Promise<ParticipantResult> {
  const db = drizzle(d1);

  const event = await findUpcomingEvent(db, eventId);
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
      eventId,
      joinedAt: now,
    })
    .onConflictDoNothing();

  return { ok: true };
}

export async function leaveEvent(
  d1: D1Database,
  eventId: string,
  userId: string,
): Promise<ParticipantResult> {
  const db = drizzle(d1);

  const event = await findUpcomingEvent(db, eventId);
  if (!event) {
    return { ok: false, error: 'NOT_FOUND' };
  }

  if (isEventPast(event.dateStart)) {
    return { ok: false, error: 'PAST_EVENT' };
  }

  await db
    .delete(usersToEvents)
    .where(and(eq(usersToEvents.userId, userId), eq(usersToEvents.eventId, eventId)));

  return { ok: true };
}
