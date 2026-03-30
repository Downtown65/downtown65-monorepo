import { z } from '@hono/zod-openapi';

export const LoginSchema = z
  .object({
    email: z.email(),
    password: z.string().min(1),
  })
  .openapi('LoginRequest');

export const SignupSchema = z
  .object({
    email: z.email(),
    password: z.string().min(8),
    name: z.string().min(1),
    nickname: z.string().min(1),
  })
  .openapi('SignupRequest');

export const ForgotPasswordSchema = z
  .object({
    email: z.email(),
  })
  .openapi('ForgotPasswordRequest');

export const RefreshTokenSchema = z
  .object({
    refreshToken: z.string().min(1),
  })
  .openapi('RefreshTokenRequest');

export const AuthResponseSchema = z
  .object({
    accessToken: z.string(),
    refreshToken: z.string().optional(),
    expiresIn: z.number(),
    user: z.object({
      sub: z.string(),
      nickname: z.string(),
      name: z.string(),
      email: z.email(),
      picture: z.url(),
    }),
  })
  .openapi('AuthResponse');

export const RefreshResponseSchema = z
  .object({
    accessToken: z.string(),
    refreshToken: z.string().optional(),
    expiresIn: z.number(),
  })
  .openapi('RefreshResponse');

export const LogoutUrlResponseSchema = z
  .object({
    logoutUrl: z.string(),
  })
  .openapi('LogoutUrlResponse');

export const LogoutUrlQuerySchema = z.object({
  returnTo: z.url(),
});

export const UserProfileSchema = z
  .object({
    name: z.string(),
    nickname: z.string(),
    email: z.string(),
    picture: z.string(),
    createdAt: z.string(),
    subscribeEventCreationEmail: z.boolean(),
    subscribeWeeklyEmail: z.boolean(),
  })
  .openapi('UserProfile');

export const ErrorSchema = z
  .object({
    error: z.object({
      code: z.string(),
      message: z.string(),
    }),
  })
  .openapi('AuthError');
