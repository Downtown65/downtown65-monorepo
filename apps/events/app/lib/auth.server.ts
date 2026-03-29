import { Auth0UserInfoSchema } from '@dt65/shared';
import { z } from 'zod';

export const SessionDataSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  expiresAt: z.number(),
  user: Auth0UserInfoSchema,
});

export type SessionData = z.infer<typeof SessionDataSchema>;
