import { env } from 'cloudflare:test';
import { ENV } from 'varlock/env';
import { beforeAll, describe, expect, it } from 'vitest';
import { createApiApp } from '@/create-app';
import { MockAuth0Service } from './mock-authentication-service';
import { MockManagementService } from './mock-management-service';
import { insertTestUser } from './test-helpers';

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

function createEventBody(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    type: 'RUNNING',
    title: 'Test Event',
    dateStart: futureDate(),
    location: 'Keskuspuisto',
    subtitle: 'Aamulenkki',
    race: false,
    ...overrides,
  });
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

describe('health check', () => {
  it('GET / returns 200 with status ok', async () => {
    const res = await app.request('/', {}, env);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ status: 'ok' });
  });
});

describe('API key validation', () => {
  it('returns 401 without x-api-key', async () => {
    const res = await app.request('/api/events', { method: 'GET' }, env);
    expect(res.status).toBe(401);
  });

  it('returns 401 with invalid x-api-key', async () => {
    const res = await app.request('/api/events', { headers: { 'x-api-key': 'wrong-key' } }, env);
    expect(res.status).toBe(401);
  });
});

describe('POST /api/events', () => {
  it('creates event with valid data', async () => {
    const res = await app.request(
      '/api/events',
      {
        method: 'POST',
        headers: authHeaders(AUTH0_SUB_1),
        body: createEventBody({ title: 'Morning Run' }),
      },
      env,
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toMatchObject({
      title: 'Morning Run',
      type: 'RUNNING',
      creatorId: userId1,
      race: false,
    });
  });

  it('returns 400 with missing required fields', async () => {
    const res = await app.request(
      '/api/events',
      {
        method: 'POST',
        headers: authHeaders(AUTH0_SUB_1),
        body: JSON.stringify({ title: 'No type or date' }),
      },
      env,
    );
    expect(res.status).toBe(400);
  });
});

describe('GET /api/events', () => {
  it('returns upcoming events', async () => {
    const res = await app.request('/api/events', { headers: authHeaders(AUTH0_SUB_1) }, env);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  it('returns events ordered by dateStart ASC', async () => {
    const date1 = futureDate();
    const date2 = new Date();
    date2.setFullYear(date2.getFullYear() + 2);
    const dateStr2 = date2.toISOString().split('T')[0] as string;

    await app.request(
      '/api/events',
      {
        method: 'POST',
        headers: authHeaders(AUTH0_SUB_1),
        body: createEventBody({ type: 'CYCLING', title: 'Later', dateStart: dateStr2 }),
      },
      env,
    );
    await app.request(
      '/api/events',
      {
        method: 'POST',
        headers: authHeaders(AUTH0_SUB_1),
        body: createEventBody({ title: 'Sooner', dateStart: date1 }),
      },
      env,
    );

    const res = await app.request('/api/events', { headers: authHeaders(AUTH0_SUB_1) }, env);
    const body = (await res.json()) as Array<{ dateStart: string }>;

    for (let i = 1; i < body.length; i++) {
      const current = body[i] as { dateStart: string };
      const previous = body[i - 1] as { dateStart: string };
      expect(current.dateStart >= previous.dateStart).toBe(true);
    }
  });
});

describe('GET /api/events/:id', () => {
  it('returns event detail with participants (public, no JWT)', async () => {
    const createRes = await app.request(
      '/api/events',
      {
        method: 'POST',
        headers: authHeaders(AUTH0_SUB_1),
        body: createEventBody({ title: 'Public Detail Test' }),
      },
      env,
    );
    const created = (await createRes.json()) as { id: number };

    const res = await app.request(`/api/events/${created.id}`, { headers: apiKeyHeaders() }, env);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { participants: unknown[] };
    expect(body).toMatchObject({ title: 'Public Detail Test' });
    expect(Array.isArray(body.participants)).toBe(true);
  });

  it('returns 404 for non-existent event', async () => {
    const res = await app.request('/api/events/999999', { headers: apiKeyHeaders() }, env);
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/events/:id', () => {
  it('owner can update event', async () => {
    const createRes = await app.request(
      '/api/events',
      {
        method: 'POST',
        headers: authHeaders(AUTH0_SUB_1),
        body: createEventBody({ title: 'To Be Updated' }),
      },
      env,
    );
    const created = (await createRes.json()) as { id: number };

    const res = await app.request(
      `/api/events/${created.id}`,
      {
        method: 'PUT',
        headers: authHeaders(AUTH0_SUB_1),
        body: JSON.stringify({ title: 'Updated Title' }),
      },
      env,
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { title: string };
    expect(body.title).toBe('Updated Title');
  });

  it('any user can update event', async () => {
    const createRes = await app.request(
      '/api/events',
      {
        method: 'POST',
        headers: authHeaders(AUTH0_SUB_1),
        body: createEventBody({ title: 'Ownership Test' }),
      },
      env,
    );
    const created = (await createRes.json()) as { id: number };

    const res = await app.request(
      `/api/events/${created.id}`,
      {
        method: 'PUT',
        headers: authHeaders(AUTH0_SUB_2),
        body: JSON.stringify({ title: 'Updated by another user' }),
      },
      env,
    );
    expect(res.status).toBe(200);
  });
});

describe('DELETE /api/events/:id', () => {
  it('owner can delete event', async () => {
    const createRes = await app.request(
      '/api/events',
      {
        method: 'POST',
        headers: authHeaders(AUTH0_SUB_1),
        body: createEventBody({ title: 'To Be Deleted' }),
      },
      env,
    );
    const created = (await createRes.json()) as { id: number };

    const res = await app.request(
      `/api/events/${created.id}`,
      { method: 'DELETE', headers: authHeaders(AUTH0_SUB_1) },
      env,
    );
    expect(res.status).toBe(204);

    const getRes = await app.request(
      `/api/events/${created.id}`,
      { headers: apiKeyHeaders() },
      env,
    );
    expect(getRes.status).toBe(404);
  });

  it('non-owner gets 403', async () => {
    const createRes = await app.request(
      '/api/events',
      {
        method: 'POST',
        headers: authHeaders(AUTH0_SUB_1),
        body: createEventBody({ title: 'Cannot Delete' }),
      },
      env,
    );
    const created = (await createRes.json()) as { id: number };

    const res = await app.request(
      `/api/events/${created.id}`,
      { method: 'DELETE', headers: authHeaders(AUTH0_SUB_2) },
      env,
    );
    expect(res.status).toBe(403);
  });
});
