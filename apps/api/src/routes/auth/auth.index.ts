import { OpenAPIHono } from '@hono/zod-openapi';
import type { AppEnv } from '@/app';
import { jwtAuth } from '@/middleware/auth';
import type { ManagementService } from '@/services/auth0-management-service';
import type { AuthenticationService } from '@/services/authentication-service';
import {
  createHandleMe,
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
  meRoute,
  refreshRoute,
  signupRoute,
} from './auth.routes';

export function createAuthRouter(
  authService: AuthenticationService,
  managementService: ManagementService,
) {
  const authRouter = new OpenAPIHono<AppEnv>();

  // Public auth endpoints
  authRouter.openapi(loginRoute, handleLogin);
  authRouter.openapi(signupRoute, createHandleSignup(managementService));
  authRouter.openapi(forgotPasswordRoute, handleForgotPassword);
  authRouter.openapi(refreshRoute, handleRefresh);
  authRouter.openapi(logoutUrlRoute, handleLogoutUrl);

  // Protected auth endpoints (require JWT)
  authRouter.use('/auth/me', jwtAuth(authService));
  authRouter.openapi(meRoute, createHandleMe(managementService));

  return authRouter;
}
