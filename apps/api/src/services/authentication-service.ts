export type AuthConfig = {
  domain: string;
  audience: string;
};

export type JwtPayload = {
  sub: string;
  role: string | undefined;
};

export interface AuthenticationService {
  verifyToken(token: string, config: AuthConfig): Promise<JwtPayload>;
}

function decodeBase64Url(str: string): string {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  return atob(padded);
}

function decodeBase64UrlToBuffer(str: string): ArrayBuffer {
  const binary = decodeBase64Url(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export class Auth0Service implements AuthenticationService {
  private keyCache = new Map<string, CryptoKey>();

  async verifyToken(token: string, config: AuthConfig): Promise<JwtPayload> {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    const [headerPart, payloadPart, signaturePart] = parts;
    if (!headerPart || !payloadPart || !signaturePart) {
      throw new Error('Invalid token format');
    }

    const header: Record<string, unknown> = JSON.parse(decodeBase64Url(headerPart));
    const payload: Record<string, unknown> = JSON.parse(decodeBase64Url(payloadPart));

    if (typeof header.alg !== 'string' || header.alg !== 'RS256') {
      throw new Error('Unsupported algorithm');
    }

    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp === 'number' && payload.exp < now) {
      throw new Error('Token expired');
    }

    if (payload.iss !== `https://${config.domain}/`) {
      throw new Error('Invalid issuer');
    }

    const aud = payload.aud;
    if (Array.isArray(aud)) {
      if (!aud.includes(config.audience)) {
        throw new Error('Invalid audience');
      }
    } else if (aud !== config.audience) {
      throw new Error('Invalid audience');
    }

    if (typeof payload.sub !== 'string') {
      throw new Error('Missing sub claim');
    }

    if (typeof header.kid !== 'string') {
      throw new Error('Missing kid in token header');
    }

    const key = await this.getSigningKey(header.kid, config.domain);
    const data = new TextEncoder().encode(`${headerPart}.${payloadPart}`);
    const signature = decodeBase64UrlToBuffer(signaturePart);

    const valid = await crypto.subtle.verify({ name: 'RSASSA-PKCS1-v1_5' }, key, signature, data);

    if (!valid) {
      throw new Error('Invalid token signature');
    }

    const role = payload['https://downtown65.com/role'];

    return {
      sub: payload.sub,
      role: typeof role === 'string' ? role : undefined,
    };
  }

  private async getSigningKey(kid: string, domain: string): Promise<CryptoKey> {
    const cached = this.keyCache.get(kid);
    if (cached) {
      return cached;
    }

    const response = await fetch(`https://${domain}/.well-known/jwks.json`);
    if (!response.ok) {
      throw new Error('Failed to fetch JWKS');
    }

    const { keys } = (await response.json()) as { keys: Array<JsonWebKey & { kid?: string }> };
    const jwk = keys.find((k) => k.kid === kid);

    if (!jwk) {
      throw new Error('Signing key not found');
    }

    const key = await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify'],
    );

    this.keyCache.set(kid, key);
    return key;
  }
}
