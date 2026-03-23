import { createMiddleware } from 'hono/factory';
import type { AppEnv } from '@/app';
import { logger } from '@/logger';

export const requestLogger = createMiddleware<AppEnv>(async (c, next) => {
  const start = Date.now();
  const { method, path } = c.req;

  await next();

  const duration = Date.now() - start;
  const status = c.res.status;
  const meta: Record<string, string | number> = {
    method,
    path,
    status,
    duration: `${String(duration)}ms`,
  };

  if (status >= 400) {
    try {
      const cloned = c.res.clone();
      const body = await cloned.json<{ error?: string | { message?: string } }>();
      if (typeof body?.error === 'string') {
        meta.error = body.error;
      } else if (body?.error?.message) {
        meta.error = body.error.message;
      }
    } catch {
      // non-JSON response, skip
    }
  }

  const log = logger.withMetadata(meta);
  if (status >= 500) {
    log.error('request');
  } else if (status >= 400) {
    log.warn('request');
  } else {
    log.info('request');
  }
});
