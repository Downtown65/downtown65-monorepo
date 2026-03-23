import type { UserRole } from '@/app';

export type Auth0User = {
  user_id: string;
  email: string;
  name: string;
  nickname: string;
  picture: string;
  blocked: boolean;
  last_login: string | null;
  created_at: string;
  app_metadata?: {
    role?: string;
    fees?: Record<string, boolean>;
  };
};

type Auth0UserListResponse = Auth0User[];

type TokenResponse = {
  access_token: string;
  expires_in: number;
  token_type: string;
};

export type Auth0ManagementConfig = {
  domain: string;
  clientId: string;
  clientSecret: string;
};

export interface ManagementService {
  listUsers(config: Auth0ManagementConfig): Promise<Auth0User[]>;
  getUser(config: Auth0ManagementConfig, userId: string): Promise<Auth0User | null>;
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

    const data = (await response.json()) as TokenResponse;

    this.tokenCache = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in - 60) * 1000,
    };

    return data.access_token;
  }

  async listUsers(config: Auth0ManagementConfig): Promise<Auth0User[]> {
    const token = await this.getAccessToken(config);
    const allUsers: Auth0User[] = [];
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

      // biome-ignore lint/performance/noAwaitInLoops: pagination requires sequential fetches
      const response = await fetch(url.toString(), {
        headers: { authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(`Failed to list users: ${String(response.status)}`);
      }

      const data = (await response.json()) as { users: Auth0UserListResponse; total: number };
      allUsers.push(...data.users);

      if (allUsers.length >= data.total) {
        break;
      }

      page++;
    }

    return allUsers;
  }

  async getUser(config: Auth0ManagementConfig, userId: string): Promise<Auth0User | null> {
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

    return (await response.json()) as Auth0User;
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
