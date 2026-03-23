import type { RouteHandler } from '@hono/zod-openapi';
import type { AppEnv, UserRole } from '@/app';
import type {
  Auth0ManagementConfig,
  Auth0User,
  ManagementService,
} from '@/services/auth0-management-service';
import type {
  getUserRoute,
  listUsersRoute,
  updateUserBlockedRoute,
  updateUserRoleRoute,
} from './admin.routes';

const VALID_ROLES = new Set<string>(['admin', 'board_member', 'member']);

function toAdminUser(user: Auth0User) {
  const rawRole = user.app_metadata?.role;
  const role: UserRole =
    typeof rawRole === 'string' && VALID_ROLES.has(rawRole) ? (rawRole as UserRole) : 'member';

  return {
    userId: user.user_id,
    email: user.email,
    name: user.name,
    nickname: user.nickname,
    picture: user.picture,
    role,
    blocked: user.blocked,
    lastLogin: user.last_login ?? null,
    createdAt: user.created_at,
  };
}

function getManagementConfig(
  domain: string,
  clientId: string,
  clientSecret: string,
): Auth0ManagementConfig {
  return { domain, clientId, clientSecret };
}

function configFromEnv(env: AppEnv['Bindings']): Auth0ManagementConfig {
  return getManagementConfig(
    env.AUTH0_DOMAIN,
    env.AUTH0_MANAGEMENT_CLIENT_ID,
    env.AUTH0_MANAGEMENT_CLIENT_SECRET,
  );
}

export function createHandleListUsers(
  managementService: ManagementService,
): RouteHandler<typeof listUsersRoute, AppEnv> {
  return async (c) => {
    const config = configFromEnv(c.env);
    const users = await managementService.listUsers(config);
    return c.json(users.map(toAdminUser), 200);
  };
}

export function createHandleGetUser(
  managementService: ManagementService,
): RouteHandler<typeof getUserRoute, AppEnv> {
  return async (c) => {
    const { userId } = c.req.valid('param');
    const config = configFromEnv(c.env);
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
    const config = configFromEnv(c.env);

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
    const config = configFromEnv(c.env);

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
