import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import type { AppEnv } from '@/app';
import type { AuthenticationService } from '@/services/authentication-service';

export function jwtAuth(authService: AuthenticationService) {
  return createMiddleware<AppEnv>(async (c, next) => {
    const authHeader = c.req.header('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      throw new HTTPException(401, { message: 'Missing authorization token' });
    }

    const token = authHeader.slice(7);
    if (!token) {
      throw new HTTPException(401, { message: 'Missing authorization token' });
    }

    try {
      const payload = await authService.verifyToken(token, {
        domain: c.env.AUTH0_DOMAIN,
        audience: c.env.AUTH0_AUDIENCE,
      });
      c.set('jwtPayload', payload);
    } catch {
      throw new HTTPException(401, { message: 'Invalid authorization token' });
    }

    await next();
  });
}
