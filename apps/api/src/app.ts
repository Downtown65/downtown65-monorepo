import { OpenAPIHono } from '@hono/zod-openapi';

export type Bindings = {
  DB: D1Database;
};

export type UserRole = 'admin' | 'board_member' | 'member';

export type Variables = {
  userId: number;
  userRole: UserRole;
  auth0Sub: string;
};

export type AppEnv = { Bindings: Bindings; Variables: Variables };
export type AppType = OpenAPIHono<AppEnv>;

export function createApp(): AppType {
  return new OpenAPIHono<AppEnv>();
}
