/**
 * CSP Config Security Tests
 *
 * Verifies that:
 * 1. next.config.ts does NOT include a static Content-Security-Policy header
 *    (to avoid duplicate CSP headers that conflict with the middleware's
 *    nonce-based policy).
 * 2. The dynamic CSP built by middleware (src/lib/csp.ts) is properly secured.
 */

import { describe, it, expect } from 'vitest';
import nextConfig from '../../../next.config';
import { buildCspHeader, generateCspNonce } from '../../../src/lib/csp';

// ---------------------------------------------------------------------------
// Static config must NOT contain CSP (middleware owns it)
// ---------------------------------------------------------------------------

describe('next.config.ts headers', () => {
  it('does NOT include a static Content-Security-Policy header', async () => {
    const headers = await nextConfig.headers!();
    const globalRule = headers[0];
    const cspHeader = globalRule.headers.find(
      (h) => h.key === 'Content-Security-Policy'
    );
    expect(cspHeader).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Middleware CSP (buildCspHeader) — script-src
// ---------------------------------------------------------------------------

describe('Middleware CSP — script-src', () => {
  const nonce = generateCspNonce();
  const csp = buildCspHeader(nonce);

  function getDirective(name: string): string | undefined {
    return csp
      .split(';')
      .map((d) => d.trim())
      .find((d) => d.startsWith(name));
  }

  it("does NOT include 'unsafe-eval' in production", () => {
    const scriptSrc = getDirective('script-src');
    expect(scriptSrc).toBeDefined();
    // buildCspHeader only adds unsafe-eval in dev; in test env it should be absent
    if (process.env.NODE_ENV !== 'development') {
      expect(scriptSrc).not.toContain("'unsafe-eval'");
    }
  });

  it("does NOT include 'unsafe-inline'", () => {
    const scriptSrc = getDirective('script-src');
    expect(scriptSrc).toBeDefined();
    expect(scriptSrc).not.toContain("'unsafe-inline'");
  });

  it('includes the nonce', () => {
    const scriptSrc = getDirective('script-src');
    expect(scriptSrc).toContain(`'nonce-${nonce}'`);
  });

  it("includes 'self' as a script source", () => {
    const scriptSrc = getDirective('script-src');
    expect(scriptSrc).toContain("'self'");
  });

  it('includes all required third-party script domains', () => {
    const scriptSrc = getDirective('script-src');
    expect(scriptSrc).toContain('https://accounts.google.com');
    expect(scriptSrc).toContain('https://apis.google.com');
    expect(scriptSrc).toContain('https://web-sdk.smartlook.com');
    expect(scriptSrc).toContain('https://www.googletagmanager.com');
    expect(scriptSrc).toContain('https://cdn.mxpnl.com');
  });
});

// ---------------------------------------------------------------------------
// Middleware CSP — style-src
// ---------------------------------------------------------------------------

describe('Middleware CSP — style-src', () => {
  const csp = buildCspHeader(generateCspNonce());

  function getDirective(name: string): string | undefined {
    return csp
      .split(';')
      .map((d) => d.trim())
      .find((d) => d.startsWith(name));
  }

  it("includes 'unsafe-inline' (required by Tailwind CSS v4)", () => {
    const styleSrc = getDirective('style-src');
    expect(styleSrc).toBeDefined();
    expect(styleSrc).toContain("'unsafe-inline'");
  });
});

// ---------------------------------------------------------------------------
// Middleware CSP — security directives
// ---------------------------------------------------------------------------

describe('Middleware CSP — security directives', () => {
  const csp = buildCspHeader(generateCspNonce());

  it("sets default-src 'self'", () => {
    expect(csp).toContain("default-src 'self'");
  });

  it("sets frame-ancestors 'none'", () => {
    expect(csp).toContain("frame-ancestors 'none'");
  });

  it("sets object-src 'none'", () => {
    expect(csp).toContain("object-src 'none'");
  });

  it("sets form-action 'self'", () => {
    expect(csp).toContain("form-action 'self'");
  });

  it("sets base-uri 'self'", () => {
    expect(csp).toContain("base-uri 'self'");
  });
});
