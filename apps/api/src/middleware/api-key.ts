import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import type { AppEnv } from '@/app';

export const apiKeyMiddleware = () =>
  createMiddleware<AppEnv>(async (c, next) => {
    const apiKey = c.req.header('x-api-key');
    if (!apiKey) {
      throw new HTTPException(401, { message: 'Missing API key' });
    }

    const encoder = new TextEncoder();
    const expected = encoder.encode(c.env.X_API_KEY);
    const received = encoder.encode(apiKey);

    if (expected.byteLength !== received.byteLength) {
      throw new HTTPException(401, { message: 'Invalid API key' });
    }

    const isValid = crypto.subtle.timingSafeEqual(expected, received);
    if (!isValid) {
      throw new HTTPException(401, { message: 'Invalid API key' });
    }

    await next();
  });
