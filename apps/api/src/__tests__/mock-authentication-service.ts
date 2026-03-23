import type {
  AuthConfig,
  AuthenticationService,
  JwtPayload,
} from '@/services/authentication-service';

/**
 * Mock tokens use format "sub" or "sub:role" (e.g., "user1:admin").
 * If no role is specified, role is undefined (defaults to 'member' in middleware).
 */
export class MockAuth0Service implements AuthenticationService {
  async verifyToken(token: string, _config: AuthConfig): Promise<JwtPayload> {
    const [sub, role] = token.split(':') as [string, string | undefined];
    return { sub, role };
  }
}
