import { redirect } from 'react-router';
import { ENV } from 'varlock/env';
import type { SessionData } from './auth.server';
import { refreshAccessToken } from './auth.server';
import { createSessionCookie, getSession } from './session.server';

function getApiBase(): string {
  return ENV.API_BASE_URL;
}

async function apiRequest(
  session: SessionData,
  path: string,
  options: RequestInit = {},
): Promise<{ response: Response; sessionCookie?: string | undefined }> {
  let { accessToken } = session;
  let sessionCookie: string | undefined;

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

export async function requireAdmin(request: Request): Promise<SessionData> {
  const session = await getSession(request);
  if (!session) {
    throw redirect('/login');
  }
  return session;
}

export async function apiGet(
  session: SessionData,
  path: string,
): Promise<{ data: unknown; sessionCookie?: string | undefined }> {
  const { response, sessionCookie } = await apiRequest(session, path);

  if (response.status === 401) {
    throw redirect('/login');
  }

  if (response.status === 403) {
    throw redirect('/access-denied');
  }

  if (!response.ok) {
    throw new Response(response.statusText, { status: response.status });
  }

  const data: unknown = await response.json();
  return { data, sessionCookie };
}
