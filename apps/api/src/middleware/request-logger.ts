import { createMiddleware } from 'hono/factory';
import type { AppEnv } from '@/app';
import { logger } from '@/logger';

export const requestLogger = createMiddleware<AppEnv>(async (c, next) => {
  const start = Date.now();
  const { method, path } = c.req;

  await next();

  const duration = Date.now() - start;
  const status = c.res.status;

  logger.withMetadata({ method, path, status, duration: `${String(duration)}ms` }).info('request');
});
