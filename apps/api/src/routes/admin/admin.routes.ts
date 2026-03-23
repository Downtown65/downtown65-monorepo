import { createRoute } from '@hono/zod-openapi';
import {
  AdminUserSchema,
  ErrorSchema,
  FeeStatusSchema,
  PaginatedEventsSchema,
  PaginationQuerySchema,
  UpdateBlockedSchema,
  UpdateFeeSchema,
  UpdateRoleSchema,
  UserFeeParamSchema,
  UserIdParamSchema,
} from './admin.schemas';

export const listUsersRoute = createRoute({
  method: 'get',
  path: '/api/admin/users',
  tags: ['Admin'],
  summary: 'List all users',
  responses: {
    200: {
      content: { 'application/json': { schema: AdminUserSchema.array() } },
      description: 'List of all users',
    },
  },
});

export const getUserRoute = createRoute({
  method: 'get',
  path: '/api/admin/users/{userId}',
  tags: ['Admin'],
  summary: 'Get user details',
  request: {
    params: UserIdParamSchema,
  },
  responses: {
    200: {
      content: { 'application/json': { schema: AdminUserSchema } },
      description: 'User details',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'User not found',
    },
  },
});

export const updateUserRoleRoute = createRoute({
  method: 'patch',
  path: '/api/admin/users/{userId}/role',
  tags: ['Admin'],
  summary: 'Change user role',
  request: {
    params: UserIdParamSchema,
    body: {
      content: { 'application/json': { schema: UpdateRoleSchema } },
      required: true,
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: AdminUserSchema } },
      description: 'Role updated',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'User not found',
    },
    409: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Cannot remove last admin',
    },
  },
});

export const updateUserBlockedRoute = createRoute({
  method: 'patch',
  path: '/api/admin/users/{userId}/blocked',
  tags: ['Admin'],
  summary: 'Activate or deactivate user',
  request: {
    params: UserIdParamSchema,
    body: {
      content: { 'application/json': { schema: UpdateBlockedSchema } },
      required: true,
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: AdminUserSchema } },
      description: 'Blocked status updated',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'User not found',
    },
  },
});

export const updateUserFeeRoute = createRoute({
  method: 'put',
  path: '/api/admin/users/{userId}/fees/{year}',
  tags: ['Admin - Fees'],
  summary: 'Set membership fee status for a year',
  request: {
    params: UserFeeParamSchema,
    body: {
      content: { 'application/json': { schema: UpdateFeeSchema } },
      required: true,
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: FeeStatusSchema } },
      description: 'Fee status updated',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'User not found',
    },
  },
});

export const getUserFeeRoute = createRoute({
  method: 'get',
  path: '/api/admin/users/{userId}/fees/{year}',
  tags: ['Admin - Fees'],
  summary: 'Get membership fee status for a year',
  request: {
    params: UserFeeParamSchema,
  },
  responses: {
    200: {
      content: { 'application/json': { schema: FeeStatusSchema } },
      description: 'Fee status',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'User not found',
    },
  },
});

export const listAdminEventsRoute = createRoute({
  method: 'get',
  path: '/api/admin/events',
  tags: ['Admin - Events'],
  summary: 'List all events (paginated)',
  request: {
    query: PaginationQuerySchema,
  },
  responses: {
    200: {
      content: { 'application/json': { schema: PaginatedEventsSchema } },
      description: 'Paginated list of all events',
    },
  },
});
