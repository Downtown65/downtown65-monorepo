import { createMiddleware } from 'hono/factory';
import { jwk } from 'hono/jwk';
import type { AppEnv } from '@/app';

export const jwtAuth = () =>
  createMiddleware<AppEnv>(async (c, next) => {
    const middleware = jwk({
      jwks_uri: `https://${c.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
      alg: ['RS256'],
      verification: {
        iss: `https://${c.env.AUTH0_DOMAIN}/`,
        aud: c.env.AUTH0_AUDIENCE,
      },
    });

    return middleware(c, next);
  });
