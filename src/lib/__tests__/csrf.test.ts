import { describe, it, expect } from 'vitest';
import {
  generateCsrfToken,
  isValidCsrfToken,
  isValidOrigin,
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  CSRF_LEGACY_HEADER,
  CSRF_TOKEN_BYTES,
  CSRF_TOKEN_MAX_AGE,
} from '../csrf';

// ============================================================================
// generateCsrfToken
// ============================================================================
describe('generateCsrfToken', () => {
  it('generates a 64-char hex string', () => {
    const token = generateCsrfToken();
    expect(token).toHaveLength(CSRF_TOKEN_BYTES * 2); // 32 bytes → 64 hex chars
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it('generates unique tokens on each call', () => {
    const tokens = new Set(Array.from({ length: 50 }, () => generateCsrfToken()));
    expect(tokens.size).toBe(50);
  });
});

// ============================================================================
// isValidCsrfToken
// ============================================================================
describe('isValidCsrfToken', () => {
  const validToken = 'a'.repeat(64);

  it('returns true for matching tokens', () => {
    expect(isValidCsrfToken(validToken, validToken)).toBe(true);
  });

  it('returns true for a real generated token compared to itself', () => {
    const token = generateCsrfToken();
    expect(isValidCsrfToken(token, token)).toBe(true);
  });

  it('returns false when header token is null', () => {
    expect(isValidCsrfToken(null, validToken)).toBe(false);
  });

  it('returns false when cookie token is null', () => {
    expect(isValidCsrfToken(validToken, null)).toBe(false);
  });

  it('returns false when both tokens are null', () => {
    expect(isValidCsrfToken(null, null)).toBe(false);
  });

  it('returns false when header token is undefined', () => {
    expect(isValidCsrfToken(undefined, validToken)).toBe(false);
  });

  it('returns false when cookie token is undefined', () => {
    expect(isValidCsrfToken(validToken, undefined)).toBe(false);
  });

  it('returns false for mismatched tokens of same length', () => {
    expect(isValidCsrfToken(validToken, 'b'.repeat(64))).toBe(false);
  });

  it('returns false for different-length tokens (no crash)', () => {
    expect(isValidCsrfToken('short', validToken)).toBe(false);
  });

  it('returns false for empty strings', () => {
    expect(isValidCsrfToken('', '')).toBe(false);
  });

  it('returns false for empty header', () => {
    expect(isValidCsrfToken('', validToken)).toBe(false);
  });

  it('returns false for empty cookie', () => {
    expect(isValidCsrfToken(validToken, '')).toBe(false);
  });

  it('is timing-safe (detects single-char difference)', () => {
    const token = generateCsrfToken();
    const tampered = token.slice(0, -1) + (token.endsWith('a') ? 'b' : 'a');
    expect(isValidCsrfToken(tampered, token)).toBe(false);
  });
});

// ============================================================================
// isValidOrigin
// ============================================================================
describe('isValidOrigin', () => {
  const appUrl = 'https://neto.co.il';

  it('allows matching production origin', () => {
    expect(isValidOrigin('https://neto.co.il', null, appUrl)).toBe(true);
  });

  it('rejects different origin', () => {
    expect(isValidOrigin('https://evil.com', null, appUrl)).toBe(false);
  });

  it('rejects subdomain spoofing', () => {
    expect(isValidOrigin('https://neto.co.il.evil.com', null, appUrl)).toBe(false);
  });

  it('rejects different protocol', () => {
    expect(isValidOrigin('http://neto.co.il', null, appUrl)).toBe(false);
  });

  it('allows localhost in non-production (test) environment', () => {
    // NODE_ENV is 'test' during vitest runs, which is !== 'production'
    expect(isValidOrigin('http://localhost:3000', null, appUrl)).toBe(true);
  });

  it('allows localhost without port in non-production', () => {
    expect(isValidOrigin('http://localhost', null, appUrl)).toBe(true);
  });

  it('allows 127.0.0.1 in non-production', () => {
    expect(isValidOrigin('http://127.0.0.1:3000', null, appUrl)).toBe(true);
  });

  it('allows Vercel preview deployment URLs', () => {
    expect(isValidOrigin('https://neto-abc123.vercel.app', null, appUrl)).toBe(true);
  });

  it('allows any vercel.app subdomain', () => {
    expect(isValidOrigin('https://random-preview-123.vercel.app', null, appUrl)).toBe(true);
  });

  it('falls back to Referer when Origin is null', () => {
    expect(isValidOrigin(null, 'https://neto.co.il/dashboard', appUrl)).toBe(true);
  });

  it('rejects bad Referer origin', () => {
    expect(isValidOrigin(null, 'https://evil.com/dashboard', appUrl)).toBe(false);
  });

  it('allows request with no Origin and no Referer (same-site navigation)', () => {
    expect(isValidOrigin(null, null, appUrl)).toBe(true);
  });

  it('rejects malformed Referer (not a valid URL)', () => {
    expect(isValidOrigin(null, 'not-a-url', appUrl)).toBe(false);
  });

  it('works with appUrl that includes a path', () => {
    // Shouldn't happen in practice but make sure origin extraction works
    expect(isValidOrigin('https://neto.co.il', null, 'https://neto.co.il/app')).toBe(true);
  });
});

// ============================================================================
// Constants
// ============================================================================
describe('CSRF constants', () => {
  it('has correct cookie name', () => {
    expect(CSRF_COOKIE_NAME).toBe('csrf-token');
  });

  it('has correct header name', () => {
    expect(CSRF_HEADER_NAME).toBe('X-CSRF-Token');
  });

  it('has correct legacy header name', () => {
    expect(CSRF_LEGACY_HEADER).toBe('X-CSRF-Protection');
  });

  it('token max age is 24 hours', () => {
    expect(CSRF_TOKEN_MAX_AGE).toBe(86400);
  });
});

