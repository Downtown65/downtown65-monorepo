import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import type { AppEnv } from '@/app';
import { users } from '@/db/schema';
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

    let sub: string;
    try {
      const payload = await authService.verifyToken(token, {
        domain: c.env.AUTH0_DOMAIN,
        audience: c.env.AUTH0_AUDIENCE,
      });
      sub = payload.sub;
    } catch {
      throw new HTTPException(401, { message: 'Invalid authorization token' });
    }

    const db = drizzle(c.env.DB);
    const rows = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.auth0Sub, sub))
      .limit(1);

    const user = rows[0];
    if (!user) {
      throw new HTTPException(401, { message: 'User not found' });
    }

    c.set('userId', user.id);
    await next();
  });
}
