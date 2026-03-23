import { z } from '@hono/zod-openapi';

export const UserRoleSchema = z.enum(['admin', 'board_member', 'member']);

export const AdminUserSchema = z
  .object({
    userId: z.string(),
    email: z.string(),
    name: z.string(),
    nickname: z.string(),
    picture: z.string(),
    role: UserRoleSchema,
    blocked: z.boolean(),
    lastLogin: z.string().nullable(),
    createdAt: z.string(),
  })
  .openapi('AdminUser');

export const UpdateRoleSchema = z
  .object({
    role: UserRoleSchema,
  })
  .openapi('UpdateRole');

export const UpdateBlockedSchema = z
  .object({
    blocked: z.boolean(),
  })
  .openapi('UpdateBlocked');

export const UserIdParamSchema = z.object({
  userId: z.string().openapi({ param: { name: 'userId', in: 'path' }, example: 'auth0|123' }),
});

export const ErrorSchema = z
  .object({
    error: z.object({
      code: z.string(),
      message: z.string(),
    }),
  })
  .openapi('AdminError');
