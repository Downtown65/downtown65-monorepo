import { type Client, createClient, postApiAuthRefresh } from '@dt65/api-client';
import { redirect } from 'react-router';
import { ENV } from 'varlock/env';
import type { SessionData } from './auth.server';
import { createSessionCookie, getSession } from './session.server';

export async function requireAdmin(request: Request): Promise<SessionData> {
  const session = await getSession(request);
  if (!session) {
    throw redirect('/login');
  }
  return session;
}

export function createApiClient(): Client {
  return createClient({
    baseUrl: ENV.API_BASE_URL,
    headers: {
      'x-api-key': ENV.X_API_KEY,
    },
  });
}

export async function createAuthClient(session: SessionData): Promise<{
  apiClient: Client;
  headers: Headers;
}> {
  let { accessToken } = session;
  const headers = new Headers();

  if (session.expiresAt < Date.now() + 60_000) {
    if (!session.refreshToken) {
      throw redirect('/login');
    }
    const refreshClient = createApiClient();
    try {
      const { data } = await postApiAuthRefresh({
        client: refreshClient,
        body: { refreshToken: session.refreshToken },
      });

      if (!data) {
        throw redirect('/login');
      }

      accessToken = data.accessToken;
      const updatedSession: SessionData = {
        ...session,
        accessToken,
        refreshToken: data.refreshToken ?? session.refreshToken,
        expiresAt: Date.now() + data.expiresIn * 1000,
      };
      headers.set('Set-Cookie', await createSessionCookie(updatedSession));
    } catch {
      throw redirect('/login');
    }
  }

  const apiClient = createClient({
    baseUrl: ENV.API_BASE_URL,
    headers: {
      'x-api-key': ENV.X_API_KEY,
      authorization: `Bearer ${accessToken}`,
    },
  });

  return { apiClient, headers };
}
