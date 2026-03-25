import {
  type Auth0UserInfo,
  Auth0UserInfoSchema,
  type TokenResponse,
  TokenResponseSchema,
} from '@dt65/shared';
import { ENV } from 'varlock/env';
import { z } from 'zod';

const CALLBACK_PATH = '/auth/callback';

export const SessionDataSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  expiresAt: z.number(),
  user: Auth0UserInfoSchema,
});

export type SessionData = z.infer<typeof SessionDataSchema>;

function getCallbackUrl(request: Request): string {
  const url = new URL(request.url);
  return `${url.origin}${CALLBACK_PATH}`;
}

function generateRandomString(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(36).padStart(2, '0'))
    .join('')
    .slice(0, length);
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function getLoginUrl(
  request: Request,
): Promise<{ url: string; codeVerifier: string; state: string }> {
  const codeVerifier = generateRandomString(64);
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateRandomString(32);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: ENV.AUTH0_CLIENT_ID,
    redirect_uri: getCallbackUrl(request),
    scope: 'openid profile email offline_access',
    audience: ENV.AUTH0_AUDIENCE,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  return {
    url: `https://${ENV.AUTH0_DOMAIN}/authorize?${params.toString()}`,
    codeVerifier,
    state,
  };
}

export async function getSignupUrl(
  request: Request,
): Promise<{ url: string; codeVerifier: string; state: string }> {
  const result = await getLoginUrl(request);
  return {
    ...result,
    url: `${result.url}&screen_hint=signup`,
  };
}

export async function exchangeCode(
  request: Request,
  code: string,
  codeVerifier: string,
): Promise<TokenResponse> {
  const response = await fetch(`https://${ENV.AUTH0_DOMAIN}/oauth/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: ENV.AUTH0_CLIENT_ID,
      code,
      redirect_uri: getCallbackUrl(request),
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Token exchange failed: ${response.status} ${text}`);
  }

  return TokenResponseSchema.parse(await response.json());
}

export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const response = await fetch(`https://${ENV.AUTH0_DOMAIN}/oauth/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      client_id: ENV.AUTH0_CLIENT_ID,
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${response.status}`);
  }

  return TokenResponseSchema.parse(await response.json());
}

export async function getUserInfo(accessToken: string): Promise<Auth0UserInfo> {
  const response = await fetch(`https://${ENV.AUTH0_DOMAIN}/userinfo`, {
    headers: { authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user info: ${response.status}`);
  }

  return Auth0UserInfoSchema.parse(await response.json());
}

export function getLogoutUrl(request: Request): string {
  const url = new URL(request.url);
  const params = new URLSearchParams({
    client_id: ENV.AUTH0_CLIENT_ID,
    returnTo: url.origin,
  });

  return `https://${ENV.AUTH0_DOMAIN}/v2/logout?${params.toString()}`;
}

export async function createAuth0User(options: {
  email: string;
  password: string;
  name: string;
  nickname: string;
}): Promise<Auth0UserInfo> {
  const tokenResponse = await fetch(`https://${ENV.AUTH0_DOMAIN}/oauth/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      client_id: ENV.AUTH0_CLIENT_USER_MANAGEMENT_ID,
      client_secret: ENV.AUTH0_CLIENT_USER_MANAGEMENT_SECRET,
      audience: `https://${ENV.AUTH0_DOMAIN}/api/v2/`,
      grant_type: 'client_credentials',
    }),
  });

  if (!tokenResponse.ok) {
    const text = await tokenResponse.text();
    throw new Error(`Failed to get management token: ${tokenResponse.status} ${text}`);
  }

  const { access_token } = TokenResponseSchema.parse(await tokenResponse.json());

  const createResponse = await fetch(`https://${ENV.AUTH0_DOMAIN}/api/v2/users`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${access_token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      connection: 'Username-Password-Authentication',
      email: options.email,
      password: options.password,
      name: options.name,
      nickname: options.nickname,
    }),
  });

  if (!createResponse.ok) {
    const text = await createResponse.text();
    throw new Error(`Failed to create user: ${createResponse.status} ${text}`);
  }

  return Auth0UserInfoSchema.parse(await createResponse.json());
}
