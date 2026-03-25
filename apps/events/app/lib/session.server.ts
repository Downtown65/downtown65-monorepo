import { ENV } from 'varlock/env';
import { type SessionData, SessionDataSchema } from './auth.server';

const SESSION_COOKIE = 'dt65_session';
const PKCE_COOKIE = 'dt65_pkce';
const SIX_MONTHS_SECONDS = 60 * 60 * 24 * 180;

/**
 * Encrypt session data into a cookie value
 */
async function encrypt(data: string): Promise<string> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(data);

  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);

  const combined = new Uint8Array(iv.length + new Uint8Array(encrypted).length);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt a cookie value back to session data
 */
async function decrypt(value: string): Promise<string> {
  const key = await getKey();
  const combined = Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);

  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);

  return new TextDecoder().decode(decrypted);
}

async function getKey(): Promise<CryptoKey> {
  const keyData = new TextEncoder().encode(ENV.SESSION_SECRET.padEnd(32, '0').slice(0, 32));
  return crypto.subtle.importKey('raw', keyData, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  for (const pair of cookieHeader.split(';')) {
    const [key, ...rest] = pair.trim().split('=');
    if (key) {
      cookies[key] = rest.join('=');
    }
  }
  return cookies;
}

/**
 * Get session from request cookies
 */
export async function getSession(request: Request): Promise<SessionData | null> {
  const cookieHeader = request.headers.get('cookie') ?? '';
  const cookies = parseCookies(cookieHeader);
  const sessionCookie = cookies[SESSION_COOKIE];

  if (!sessionCookie) return null;

  try {
    const decrypted = await decrypt(sessionCookie);
    return SessionDataSchema.parse(JSON.parse(decrypted));
  } catch {
    return null;
  }
}

/**
 * Create a Set-Cookie header for the session
 */
export async function createSessionCookie(session: SessionData): Promise<string> {
  const encrypted = await encrypt(JSON.stringify(session));
  return `${SESSION_COOKIE}=${encrypted}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${String(SIX_MONTHS_SECONDS)}`;
}

/**
 * Create a Set-Cookie header to clear the session
 */
export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

/**
 * Store PKCE state in a short-lived cookie
 */
export async function createPkceCookie(data: {
  codeVerifier: string;
  state: string;
}): Promise<string> {
  const encrypted = await encrypt(JSON.stringify(data));
  return `${PKCE_COOKIE}=${encrypted}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`;
}

/**
 * Get PKCE state from request cookies
 */
export async function getPkceData(
  request: Request,
): Promise<{ codeVerifier: string; state: string } | null> {
  const cookieHeader = request.headers.get('cookie') ?? '';
  const cookies = parseCookies(cookieHeader);
  const pkceCookie = cookies[PKCE_COOKIE];

  if (!pkceCookie) return null;

  try {
    const decrypted = await decrypt(pkceCookie);
    return JSON.parse(decrypted) as { codeVerifier: string; state: string };
  } catch {
    return null;
  }
}

/**
 * Clear the PKCE cookie
 */
export function clearPkceCookie(): string {
  return `${PKCE_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}
