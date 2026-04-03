import { toEventType } from '@dt65/shared';
import type { RouteHandler } from '@hono/zod-openapi';
import { desc, eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { ENV } from 'varlock/env';
import { type AppEnv, isUserRole } from '@/app';
import { events, users } from '@/db/schema';
import type {
  Auth0ManagementConfig,
  Auth0ManagementUser,
  ManagementService,
} from '@/services/auth0-management-service';
import type {
  getUserFeeRoute,
  getUserRoute,
  listAdminEventsRoute,
  listUsersRoute,
  updateUserBlockedRoute,
  updateUserFeeRoute,
  updateUserRoleRoute,
} from './admin.routes';

function toAdminUser(user: Auth0ManagementUser) {
  const rawRole = user.app_metadata?.role;
  const role = typeof rawRole === 'string' && isUserRole(rawRole) ? rawRole : 'member';

  return {
    userId: user.user_id,
    email: user.email,
    name: user.name,
    nickname: user.nickname,
    picture: user.picture,
    role,
    blocked: user.blocked ?? false,
    lastLogin: user.last_login ?? null,
    createdAt: user.created_at,
  };
}

function getManagementConfig(): Auth0ManagementConfig {
  return {
    domain: ENV.AUTH0_DOMAIN,
    clientId: ENV.AUTH0_CLIENT_ID,
    clientSecret: ENV.AUTH0_CLIENT_SECRET,
  };
}

export function createHandleListUsers(
  managementService: ManagementService,
): RouteHandler<typeof listUsersRoute, AppEnv> {
  return async (c) => {
    const config = getManagementConfig();
    const users = await managementService.listUsers(config);
    return c.json(users.map(toAdminUser), 200);
  };
}

export function createHandleGetUser(
  managementService: ManagementService,
): RouteHandler<typeof getUserRoute, AppEnv> {
  return async (c) => {
    const { userId } = c.req.valid('param');
    const config = getManagementConfig();
    const user = await managementService.getUser(config, userId);

    if (!user) {
      return c.json({ error: { code: 'NOT_FOUND', message: 'User not found' } }, 404);
    }

    return c.json(toAdminUser(user), 200);
  };
}

export function createHandleUpdateUserRole(
  managementService: ManagementService,
): RouteHandler<typeof updateUserRoleRoute, AppEnv> {
  return async (c) => {
    const { userId } = c.req.valid('param');
    const { role } = c.req.valid('json');
    const config = getManagementConfig();

    const currentUser = await managementService.getUser(config, userId);
    if (!currentUser) {
      return c.json({ error: { code: 'NOT_FOUND', message: 'User not found' } }, 404);
    }

    const currentRole = currentUser.app_metadata?.role;
    if (currentRole === 'admin' && role !== 'admin') {
      const allUsers = await managementService.listUsers(config);
      const adminCount = allUsers.filter((u) => u.app_metadata?.role === 'admin').length;
      if (adminCount <= 1) {
        return c.json(
          { error: { code: 'LAST_ADMIN', message: 'Cannot remove the last admin' } },
          409,
        );
      }
    }

    await managementService.updateUserRole(config, userId, role);

    const updatedUser = await managementService.getUser(config, userId);
    if (!updatedUser) {
      return c.json({ error: { code: 'NOT_FOUND', message: 'User not found' } }, 404);
    }

    return c.json(toAdminUser(updatedUser), 200);
  };
}

export function createHandleUpdateUserBlocked(
  managementService: ManagementService,
): RouteHandler<typeof updateUserBlockedRoute, AppEnv> {
  return async (c) => {
    const { userId } = c.req.valid('param');
    const { blocked } = c.req.valid('json');
    const config = getManagementConfig();

    const currentUser = await managementService.getUser(config, userId);
    if (!currentUser) {
      return c.json({ error: { code: 'NOT_FOUND', message: 'User not found' } }, 404);
    }

    await managementService.updateUserBlocked(config, userId, blocked);

    const updatedUser = await managementService.getUser(config, userId);
    if (!updatedUser) {
      return c.json({ error: { code: 'NOT_FOUND', message: 'User not found' } }, 404);
    }

    return c.json(toAdminUser(updatedUser), 200);
  };
}

export function createHandleUpdateUserFee(
  managementService: ManagementService,
): RouteHandler<typeof updateUserFeeRoute, AppEnv> {
  return async (c) => {
    const { userId, year } = c.req.valid('param');
    const { paid } = c.req.valid('json');
    const config = getManagementConfig();

    const user = await managementService.getUser(config, userId);
    if (!user) {
      return c.json({ error: { code: 'NOT_FOUND', message: 'User not found' } }, 404);
    }

    await managementService.updateUserFees(config, userId, year, paid);

    return c.json({ userId, year, paid }, 200);
  };
}

export function createHandleGetUserFee(
  managementService: ManagementService,
): RouteHandler<typeof getUserFeeRoute, AppEnv> {
  return async (c) => {
    const { userId, year } = c.req.valid('param');
    const config = getManagementConfig();

    const user = await managementService.getUser(config, userId);
    if (!user) {
      return c.json({ error: { code: 'NOT_FOUND', message: 'User not found' } }, 404);
    }

    const paid = user.app_metadata?.fees?.[year] ?? false;

    return c.json({ userId, year, paid }, 200);
  };
}

export const handleListAdminEvents: RouteHandler<typeof listAdminEventsRoute, AppEnv> = async (
  c,
) => {
  const { page: pageStr, perPage: perPageStr } = c.req.valid('query');
  const page = Math.max(1, Number(pageStr));
  const perPage = Math.min(100, Math.max(1, Number(perPageStr)));
  const offset = (page - 1) * perPage;

  const db = drizzle(c.env.DB);

  const [countResult, rows] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(events),
    db
      .select({
        id: events.id,
        title: events.title,
        dateStart: events.dateStart,
        timeStart: events.timeStart,
        eventType: events.eventType,
        location: events.location,
        race: events.race,
        creatorNickname: users.nickname,
        createdAt: events.createdAt,
        participantCount: sql<number>`(
          SELECT count(*) FROM users_to_events
          WHERE users_to_events.event_id = ${events.id}
        )`,
      })
      .from(events)
      .innerJoin(users, eq(events.creatorId, users.id))
      .orderBy(desc(events.dateStart))
      .limit(perPage)
      .offset(offset),
  ]);

  const total = countResult[0]?.count ?? 0;

  return c.json(
    {
      events: rows.map((row) => ({
        ...row,
        eventType: toEventType(row.eventType),
        race: row.race === 1,
      })),
      total,
      page,
      perPage,
    },
    200,
  );
};
