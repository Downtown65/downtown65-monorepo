import { OpenAPIHono } from '@hono/zod-openapi';

export type Bindings = {
  DB: D1Database;
  AUTH0_DOMAIN: string;
  AUTH0_AUDIENCE: string;
  X_API_KEY: string;
};

export type Variables = {
  jwtPayload: { sub: string };
};

export type AppEnv = { Bindings: Bindings; Variables: Variables };
export type AppType = OpenAPIHono<AppEnv>;

export function createApp(): AppType {
  return new OpenAPIHono<AppEnv>();
}
