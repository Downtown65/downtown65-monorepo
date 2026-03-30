import { env } from 'cloudflare:test';
import { drizzle } from 'drizzle-orm/d1';
import { events, users } from '@/db/schema';

export function getTestDb() {
  return drizzle(env.DB);
}

export async function insertTestUser(user: {
  auth0Sub: string;
  nickname: string;
  picture: string;
}): Promise<number> {
  const db = getTestDb();
  const now = new Date().toISOString();

  const rows = await db
    .insert(users)
    .values({
      auth0Sub: user.auth0Sub,
      nickname: user.nickname,
      picture: user.picture,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoNothing()
    .returning({ id: users.id });

  return rows[0]?.id as number;
}

export async function insertPastEvent(creatorId: number): Promise<number> {
  const db = getTestDb();
  const now = new Date().toISOString();

  const rows = await db
    .insert(events)
    .values({
      title: 'Past Event',
      subtitle: 'Mennyt tapahtuma',
      eventType: 'RUNNING',
      dateStart: '2020-01-01',
      location: 'Keskuspuisto',
      race: 0,
      creatorId,
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: events.id });

  return rows[0]?.id as number;
}
