import { OpenAPIHono } from '@hono/zod-openapi';

export type Bindings = {
  DB: D1Database;
  AUTH0_DOMAIN: string;
  AUTH0_CLIENT_ID: string;
  AUTH0_CLIENT_SECRET: string;
};

export type UserRole = 'admin' | 'board_member' | 'member';

export type Variables = {
  userId: number;
  userRole: UserRole;
};

export type AppEnv = { Bindings: Bindings; Variables: Variables };
export type AppType = OpenAPIHono<AppEnv>;

export function createApp(): AppType {
  return new OpenAPIHono<AppEnv>();
}
