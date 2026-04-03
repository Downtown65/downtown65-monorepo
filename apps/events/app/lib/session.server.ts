import { ENV } from 'varlock/env';
import { type SessionData, SessionDataSchema } from './auth.server';

const SESSION_COOKIE = 'dt65_session';
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

const HKDF_SALT = new TextEncoder().encode('dt65-session-encryption');
const HKDF_INFO = new TextEncoder().encode('aes-gcm-key');

let cachedKey: CryptoKey | null = null;

async function getKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey;

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(ENV.SESSION_SECRET),
    'HKDF',
    false,
    ['deriveKey'],
  );

  cachedKey = await crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: HKDF_SALT, info: HKDF_INFO },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );

  return cachedKey;
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
