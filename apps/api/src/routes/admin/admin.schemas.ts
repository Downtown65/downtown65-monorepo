import { EVENT_TYPES } from '@dt65/shared';
import { z } from '@hono/zod-openapi';

const UserRoleSchema = z.enum(['admin', 'board_member', 'member']);

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

export const UpdateFeeSchema = z
  .object({
    paid: z.boolean(),
  })
  .openapi('UpdateFee');

export const FeeStatusSchema = z
  .object({
    userId: z.string(),
    year: z.string(),
    paid: z.boolean(),
  })
  .openapi('FeeStatus');

export const UserFeeParamSchema = z.object({
  userId: z.string().openapi({ param: { name: 'userId', in: 'path' }, example: 'auth0|123' }),
  year: z.string().openapi({ param: { name: 'year', in: 'path' }, example: '2026' }),
});

const AdminEventSchema = z
  .object({
    id: z.number(),
    title: z.string(),
    dateStart: z.string(),
    timeStart: z.string().nullable(),
    eventType: z.enum(EVENT_TYPES),
    location: z.string().nullable(),
    race: z.boolean(),
    creatorNickname: z.string(),
    participantCount: z.number(),
    createdAt: z.string(),
  })
  .openapi('AdminEvent');

export const PaginatedEventsSchema = z
  .object({
    events: AdminEventSchema.array(),
    total: z.number(),
    page: z.number(),
    perPage: z.number(),
  })
  .openapi('PaginatedEvents');

export const PaginationQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .openapi({ param: { name: 'page', in: 'query' } }),
  perPage: z
    .string()
    .optional()
    .default('50')
    .openapi({ param: { name: 'perPage', in: 'query' } }),
});

export const ErrorSchema = z
  .object({
    error: z.object({
      code: z.string(),
      message: z.string(),
    }),
  })
  .openapi('AdminError');
