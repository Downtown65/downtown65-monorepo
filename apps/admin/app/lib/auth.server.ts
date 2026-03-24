import { Auth0UserInfoSchema, type TokenResponse, TokenResponseSchema } from '@dt65/shared';
import { ENV } from 'varlock/env';

const CALLBACK_PATH = '/auth/callback';
const ROLE_CLAIM = 'https://downtown65.com/role';
const ALLOWED_ROLES = new Set(['admin', 'board_member']);
const PLUS_RE = /\+/g;
const SLASH_RE = /\//g;
const TRAILING_EQUALS_RE = /=+$/;

export interface SessionData {
  accessToken: string;
  refreshToken?: string | undefined;
  expiresAt: number;
  user: {
    sub: string;
    nickname: string;
    email?: string | undefined;
    role: string;
  };
}

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
    .replace(PLUS_RE, '-')
    .replace(SLASH_RE, '_')
    .replace(TRAILING_EQUALS_RE, '');
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
      client_secret: ENV.AUTH0_CLIENT_SECRET,
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
      client_secret: ENV.AUTH0_CLIENT_SECRET,
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${response.status}`);
  }

  return TokenResponseSchema.parse(await response.json());
}

export async function getUserInfo(accessToken: string) {
  const response = await fetch(`https://${ENV.AUTH0_DOMAIN}/userinfo`, {
    headers: { authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user info: ${response.status}`);
  }

  return Auth0UserInfoSchema.parse(await response.json());
}

export function extractRoleFromToken(accessToken: string): string {
  try {
    const parts = accessToken.split('.');
    if (parts.length !== 3) return 'member';
    const payload = JSON.parse(atob(parts[1]?.replace(/-/g, '+').replace(/_/g, '/') ?? ''));
    const role = payload[ROLE_CLAIM];
    return typeof role === 'string' ? role : 'member';
  } catch {
    return 'member';
  }
}

export function isAllowedRole(role: string): boolean {
  return ALLOWED_ROLES.has(role);
}

export function getLogoutUrl(request: Request): string {
  const url = new URL(request.url);
  const params = new URLSearchParams({
    client_id: ENV.AUTH0_CLIENT_ID,
    returnTo: url.origin,
  });

  return `https://${ENV.AUTH0_DOMAIN}/v2/logout?${params.toString()}`;
}
