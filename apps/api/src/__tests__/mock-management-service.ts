import type { UserRole } from '@/app';
import type {
  Auth0ManagementConfig,
  Auth0User,
  ManagementService,
} from '@/services/auth0-management-service';

export class MockManagementService implements ManagementService {
  private users: Map<string, Auth0User> = new Map();

  addUser(user: Auth0User): void {
    this.users.set(user.user_id, user);
  }

  async listUsers(_config: Auth0ManagementConfig): Promise<Auth0User[]> {
    return [...this.users.values()];
  }

  async getUser(_config: Auth0ManagementConfig, userId: string): Promise<Auth0User | null> {
    return this.users.get(userId) ?? null;
  }

  async updateUserRole(
    _config: Auth0ManagementConfig,
    userId: string,
    role: UserRole,
  ): Promise<void> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }
    user.app_metadata = { ...user.app_metadata, role };
  }

  async updateUserBlocked(
    _config: Auth0ManagementConfig,
    userId: string,
    blocked: boolean,
  ): Promise<void> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }
    user.blocked = blocked;
  }

  async updateUserFees(
    _config: Auth0ManagementConfig,
    userId: string,
    year: string,
    paid: boolean,
  ): Promise<void> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }
    const currentFees = user.app_metadata?.fees ?? {};
    user.app_metadata = { ...user.app_metadata, fees: { ...currentFees, [year]: paid } };
  }
}
