import type { Context, Next } from 'hono';
import { bearerAuth } from 'hono/bearer-auth';
import { ENV } from 'varlock/env';
import type { AppEnv } from '@/app';

export async function apiKeyAuth(c: Context<AppEnv>, next: Next) {
  const middleware = bearerAuth({
    headerName: 'x-api-key',
    prefix: '',
    token: ENV.X_API_KEY,
    noAuthenticationHeaderMessage: { error: 'Missing x-api-key header' },
    invalidAuthenticationHeaderMessage: { error: 'Invalid x-api-key header format' },
    invalidTokenMessage: { error: 'Invalid API key' },
  });

  return middleware(c, next);
}
