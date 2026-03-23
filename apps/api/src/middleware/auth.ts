import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import { ENV } from 'varlock/env';
import type { AppEnv, UserRole } from '@/app';
import { users } from '@/db/schema';
import type { AuthenticationService } from '@/services/authentication-service';

const VALID_ROLES: ReadonlySet<string> = new Set<UserRole>(['admin', 'board_member', 'member']);

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
    let role: UserRole;
    try {
      const payload = await authService.verifyToken(token, {
        domain: ENV.AUTH0_DOMAIN,
        audience: ENV.AUTH0_AUDIENCE,
      });
      sub = payload.sub;
      role = payload.role && VALID_ROLES.has(payload.role) ? (payload.role as UserRole) : 'member';
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
    c.set('userRole', role);
    await next();
  });
}

export function requireRole(...allowedRoles: UserRole[]) {
  const allowed = new Set(allowedRoles);
  return createMiddleware<AppEnv>(async (c, next) => {
    const role = c.get('userRole');
    if (!allowed.has(role)) {
      throw new HTTPException(403, { message: 'Insufficient permissions' });
    }
    await next();
  });
}
