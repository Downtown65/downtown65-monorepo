import { Auth0UserInfoSchema, TokenResponseSchema } from '@dt65/shared';
import type { RouteHandler } from '@hono/zod-openapi';
import { ENV } from 'varlock/env';
import type { AppEnv } from '@/app';
import { logger } from '@/logger';
import type { ManagementService } from '@/services/auth0-management-service';
import type {
  forgotPasswordRoute,
  loginRoute,
  logoutUrlRoute,
  meRoute,
  refreshRoute,
  signupRoute,
} from './auth.routes';

async function loginWithPassword(
  email: string,
  password: string,
): Promise<{ accessToken: string; refreshToken?: string; expiresIn: number }> {
  const response = await fetch(`https://${ENV.AUTH0_DOMAIN}/oauth/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'http://auth0.com/oauth/grant-type/password-realm',
      client_id: ENV.AUTH0_CLIENT_ID,
      client_secret: ENV.AUTH0_CLIENT_SECRET,
      username: email,
      password,
      realm: 'Username-Password-Authentication',
      audience: ENV.AUTH0_AUDIENCE,
      scope: 'openid profile email offline_access',
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Login failed: ${String(response.status)} ${text}`);
  }

  const tokens = TokenResponseSchema.parse(await response.json());
  const result: { accessToken: string; refreshToken?: string; expiresIn: number } = {
    accessToken: tokens.access_token,
    expiresIn: tokens.expires_in,
  };
  if (tokens.refresh_token !== undefined) {
    result.refreshToken = tokens.refresh_token;
  }
  return result;
}

async function getUserInfo(accessToken: string) {
  const response = await fetch(`https://${ENV.AUTH0_DOMAIN}/userinfo`, {
    headers: { authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user info: ${String(response.status)}`);
  }

  return Auth0UserInfoSchema.parse(await response.json());
}

export const handleLogin: RouteHandler<typeof loginRoute, AppEnv> = async (c) => {
  const { email, password } = c.req.valid('json');

  try {
    const tokens = await loginWithPassword(email, password);
    const user = await getUserInfo(tokens.accessToken);

    return c.json(
      {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
        user,
      },
      200,
    );
  } catch (err) {
    logger.withError(err).error('Login failed');
    return c.json(
      { error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } },
      401,
    );
  }
};

export function createHandleSignup(
  managementService: ManagementService,
): RouteHandler<typeof signupRoute, AppEnv> {
  return async (c) => {
    const { email, password, name, nickname } = c.req.valid('json');

    try {
      const config = {
        domain: ENV.AUTH0_DOMAIN,
        clientId: ENV.AUTH0_CLIENT_ID,
        clientSecret: ENV.AUTH0_CLIENT_SECRET,
      };

      await managementService.createUser(config, { email, password, name, nickname });

      const tokens = await loginWithPassword(email, password);
      const user = await getUserInfo(tokens.accessToken);

      return c.json(
        {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn,
          user,
        },
        201,
      );
    } catch (err) {
      logger.withError(err).error('Signup failed');
      return c.json({ error: { code: 'SIGNUP_FAILED', message: 'Signup failed' } }, 400);
    }
  };
}

export const handleForgotPassword: RouteHandler<typeof forgotPasswordRoute, AppEnv> = async (c) => {
  const { email } = c.req.valid('json');

  try {
    await fetch(`https://${ENV.AUTH0_DOMAIN}/dbconnections/change_password`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        client_id: ENV.AUTH0_CLIENT_ID,
        email,
        connection: 'Username-Password-Authentication',
      }),
    });
  } catch (err) {
    logger.withError(err).error('Password reset request failed');
  }

  return c.body(null, 200);
};

export const handleRefresh: RouteHandler<typeof refreshRoute, AppEnv> = async (c) => {
  const { refreshToken } = c.req.valid('json');

  const response = await fetch(`https://${ENV.AUTH0_DOMAIN}/oauth/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      client_id: ENV.AUTH0_CLIENT_ID,
      client_secret: ENV.AUTH0_CLIENT_SECRET,
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    return c.json({ error: { code: 'REFRESH_FAILED', message: 'Invalid refresh token' } }, 401);
  }

  const tokens = TokenResponseSchema.parse(await response.json());

  return c.json(
    {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in,
    },
    200,
  );
};

export function createHandleMe(
  managementService: ManagementService,
): RouteHandler<typeof meRoute, AppEnv> {
  return async (c) => {
    const auth0Sub = c.get('auth0Sub');
    const config = {
      domain: ENV.AUTH0_DOMAIN,
      clientId: ENV.AUTH0_CLIENT_ID,
      clientSecret: ENV.AUTH0_CLIENT_SECRET,
    };

    const auth0User = await managementService.getUser(config, auth0Sub);
    if (!auth0User) {
      return c.json({ error: { code: 'NOT_FOUND', message: 'User not found' } }, 401);
    }

    return c.json(
      {
        name: auth0User.name,
        nickname: auth0User.nickname,
        email: auth0User.email,
        picture: auth0User.picture,
        createdAt: auth0User.created_at,
        subscribeEventCreationEmail: auth0User.user_metadata?.subscribeEventCreationEmail ?? false,
        subscribeWeeklyEmail: auth0User.user_metadata?.subscribeWeeklyEmail ?? false,
      },
      200,
    );
  };
}

export const handleLogoutUrl: RouteHandler<typeof logoutUrlRoute, AppEnv> = async (c) => {
  const { returnTo } = c.req.valid('query');

  const params = new URLSearchParams({
    client_id: ENV.AUTH0_CLIENT_ID,
    returnTo,
  });

  return c.json({ logoutUrl: `https://${ENV.AUTH0_DOMAIN}/v2/logout?${params.toString()}` }, 200);
};
