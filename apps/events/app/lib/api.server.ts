import { redirect } from 'react-router';
import { ENV } from 'varlock/env';
import type { SessionData } from './auth.server';
import { refreshAccessToken } from './auth.server';
import { createSessionCookie, getSession } from './session.server';

function getApiBase(): string {
  return ENV.API_BASE_URL;
}

/**
 * Make an authenticated API request.
 * Handles token refresh if the access token is expired.
 * Returns the response and optionally a new session cookie header.
 */
async function apiRequest(
  session: SessionData,
  path: string,
  options: RequestInit = {},
): Promise<{ response: Response; sessionCookie?: string | undefined }> {
  let { accessToken } = session;
  let sessionCookie: string | undefined;

  // Refresh token if expired (with 60s buffer)
  if (session.expiresAt < Date.now() + 60_000 && session.refreshToken) {
    try {
      const tokens = await refreshAccessToken(session.refreshToken);
      accessToken = tokens.access_token;
      const updatedSession: SessionData = {
        ...session,
        accessToken,
        refreshToken: tokens.refresh_token ?? session.refreshToken,
        expiresAt: Date.now() + tokens.expires_in * 1000,
      };
      sessionCookie = await createSessionCookie(updatedSession);
    } catch {
      // Refresh failed — session is invalid
      throw redirect('/login');
    }
  }

  const response = await fetch(`${getApiBase()}/api${path}`, {
    ...options,
    headers: {
      ...options.headers,
      'x-api-key': ENV.X_API_KEY,
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    },
  });

  return { response, sessionCookie };
}

/**
 * Get an authenticated session or redirect to login.
 */
export async function requireAuth(request: Request): Promise<SessionData> {
  const session = await getSession(request);
  if (!session) {
    throw redirect('/login');
  }
  return session;
}

/**
 * Make an authenticated GET request to the API.
 */
export async function apiGet(
  session: SessionData,
  path: string,
): Promise<{ data: unknown; sessionCookie?: string | undefined }> {
  const { response, sessionCookie } = await apiRequest(session, path);

  if (response.status === 401) {
    throw redirect('/login');
  }

  if (!response.ok) {
    throw new Response(response.statusText, { status: response.status });
  }

  const data: unknown = await response.json();
  return { data, sessionCookie };
}

/**
 * Make an authenticated POST request to the API.
 */
export async function apiPost(
  session: SessionData,
  path: string,
  body: unknown,
): Promise<{ data: unknown; sessionCookie?: string | undefined }> {
  const { response, sessionCookie } = await apiRequest(session, path, {
    method: 'POST',
    body: JSON.stringify(body),
  });

  if (response.status === 401) {
    throw redirect('/login');
  }

  if (!response.ok) {
    const error: unknown = await response.json();
    throw new Response(JSON.stringify(error), {
      status: response.status,
      headers: { 'content-type': 'application/json' },
    });
  }

  const data: unknown = await response.json();
  return { data, sessionCookie };
}

/**
 * Make an authenticated PUT request to the API.
 */
export async function apiPut(
  session: SessionData,
  path: string,
  body: unknown,
): Promise<{ data: unknown; sessionCookie?: string | undefined }> {
  const { response, sessionCookie } = await apiRequest(session, path, {
    method: 'PUT',
    body: JSON.stringify(body),
  });

  if (response.status === 401) {
    throw redirect('/login');
  }

  if (!response.ok) {
    const error: unknown = await response.json();
    throw new Response(JSON.stringify(error), {
      status: response.status,
      headers: { 'content-type': 'application/json' },
    });
  }

  const data: unknown = await response.json();
  return { data, sessionCookie };
}

/**
 * Make an authenticated DELETE request to the API.
 */
export async function apiDelete(
  session: SessionData,
  path: string,
): Promise<{ sessionCookie?: string | undefined }> {
  const { response, sessionCookie } = await apiRequest(session, path, {
    method: 'DELETE',
  });

  if (response.status === 401) {
    throw redirect('/login');
  }

  if (!response.ok) {
    const error: unknown = await response.json();
    throw new Response(JSON.stringify(error), {
      status: response.status,
      headers: { 'content-type': 'application/json' },
    });
  }

  return { sessionCookie };
}
