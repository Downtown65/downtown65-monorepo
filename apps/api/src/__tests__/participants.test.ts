import { env } from 'cloudflare:test';
import { ENV } from 'varlock/env';
import { beforeAll, describe, expect, it } from 'vitest';
import { createApiApp } from '@/create-app';
import { MockAuth0Service } from './mock-authentication-service';
import { MockManagementService } from './mock-management-service';
import { insertPastEvent, insertTestUser } from './test-helpers';

const AUTH0_SUB_1 = 'auth0|test-user-1';
const AUTH0_SUB_2 = 'auth0|test-user-2';
const API_KEY = ENV.X_API_KEY;

const mockAuth = new MockAuth0Service();
const app = createApiApp(mockAuth, new MockManagementService());

let userId1: number;

function futureDate(): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().split('T')[0] as string;
}

function authHeaders(auth0Sub: string) {
  return {
    'x-api-key': API_KEY,
    authorization: `Bearer ${auth0Sub}`,
    'content-type': 'application/json',
  };
}

function apiKeyHeaders() {
  return {
    'x-api-key': API_KEY,
  };
}

async function createFutureEvent(title: string): Promise<number> {
  const res = await app.request(
    '/api/events',
    {
      method: 'POST',
      headers: authHeaders(AUTH0_SUB_1),
      body: JSON.stringify({
        type: 'RUNNING',
        title,
        dateStart: futureDate(),
      }),
    },
    env,
  );
  const body = (await res.json()) as { id: number };
  return body.id;
}

beforeAll(async () => {
  userId1 = await insertTestUser({
    auth0Sub: AUTH0_SUB_1,
    nickname: 'TestUser1',
    picture: 'https://example.com/pic1.jpg',
  });
  await insertTestUser({
    auth0Sub: AUTH0_SUB_2,
    nickname: 'TestUser2',
    picture: 'https://example.com/pic2.jpg',
  });
});

describe('POST /api/events/:id/participants (join)', () => {
  it('joins an event successfully', async () => {
    const eventId = await createFutureEvent('Join Test');
    const res = await app.request(
      `/api/events/${eventId}/participants`,
      { method: 'POST', headers: authHeaders(AUTH0_SUB_1) },
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
      { method: 'POST', headers: authHeaders(AUTH0_SUB_1) },
      env,
    );

    const res = await app.request(
      `/api/events/${eventId}/participants`,
      { method: 'POST', headers: authHeaders(AUTH0_SUB_1) },
      env,
    );
    expect(res.status).toBe(200);
  });

  it('returns 400 for past event', async () => {
    const eventId = await insertPastEvent(userId1);
    const res = await app.request(
      `/api/events/${eventId}/participants`,
      { method: 'POST', headers: authHeaders(AUTH0_SUB_1) },
      env,
    );
    expect(res.status).toBe(400);
  });

  it('returns 404 for non-existent event', async () => {
    const res = await app.request(
      '/api/events/999999/participants',
      { method: 'POST', headers: authHeaders(AUTH0_SUB_1) },
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
      { method: 'POST', headers: authHeaders(AUTH0_SUB_1) },
      env,
    );

    // Leave
    const res = await app.request(
      `/api/events/${eventId}/participants`,
      { method: 'DELETE', headers: authHeaders(AUTH0_SUB_1) },
      env,
    );
    expect(res.status).toBe(200);
  });

  it('leaving when not joined is idempotent (returns 200)', async () => {
    const eventId = await createFutureEvent('Idempotent Leave Test');
    const res = await app.request(
      `/api/events/${eventId}/participants`,
      { method: 'DELETE', headers: authHeaders(AUTH0_SUB_1) },
      env,
    );
    expect(res.status).toBe(200);
  });

  it('returns 400 for past event', async () => {
    const eventId = await insertPastEvent(userId1);
    const res = await app.request(
      `/api/events/${eventId}/participants`,
      { method: 'DELETE', headers: authHeaders(AUTH0_SUB_1) },
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
      { method: 'POST', headers: authHeaders(AUTH0_SUB_1) },
      env,
    );

    // Fetch event detail
    const res = await app.request(`/api/events/${eventId}`, { headers: apiKeyHeaders() }, env);
    expect(res.status).toBe(200);

    const body = (await res.json()) as {
      participants: Array<{ userId: number; nickname: string; joinedAt: string }>;
    };
    expect(body.participants).toHaveLength(1);
    expect(body.participants[0]).toMatchObject({
      userId: userId1,
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
      { method: 'POST', headers: authHeaders(AUTH0_SUB_1) },
      env,
    );
    await app.request(
      `/api/events/${eventId}/participants`,
      { method: 'DELETE', headers: authHeaders(AUTH0_SUB_1) },
      env,
    );

    const res = await app.request(`/api/events/${eventId}`, { headers: apiKeyHeaders() }, env);
    const body = (await res.json()) as { participants: unknown[] };
    expect(body.participants).toHaveLength(0);
  });
});
