/**
 * CSP Nonce & Header Tests
 *
 * Unit tests for nonce generation (Edge Runtime compatible)
 * and CSP header construction.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateCspNonce, buildCspHeader } from '../csp';

// ============================================================================
// Nonce Generation
// ============================================================================

describe('generateCspNonce', () => {
  it('generates a non-empty string', () => {
    const nonce = generateCspNonce();
    expect(nonce).toBeTruthy();
    expect(nonce.length).toBeGreaterThan(0);
  });

  it('generates base64url-safe output (no +, /, =)', () => {
    // Run many times to cover randomness
    for (let i = 0; i < 200; i++) {
      const nonce = generateCspNonce();
      expect(nonce).not.toContain('+');
      expect(nonce).not.toContain('/');
      expect(nonce).not.toContain('=');
    }
  });

  it('generates nonces of expected length (~22 chars for 16 bytes)', () => {
    const nonce = generateCspNonce();
    // 16 bytes → 24 base64 chars → minus padding → 22 chars base64url
    expect(nonce.length).toBeGreaterThanOrEqual(20);
    expect(nonce.length).toBeLessThanOrEqual(24);
  });

  it('generates unique nonces on each call', () => {
    const nonces = new Set<string>();
    for (let i = 0; i < 100; i++) {
      nonces.add(generateCspNonce());
    }
    expect(nonces.size).toBe(100);
  });

  it('does not use Node.js Buffer (Edge Runtime compatible)', () => {
    // If Buffer were used, this would still work in Node tests,
    // so we verify the function source doesn't reference Buffer.
    const src = generateCspNonce.toString();
    expect(src).not.toContain('Buffer');
  });

  it('only contains URL-safe characters', () => {
    const nonce = generateCspNonce();
    // base64url alphabet: A-Z a-z 0-9 - _
    expect(nonce).toMatch(/^[A-Za-z0-9\-_]+$/);
  });
});

// ============================================================================
// CSP Header Building
// ============================================================================

describe('buildCspHeader', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('includes the nonce in script-src', () => {
    const nonce = 'test-nonce-abc123';
    const csp = buildCspHeader(nonce);
    expect(csp).toContain(`'nonce-${nonce}'`);
  });

  it('includes nonce only in script-src, not in style-src', () => {
    const nonce = 'unique-nonce-xyz';
    const csp = buildCspHeader(nonce);

    // Extract script-src directive
    const scriptSrc = csp.split(';').find((d) => d.trim().startsWith('script-src'));
    expect(scriptSrc).toContain(`'nonce-${nonce}'`);

    // Extract style-src directive — should NOT have nonce
    const styleSrc = csp.split(';').find((d) => d.trim().startsWith('style-src'));
    expect(styleSrc).not.toContain('nonce-');
  });

  it('does NOT include unsafe-eval in production', () => {
    process.env.NODE_ENV = 'production';
    const csp = buildCspHeader('nonce');
    expect(csp).not.toContain("'unsafe-eval'");
  });

  it('includes unsafe-eval in development', () => {
    process.env.NODE_ENV = 'development';
    const csp = buildCspHeader('nonce');
    expect(csp).toContain("'unsafe-eval'");
  });

  it('includes unsafe-inline ONLY in style-src (Tailwind v4)', () => {
    process.env.NODE_ENV = 'production';
    const csp = buildCspHeader('nonce');
    const directives = csp.split(';').map((d) => d.trim());

    const styleSrc = directives.find((d) => d.startsWith('style-src'));
    expect(styleSrc).toContain("'unsafe-inline'");

    const scriptSrc = directives.find((d) => d.startsWith('script-src'));
    expect(scriptSrc).not.toContain("'unsafe-inline'");
  });

  it('includes all required external domains', () => {
    const csp = buildCspHeader('nonce');

    // Script domains
    expect(csp).toContain('https://accounts.google.com');
    expect(csp).toContain('https://apis.google.com');
    expect(csp).toContain('https://web-sdk.smartlook.com');
    expect(csp).toContain('https://www.googletagmanager.com');
    expect(csp).toContain('https://cdn.mxpnl.com');

    // Connect domains
    expect(csp).toContain('https://api.openai.com');
    expect(csp).toContain('https://*.vercel-storage.com');
    expect(csp).toContain('https://*.smartlook.com');
    expect(csp).toContain('https://*.google-analytics.com');
    expect(csp).toContain('https://*.mixpanel.com');

    // Font domains
    expect(csp).toContain('https://fonts.googleapis.com');
    expect(csp).toContain('https://fonts.gstatic.com');
  });

  it('includes report-uri pointing to /api/csp-report', () => {
    const csp = buildCspHeader('nonce');
    expect(csp).toContain('report-uri /api/csp-report');
  });

  it('includes all core security directives', () => {
    const csp = buildCspHeader('nonce');

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("form-action 'self'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("worker-src 'self' blob:");
  });

  it('includes frame-src for Google OAuth', () => {
    const csp = buildCspHeader('nonce');
    const frameSrc = csp.split(';').find((d) => d.trim().startsWith('frame-src'));
    expect(frameSrc).toContain('https://accounts.google.com');
  });

  it('does not include localhost sources in production', () => {
    process.env.NODE_ENV = 'production';
    const csp = buildCspHeader('nonce');
    expect(csp).not.toContain('http://localhost');
    expect(csp).not.toContain('ws://localhost');
  });

  it('includes localhost sources in development', () => {
    process.env.NODE_ENV = 'development';
    const csp = buildCspHeader('nonce');
    expect(csp).toContain('http://localhost:*');
    expect(csp).toContain('ws://localhost:*');
  });
});

