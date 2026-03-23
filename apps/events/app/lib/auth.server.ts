import { ENV } from 'varlock/env';

const CALLBACK_PATH = '/auth/callback';

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  token_type: string;
  expires_in: number;
}

interface Auth0User {
  sub: string;
  nickname?: string;
  name?: string;
  email?: string;
  picture?: string;
}

export interface SessionData {
  accessToken: string;
  refreshToken?: string | undefined;
  expiresAt: number;
  user: Auth0User;
}

function getCallbackUrl(request: Request): string {
  const url = new URL(request.url);
  return `${url.origin}${CALLBACK_PATH}`;
}

/**
 * Generate a random string for PKCE code verifier and state
 */
function generateRandomString(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(36).padStart(2, '0'))
    .join('')
    .slice(0, length);
}

/**
 * Generate PKCE code challenge from verifier
 */
async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Build Auth0 authorization URL for login
 */
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

/**
 * Build Auth0 authorization URL for signup
 */
export async function getSignupUrl(
  request: Request,
): Promise<{ url: string; codeVerifier: string; state: string }> {
  const result = await getLoginUrl(request);
  return {
    ...result,
    url: `${result.url}&screen_hint=signup`,
  };
}

/**
 * Exchange authorization code for tokens
 */
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

  return (await response.json()) as TokenResponse;
}

/**
 * Refresh an access token using a refresh token
 */
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

  return (await response.json()) as TokenResponse;
}

/**
 * Fetch user info from Auth0
 */
export async function getUserInfo(accessToken: string): Promise<Auth0User> {
  const response = await fetch(`https://${ENV.AUTH0_DOMAIN}/userinfo`, {
    headers: { authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user info: ${response.status}`);
  }

  return (await response.json()) as Auth0User;
}

/**
 * Build Auth0 logout URL
 */
export function getLogoutUrl(request: Request): string {
  const url = new URL(request.url);
  const params = new URLSearchParams({
    client_id: ENV.AUTH0_CLIENT_ID,
    returnTo: url.origin,
  });

  return `https://${ENV.AUTH0_DOMAIN}/v2/logout?${params.toString()}`;
}

/**
 * Create an Auth0 user via Management API (for signup with registerSecret)
 */
export async function createAuth0User(options: {
  email: string;
  password: string;
  name: string;
  nickname: string;
}): Promise<Auth0User> {
  // Get M2M token
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

  const { access_token } = (await tokenResponse.json()) as { access_token: string };

  // Create user
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

  return (await createResponse.json()) as Auth0User;
}
