import type { ErrorHandler, NotFoundHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { ZodError } from 'zod';
import type { AppEnv } from '@/app';
import { logger } from '@/logger';

export const errorHandler: ErrorHandler<AppEnv> = (err, c) => {
  if (err instanceof HTTPException) {
    return c.json(
      { error: { code: `HTTP_${String(err.status)}`, message: err.message } },
      err.status,
    );
  }

  if (err instanceof ZodError) {
    const fieldErrors = err.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));

    return c.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details: fieldErrors } },
      400,
    );
  }

  logger.withError(err).error('Unhandled error');

  return c.json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, 500);
};

export const notFoundHandler: NotFoundHandler<AppEnv> = (c) => {
  return c.json({ error: { code: 'NOT_FOUND', message: 'Not found' } }, 404);
};
