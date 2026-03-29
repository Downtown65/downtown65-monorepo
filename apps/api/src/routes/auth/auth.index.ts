import { OpenAPIHono } from '@hono/zod-openapi';
import type { AppEnv } from '@/app';
import type { ManagementService } from '@/services/auth0-management-service';
import {
  createHandleSignup,
  handleForgotPassword,
  handleLogin,
  handleLogoutUrl,
  handleRefresh,
} from './auth.handlers';
import {
  forgotPasswordRoute,
  loginRoute,
  logoutUrlRoute,
  refreshRoute,
  signupRoute,
} from './auth.routes';

export function createAuthRouter(managementService: ManagementService) {
  const authRouter = new OpenAPIHono<AppEnv>();

  authRouter.openapi(loginRoute, handleLogin);
  authRouter.openapi(signupRoute, createHandleSignup(managementService));
  authRouter.openapi(forgotPasswordRoute, handleForgotPassword);
  authRouter.openapi(refreshRoute, handleRefresh);
  authRouter.openapi(logoutUrlRoute, handleLogoutUrl);

  return authRouter;
}
