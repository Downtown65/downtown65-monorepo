import { env } from 'cloudflare:test';
import { ENV } from 'varlock/env';
import { beforeAll, describe, expect, it } from 'vitest';
import { createApiApp } from '@/create-app';
import { MockAuth0Service } from './mock-authentication-service';
import { MockManagementService } from './mock-management-service';
import { insertTestUser } from './test-helpers';

const AUTH0_SUB = 'auth0|auth-test-user';
const API_KEY = ENV.X_API_KEY;

const mockManagement = new MockManagementService();
const app = createApiApp(new MockAuth0Service(), mockManagement);

function authHeaders(token: string) {
  return {
    'x-api-key': API_KEY,
    authorization: `Bearer ${token}`,
    'content-type': 'application/json',
  };
}

function apiKeyHeaders() {
  return {
    'x-api-key': API_KEY,
    'content-type': 'application/json',
  };
}

beforeAll(async () => {
  await insertTestUser({
    auth0Sub: AUTH0_SUB,
    nickname: 'AuthTestUser',
    picture: 'https://example.com/pic.jpg',
  });

  mockManagement.addUser({
    user_id: AUTH0_SUB,
    email: 'auth-test@example.com',
    name: 'Auth Test User',
    nickname: 'AuthTestUser',
    picture: 'https://example.com/pic.jpg',
    last_login: '2026-01-01T00:00:00Z',
    created_at: '2025-01-01T00:00:00Z',
    app_metadata: { role: 'member' },
  });
});

describe('GET /api/auth/me', () => {
  it('returns user profile with valid JWT', async () => {
    const res = await app.request('/api/auth/me', { headers: authHeaders(AUTH0_SUB) }, env);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({
      name: 'Auth Test User',
      nickname: 'AuthTestUser',
      email: 'auth-test@example.com',
    });
  });

  it('returns 401 without authorization header', async () => {
    const res = await app.request('/api/auth/me', { headers: { 'x-api-key': API_KEY } }, env);
    expect(res.status).toBe(401);
  });

  it('returns 401 with invalid Bearer token format', async () => {
    const res = await app.request(
      '/api/auth/me',
      {
        headers: {
          'x-api-key': API_KEY,
          authorization: 'InvalidFormat',
        },
      },
      env,
    );
    expect(res.status).toBe(401);
  });

  it('returns 401 when user does not exist in DB', async () => {
    const res = await app.request(
      '/api/auth/me',
      { headers: authHeaders('auth0|nonexistent-user') },
      env,
    );
    expect(res.status).toBe(401);
  });

  it('returns subscription preferences', async () => {
    mockManagement.addUser({
      user_id: 'auth0|subscribed-user',
      email: 'subscribed@example.com',
      name: 'Subscribed User',
      nickname: 'Subscribed',
      picture: 'https://example.com/pic.jpg',
      last_login: null,
      created_at: '2025-01-01T00:00:00Z',
      user_metadata: {
        subscribeEventCreationEmail: true,
        subscribeWeeklyEmail: false,
      },
    });
    await insertTestUser({
      auth0Sub: 'auth0|subscribed-user',
      nickname: 'Subscribed',
      picture: 'https://example.com/pic.jpg',
    });

    const res = await app.request(
      '/api/auth/me',
      { headers: authHeaders('auth0|subscribed-user') },
      env,
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({
      subscribeEventCreationEmail: true,
      subscribeWeeklyEmail: false,
    });
  });
});

describe('POST /api/auth/login', () => {
  it('returns 400 with missing body', async () => {
    const res = await app.request(
      '/api/auth/login',
      { method: 'POST', headers: apiKeyHeaders() },
      env,
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 with invalid email format', async () => {
    const res = await app.request(
      '/api/auth/login',
      {
        method: 'POST',
        headers: apiKeyHeaders(),
        body: JSON.stringify({ email: 'not-an-email', password: 'password123' }),
      },
      env,
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 with missing password', async () => {
    const res = await app.request(
      '/api/auth/login',
      {
        method: 'POST',
        headers: apiKeyHeaders(),
        body: JSON.stringify({ email: 'test@example.com' }),
      },
      env,
    );
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/signup', () => {
  it('returns 400 with missing fields', async () => {
    const res = await app.request(
      '/api/auth/signup',
      {
        method: 'POST',
        headers: apiKeyHeaders(),
        body: JSON.stringify({ email: 'test@example.com' }),
      },
      env,
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 with short password', async () => {
    const res = await app.request(
      '/api/auth/signup',
      {
        method: 'POST',
        headers: apiKeyHeaders(),
        body: JSON.stringify({
          email: 'new@example.com',
          password: '12',
          name: 'New User',
          nickname: 'newbie',
        }),
      },
      env,
    );
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/refresh', () => {
  it('returns 400 with missing refreshToken', async () => {
    const res = await app.request(
      '/api/auth/refresh',
      {
        method: 'POST',
        headers: apiKeyHeaders(),
        body: JSON.stringify({}),
      },
      env,
    );
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/forgot-password', () => {
  it('returns 400 with missing email', async () => {
    const res = await app.request(
      '/api/auth/forgot-password',
      {
        method: 'POST',
        headers: apiKeyHeaders(),
        body: JSON.stringify({}),
      },
      env,
    );
    expect(res.status).toBe(400);
  });
});

describe('GET /api/auth/logout-url', () => {
  it('returns logout URL with returnTo parameter', async () => {
    const res = await app.request(
      '/api/auth/logout-url?returnTo=https://example.com',
      { headers: { 'x-api-key': API_KEY } },
      env,
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { logoutUrl: string };
    expect(body.logoutUrl).toContain('logout');
    expect(body.logoutUrl).toContain('returnTo');
  });

  it('returns 400 without returnTo parameter', async () => {
    const res = await app.request(
      '/api/auth/logout-url',
      { headers: { 'x-api-key': API_KEY } },
      env,
    );
    expect(res.status).toBe(400);
  });
});
