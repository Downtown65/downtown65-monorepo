import { z } from 'zod/v4';

// /oauth/token response — used by all apps
export const TokenResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  id_token: z.string().optional(),
  token_type: z.string(),
  expires_in: z.number(),
});
export type TokenResponse = z.infer<typeof TokenResponseSchema>;

// /userinfo response — used by events and admin auth callbacks
export const Auth0UserInfoSchema = z.object({
  sub: z.string(),
  nickname: z.string(),
  name: z.string(),
  email: z.string(),
  picture: z.string(),
});
export type Auth0UserInfo = z.infer<typeof Auth0UserInfoSchema>;

// Management API /api/v2/users response — used by API service
export const Auth0ManagementUserSchema = z
  .object({
    user_id: z.string(),
    email: z.string(),
    name: z.string(),
    nickname: z.string(),
    picture: z.string(),
    blocked: z.boolean().optional(),
    last_login: z.string().nullable().optional(),
    created_at: z.string(),
    user_metadata: z
      .object({
        subscribeEventCreationEmail: z.boolean().optional(),
        subscribeWeeklyEmail: z.boolean().optional(),
      })
      .loose()
      .optional(),
    app_metadata: z
      .object({
        role: z.string().optional(),
        fees: z.record(z.string(), z.boolean()).optional(),
      })
      .loose()
      .optional(),
  })
  .loose();
export type Auth0ManagementUser = z.infer<typeof Auth0ManagementUserSchema>;

// Paginated user list from Management API
export const Auth0UserListResponseSchema = z.object({
  users: z.array(Auth0ManagementUserSchema),
  total: z.number(),
});
export type Auth0UserListResponse = z.infer<typeof Auth0UserListResponseSchema>;

// Management API token (subset — no refresh_token)
export const ManagementTokenResponseSchema = z.object({
  access_token: z.string(),
  expires_in: z.number(),
  token_type: z.string(),
});
export type ManagementTokenResponse = z.infer<typeof ManagementTokenResponseSchema>;
