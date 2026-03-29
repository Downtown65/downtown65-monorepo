import { createRoute } from '@hono/zod-openapi';
import {
  AuthResponseSchema,
  ErrorSchema,
  ForgotPasswordSchema,
  LoginSchema,
  LogoutUrlQuerySchema,
  LogoutUrlResponseSchema,
  RefreshResponseSchema,
  RefreshTokenSchema,
  SignupSchema,
} from './auth.schemas';

export const loginRoute = createRoute({
  method: 'post',
  path: '/auth/login',
  tags: ['Auth'],
  summary: 'Login with email and password',
  request: {
    body: {
      content: { 'application/json': { schema: LoginSchema } },
      required: true,
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: AuthResponseSchema } },
      description: 'Login successful',
    },
    401: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Invalid credentials',
    },
  },
});

export const signupRoute = createRoute({
  method: 'post',
  path: '/auth/signup',
  tags: ['Auth'],
  summary: 'Create a new user account',
  request: {
    body: {
      content: { 'application/json': { schema: SignupSchema } },
      required: true,
    },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: AuthResponseSchema } },
      description: 'Signup successful',
    },
    400: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Signup failed',
    },
  },
});

export const forgotPasswordRoute = createRoute({
  method: 'post',
  path: '/auth/forgot-password',
  tags: ['Auth'],
  summary: 'Request a password reset email',
  request: {
    body: {
      content: { 'application/json': { schema: ForgotPasswordSchema } },
      required: true,
    },
  },
  responses: {
    200: {
      description: 'Password reset email sent (always returns success)',
    },
  },
});

export const refreshRoute = createRoute({
  method: 'post',
  path: '/auth/refresh',
  tags: ['Auth'],
  summary: 'Refresh an access token',
  request: {
    body: {
      content: { 'application/json': { schema: RefreshTokenSchema } },
      required: true,
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: RefreshResponseSchema } },
      description: 'Token refreshed',
    },
    401: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Invalid refresh token',
    },
  },
});

export const logoutUrlRoute = createRoute({
  method: 'get',
  path: '/auth/logout-url',
  tags: ['Auth'],
  summary: 'Get Auth0 logout URL',
  request: {
    query: LogoutUrlQuerySchema,
  },
  responses: {
    200: {
      content: { 'application/json': { schema: LogoutUrlResponseSchema } },
      description: 'Logout URL',
    },
  },
});
