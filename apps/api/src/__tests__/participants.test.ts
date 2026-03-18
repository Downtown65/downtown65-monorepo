import { env } from 'cloudflare:test';
import { beforeAll, describe, expect, it } from 'vitest';
import { createApiApp } from '@/create-app';
import { MockAuth0Service } from './mock-authentication-service';

const USER_1 = 'auth0|test-user-1';
const USER_2 = 'auth0|test-user-2';
const API_KEY = env.X_API_KEY;

const mockAuth = new MockAuth0Service();
const app = createApiApp(mockAuth);

function futureDate(): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().split('T')[0] as string;
}

function authHeaders(userId: string) {
  return {
    'x-api-key': API_KEY,
    authorization: `Bearer ${userId}`,
    'content-type': 'application/json',
  };
}

function apiKeyHeaders() {
  return {
    'x-api-key': API_KEY,
  };
}

async function createFutureEvent(title: string): Promise<string> {
  const res = await app.request(
    '/api/events',
    {
      method: 'POST',
      headers: authHeaders(USER_1),
      body: JSON.stringify({
        type: 'RUNNING',
        title,
        dateStart: futureDate(),
      }),
    },
    env,
  );
  const body = (await res.json()) as { id: string };
  return body.id;
}

async function createPastEvent(): Promise<string> {
  // Insert directly via D1 since the API doesn't allow creating past events
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await env.DB.prepare(
    'INSERT INTO events (id, title, event_type, date_start, race, creator_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  )
    .bind(id, 'Past Event', 'RUNNING', '2020-01-01', 0, USER_1, now, now)
    .run();
  return id;
}

beforeAll(async () => {
  const now = new Date().toISOString();
  await env.DB.prepare(
    'INSERT OR IGNORE INTO users (id, nickname, picture, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
  )
    .bind(USER_1, 'TestUser1', 'https://example.com/pic1.jpg', now, now)
    .run();
  await env.DB.prepare(
    'INSERT OR IGNORE INTO users (id, nickname, picture, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
  )
    .bind(USER_2, 'TestUser2', 'https://example.com/pic2.jpg', now, now)
    .run();
});

describe('POST /api/events/:id/participants (join)', () => {
  it('joins an event successfully', async () => {
    const eventId = await createFutureEvent('Join Test');
    const res = await app.request(
      `/api/events/${eventId}/participants`,
      { method: 'POST', headers: authHeaders(USER_1) },
      env,
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { message: string };
    expect(body.message).toBeDefined();
  });

  it('joining again is idempotent (returns 200)', async () => {
    const eventId = await createFutureEvent('Idempotent Join Test');

    await app.request(
      `/api/events/${eventId}/participants`,
      { method: 'POST', headers: authHeaders(USER_1) },
      env,
    );

    const res = await app.request(
      `/api/events/${eventId}/participants`,
      { method: 'POST', headers: authHeaders(USER_1) },
      env,
    );
    expect(res.status).toBe(200);
  });

  it('returns 400 for past event', async () => {
    const eventId = await createPastEvent();
    const res = await app.request(
      `/api/events/${eventId}/participants`,
      { method: 'POST', headers: authHeaders(USER_1) },
      env,
    );
    expect(res.status).toBe(400);
  });

  it('returns 404 for non-existent event', async () => {
    const res = await app.request(
      '/api/events/nonexistent-id/participants',
      { method: 'POST', headers: authHeaders(USER_1) },
      env,
    );
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/events/:id/participants (leave)', () => {
  it('leaves an event successfully', async () => {
    const eventId = await createFutureEvent('Leave Test');

    // Join first
    await app.request(
      `/api/events/${eventId}/participants`,
      { method: 'POST', headers: authHeaders(USER_1) },
      env,
    );

    // Leave
    const res = await app.request(
      `/api/events/${eventId}/participants`,
      { method: 'DELETE', headers: authHeaders(USER_1) },
      env,
    );
    expect(res.status).toBe(200);
  });

  it('leaving when not joined is idempotent (returns 200)', async () => {
    const eventId = await createFutureEvent('Idempotent Leave Test');
    const res = await app.request(
      `/api/events/${eventId}/participants`,
      { method: 'DELETE', headers: authHeaders(USER_1) },
      env,
    );
    expect(res.status).toBe(200);
  });

  it('returns 400 for past event', async () => {
    const eventId = await createPastEvent();
    const res = await app.request(
      `/api/events/${eventId}/participants`,
      { method: 'DELETE', headers: authHeaders(USER_1) },
      env,
    );
    expect(res.status).toBe(400);
  });
});

describe('participant list on event detail', () => {
  it('shows participant with nickname and joinedAt after joining', async () => {
    const eventId = await createFutureEvent('Participant Detail Test');

    // Join as USER_1
    await app.request(
      `/api/events/${eventId}/participants`,
      { method: 'POST', headers: authHeaders(USER_1) },
      env,
    );

    // Fetch event detail
    const res = await app.request(`/api/events/${eventId}`, { headers: apiKeyHeaders() }, env);
    expect(res.status).toBe(200);

    const body = (await res.json()) as {
      participants: Array<{ userId: string; nickname: string; joinedAt: string }>;
    };
    expect(body.participants).toHaveLength(1);
    expect(body.participants[0]).toMatchObject({
      userId: USER_1,
      nickname: 'TestUser1',
    });
    const participant = body.participants[0] as { joinedAt: string };
    expect(participant.joinedAt).toBeDefined();
  });

  it('participant removed after leaving', async () => {
    const eventId = await createFutureEvent('Leave Detail Test');

    // Join then leave
    await app.request(
      `/api/events/${eventId}/participants`,
      { method: 'POST', headers: authHeaders(USER_1) },
      env,
    );
    await app.request(
      `/api/events/${eventId}/participants`,
      { method: 'DELETE', headers: authHeaders(USER_1) },
      env,
    );

    const res = await app.request(`/api/events/${eventId}`, { headers: apiKeyHeaders() }, env);
    const body = (await res.json()) as { participants: unknown[] };
    expect(body.participants).toHaveLength(0);
  });
});
