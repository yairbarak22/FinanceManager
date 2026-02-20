/**
 * CSRF Protection — Integration Tests
 *
 * These tests verify the csrf utility round-trip behavior:
 * - Token generation → validation cycle
 * - Origin checking against realistic URLs
 * - Edge cases that could bypass protection
 *
 * Full HTTP-level middleware tests are covered by E2E (Playwright):
 *   - tests/e2e/smoke.spec.ts → "should block API POST without CSRF header"
 *   - tests/e2e/file-upload-flow.spec.ts → "should reject upload without CSRF header"
 */
import { describe, it, expect } from 'vitest';
import {
  generateCsrfToken,
  isValidCsrfToken,
  isValidOrigin,
} from '@/lib/csrf';

// ============================================================================
// Token round-trip (simulates middleware set → client read → middleware validate)
// ============================================================================
describe('CSRF token round-trip', () => {
  it('validates a freshly generated token against itself', () => {
    const token = generateCsrfToken();
    // Simulates: middleware sets cookie, client reads it, sends as header
    expect(isValidCsrfToken(token, token)).toBe(true);
  });

  it('rejects a token that was tampered with (single bit flip)', () => {
    const token = generateCsrfToken();
    // Flip the last character
    const tampered = token.slice(0, -1) + (token.endsWith('a') ? 'b' : 'a');
    expect(isValidCsrfToken(tampered, token)).toBe(false);
  });

  it('rejects completely different token of same length', () => {
    const cookieToken = generateCsrfToken();
    const headerToken = generateCsrfToken();
    // Two random tokens should never match
    expect(isValidCsrfToken(headerToken, cookieToken)).toBe(false);
  });

  it('rejects when client sends a truncated token', () => {
    const cookieToken = generateCsrfToken();
    const truncated = cookieToken.slice(0, 32); // Half-length
    expect(isValidCsrfToken(truncated, cookieToken)).toBe(false);
  });

  it('rejects when client sends an extended token', () => {
    const cookieToken = generateCsrfToken();
    const extended = cookieToken + 'deadbeef';
    expect(isValidCsrfToken(extended, cookieToken)).toBe(false);
  });
});

// ============================================================================
// Origin validation — realistic attack scenarios
// ============================================================================
describe('isValidOrigin — attack scenarios', () => {
  const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  it('allows own origin (from environment)', () => {
    const origin = new URL(appUrl).origin;
    expect(isValidOrigin(origin, null, appUrl)).toBe(true);
  });

  it('blocks attacker origin', () => {
    expect(isValidOrigin('https://attacker.example.com', null, appUrl)).toBe(false);
  });

  it('blocks null origin with attacker referer', () => {
    expect(isValidOrigin(null, 'https://evil.com/steal-csrf', appUrl)).toBe(false);
  });

  it('allows same-site request with no Origin/Referer', () => {
    // Browser may omit both headers for same-site navigations
    expect(isValidOrigin(null, null, appUrl)).toBe(true);
  });

  it('blocks origin with matching prefix but different domain', () => {
    // e.g. neto.co.il.evil.com
    expect(
      isValidOrigin('https://neto.co.il.evil.com', null, 'https://neto.co.il')
    ).toBe(false);
  });

  it('blocks http when app uses https', () => {
    expect(
      isValidOrigin('http://neto.co.il', null, 'https://neto.co.il')
    ).toBe(false);
  });
});

// ============================================================================
// Vercel preview deployments
// ============================================================================
describe('isValidOrigin — Vercel previews', () => {
  const appUrl = 'https://neto.co.il';

  it('allows any *.vercel.app origin', () => {
    expect(isValidOrigin('https://my-branch-abc123.vercel.app', null, appUrl)).toBe(true);
  });

  it('rejects fake vercel.app suffix on another domain', () => {
    // "evil-vercel.app" does not END with ".vercel.app"
    expect(isValidOrigin('https://evil-vercel.app', null, appUrl)).toBe(false);
  });
});

