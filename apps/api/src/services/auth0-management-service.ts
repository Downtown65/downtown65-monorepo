import {
  type Auth0ManagementUser,
  Auth0ManagementUserSchema,
  Auth0UserListResponseSchema,
  ManagementTokenResponseSchema,
} from '@dt65/shared';
import type { UserRole } from '@/app';

export type { Auth0ManagementUser };

export type Auth0ManagementConfig = {
  domain: string;
  clientId: string;
  clientSecret: string;
};

export interface ManagementService {
  listUsers(config: Auth0ManagementConfig): Promise<Auth0ManagementUser[]>;
  getUser(config: Auth0ManagementConfig, userId: string): Promise<Auth0ManagementUser | null>;
  updateUserRole(config: Auth0ManagementConfig, userId: string, role: UserRole): Promise<void>;
  updateUserBlocked(config: Auth0ManagementConfig, userId: string, blocked: boolean): Promise<void>;
  updateUserFees(
    config: Auth0ManagementConfig,
    userId: string,
    year: string,
    paid: boolean,
  ): Promise<void>;
}

export class Auth0ManagementService implements ManagementService {
  private tokenCache: { token: string; expiresAt: number } | null = null;

  private async getAccessToken(config: Auth0ManagementConfig): Promise<string> {
    if (this.tokenCache && Date.now() < this.tokenCache.expiresAt) {
      return this.tokenCache.token;
    }

    const response = await fetch(`https://${config.domain}/oauth/token`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: config.clientId,
        client_secret: config.clientSecret,
        audience: `https://${config.domain}/api/v2/`,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get management token: ${String(response.status)}`);
    }

    const data = ManagementTokenResponseSchema.parse(await response.json());

    this.tokenCache = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in - 60) * 1000,
    };

    return data.access_token;
  }

  async listUsers(config: Auth0ManagementConfig): Promise<Auth0ManagementUser[]> {
    const token = await this.getAccessToken(config);
    const allUsers: Auth0ManagementUser[] = [];
    let page = 0;
    const perPage = 50;

    while (true) {
      const url = new URL(`https://${config.domain}/api/v2/users`);
      url.searchParams.set('per_page', String(perPage));
      url.searchParams.set('page', String(page));
      url.searchParams.set('include_totals', 'true');
      url.searchParams.set(
        'fields',
        'user_id,email,name,nickname,picture,blocked,last_login,created_at,app_metadata',
      );

      const response = await fetch(url.toString(), {
        headers: { authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(`Failed to list users: ${String(response.status)}`);
      }

      const data = Auth0UserListResponseSchema.parse(await response.json());
      allUsers.push(...data.users);

      if (allUsers.length >= data.total) {
        break;
      }

      page++;
    }

    return allUsers;
  }

  async getUser(
    config: Auth0ManagementConfig,
    userId: string,
  ): Promise<Auth0ManagementUser | null> {
    const token = await this.getAccessToken(config);
    const url = `https://${config.domain}/api/v2/users/${encodeURIComponent(userId)}`;

    const response = await fetch(url, {
      headers: { authorization: `Bearer ${token}` },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Failed to get user: ${String(response.status)}`);
    }

    return Auth0ManagementUserSchema.parse(await response.json());
  }

  async updateUserRole(
    config: Auth0ManagementConfig,
    userId: string,
    role: UserRole,
  ): Promise<void> {
    const token = await this.getAccessToken(config);
    const url = `https://${config.domain}/api/v2/users/${encodeURIComponent(userId)}`;

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        app_metadata: { role },
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update user role: ${String(response.status)}`);
    }
  }

  async updateUserBlocked(
    config: Auth0ManagementConfig,
    userId: string,
    blocked: boolean,
  ): Promise<void> {
    const token = await this.getAccessToken(config);
    const url = `https://${config.domain}/api/v2/users/${encodeURIComponent(userId)}`;

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ blocked }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update user blocked status: ${String(response.status)}`);
    }
  }

  async updateUserFees(
    config: Auth0ManagementConfig,
    userId: string,
    year: string,
    paid: boolean,
  ): Promise<void> {
    const user = await this.getUser(config, userId);
    if (!user) {
      throw new Error('User not found');
    }

    const currentFees = user.app_metadata?.fees ?? {};
    const updatedFees = { ...currentFees, [year]: paid };

    const token = await this.getAccessToken(config);
    const url = `https://${config.domain}/api/v2/users/${encodeURIComponent(userId)}`;

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        app_metadata: { fees: updatedFees },
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update user fees: ${String(response.status)}`);
    }
  }
}
