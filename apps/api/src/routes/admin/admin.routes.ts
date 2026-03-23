import { createRoute } from '@hono/zod-openapi';
import {
  AdminUserSchema,
  ErrorSchema,
  UpdateBlockedSchema,
  UpdateRoleSchema,
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
