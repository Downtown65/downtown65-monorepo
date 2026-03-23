import { OpenAPIHono } from '@hono/zod-openapi';
import type { AppEnv } from '@/app';
import { jwtAuth, requireRole } from '@/middleware/auth';
import type { ManagementService } from '@/services/auth0-management-service';
import type { AuthenticationService } from '@/services/authentication-service';
import {
  createHandleGetUser,
  createHandleListUsers,
  createHandleUpdateUserBlocked,
  createHandleUpdateUserRole,
} from './admin.handlers';
import {
  getUserRoute,
  listUsersRoute,
  updateUserBlockedRoute,
  updateUserRoleRoute,
} from './admin.routes';

export function createAdminRouter(
  authService: AuthenticationService,
  managementService: ManagementService,
) {
  const adminRouter = new OpenAPIHono<AppEnv>();

  // All admin routes require JWT + admin or board_member role
  adminRouter.use('/api/admin/*', jwtAuth(authService));
  adminRouter.use('/api/admin/*', requireRole('admin', 'board_member'));

  adminRouter.openapi(listUsersRoute, createHandleListUsers(managementService));
  adminRouter.openapi(getUserRoute, createHandleGetUser(managementService));
  adminRouter.openapi(updateUserRoleRoute, createHandleUpdateUserRole(managementService));
  adminRouter.openapi(updateUserBlockedRoute, createHandleUpdateUserBlocked(managementService));

  return adminRouter;
}
