import { describe, expect, it } from 'vitest';
import { decodeBase64Url, extractRoleFromToken } from '../auth.server';

function encodeBase64Url(input: string): string {
  return btoa(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function buildJwt(payload: Record<string, unknown>): string {
  const header = encodeBase64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const body = encodeBase64Url(JSON.stringify(payload));
  return `${header}.${body}.fake-signature`;
}

describe('decodeBase64Url', () => {
  it('decodes standard base64url without padding', () => {
    const input = btoa('hello world').replace(/=+$/, '');
    expect(decodeBase64Url(input)).toBe('hello world');
  });

  it('decodes base64url with URL-safe chars', () => {
    const original = btoa('subjects?_d').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    expect(decodeBase64Url(original)).toBe('subjects?_d');
  });

  it('handles input that needs 1 pad character', () => {
    // "ab" -> base64 "YWI=" -> base64url "YWI" (1 pad removed)
    expect(decodeBase64Url('YWI')).toBe('ab');
  });

  it('handles input that needs 2 pad characters', () => {
    // "a" -> base64 "YQ==" -> base64url "YQ" (2 pads removed)
    expect(decodeBase64Url('YQ')).toBe('a');
  });

  it('handles input that needs no padding', () => {
    // "abc" -> base64 "YWJj" -> no padding needed
    expect(decodeBase64Url('YWJj')).toBe('abc');
  });

  it('handles empty string', () => {
    expect(decodeBase64Url('')).toBe('');
  });
});

describe('extractRoleFromToken', () => {
  const ROLE_CLAIM = 'https://downtown65.com/role';

  it('extracts admin role from token', () => {
    const token = buildJwt({ [ROLE_CLAIM]: 'admin' });
    expect(extractRoleFromToken(token)).toBe('admin');
  });

  it('extracts board_member role from token', () => {
    const token = buildJwt({ [ROLE_CLAIM]: 'board_member' });
    expect(extractRoleFromToken(token)).toBe('board_member');
  });

  it('returns member when role claim is missing', () => {
    const token = buildJwt({ sub: 'user123' });
    expect(extractRoleFromToken(token)).toBe('member');
  });

  it('returns member when role claim is not a string', () => {
    const token = buildJwt({ [ROLE_CLAIM]: 42 });
    expect(extractRoleFromToken(token)).toBe('member');
  });

  it('returns member for invalid token format', () => {
    expect(extractRoleFromToken('not-a-jwt')).toBe('member');
  });

  it('returns member for empty string', () => {
    expect(extractRoleFromToken('')).toBe('member');
  });

  it('returns member for malformed base64', () => {
    expect(extractRoleFromToken('a.!!!.b')).toBe('member');
  });

  it('handles payload with unpadded base64url', () => {
    // Payload that produces base64 needing padding
    const token = buildJwt({
      sub: 'auth0|abc123',
      [ROLE_CLAIM]: 'admin',
      iss: 'https://dev-dt65.eu.auth0.com/',
    });
    expect(extractRoleFromToken(token)).toBe('admin');
  });
});
