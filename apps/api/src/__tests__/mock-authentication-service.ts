import type {
  AuthConfig,
  AuthenticationService,
  JwtPayload,
} from '@/services/authentication-service';

export class MockAuth0Service implements AuthenticationService {
  async verifyToken(token: string, _config: AuthConfig): Promise<JwtPayload> {
    return { sub: token };
  }
}
