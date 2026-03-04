/**
 * CSP Static Config Security Tests
 *
 * Verifies that the static Content-Security-Policy header defined in
 * next.config.ts does NOT contain unsafe directives in script-src after
 * the security fix. The middleware issues a stricter nonce-based CSP per
 * request; the static fallback must not undermine it.
 */

import { describe, it, expect } from 'vitest';
import nextConfig from '../../../next.config';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getCspValue(): Promise<string> {
  const headers = await nextConfig.headers!();
  const globalRule = headers[0]; // source: '/(.*)'
  const cspHeader = globalRule.headers.find(
    (h) => h.key === 'Content-Security-Policy'
  );
  if (!cspHeader) throw new Error('Content-Security-Policy header not found in next.config.ts');
  return cspHeader.value as string;
}

function getDirective(csp: string, name: string): string | undefined {
  return csp
    .split(';')
    .map((d) => d.trim())
    .find((d) => d.startsWith(name));
}

// ---------------------------------------------------------------------------
// CSP — script-src
// ---------------------------------------------------------------------------

describe('CSP static config — script-src', () => {
  it("does NOT include 'unsafe-eval'", async () => {
    const csp = await getCspValue();
    const scriptSrc = getDirective(csp, 'script-src');
    expect(scriptSrc).toBeDefined();
    expect(scriptSrc).not.toContain("'unsafe-eval'");
  });

  it("does NOT include 'unsafe-inline'", async () => {
    const csp = await getCspValue();
    const scriptSrc = getDirective(csp, 'script-src');
    expect(scriptSrc).toBeDefined();
    expect(scriptSrc).not.toContain("'unsafe-inline'");
  });

  it("includes 'self' as a script source", async () => {
    const csp = await getCspValue();
    const scriptSrc = getDirective(csp, 'script-src');
    expect(scriptSrc).toContain("'self'");
  });

  it('includes all required third-party script domains', async () => {
    const csp = await getCspValue();
    const scriptSrc = getDirective(csp, 'script-src');
    expect(scriptSrc).toContain('https://accounts.google.com');
    expect(scriptSrc).toContain('https://apis.google.com');
    expect(scriptSrc).toContain('https://web-sdk.smartlook.com');
    expect(scriptSrc).toContain('https://www.googletagmanager.com');
    expect(scriptSrc).toContain('https://cdn.mxpnl.com');
  });
});

// ---------------------------------------------------------------------------
// CSP — style-src
// ---------------------------------------------------------------------------

describe('CSP static config — style-src', () => {
  it("still includes 'unsafe-inline' (required by Tailwind CSS v4)", async () => {
    const csp = await getCspValue();
    const styleSrc = getDirective(csp, 'style-src');
    expect(styleSrc).toBeDefined();
    expect(styleSrc).toContain("'unsafe-inline'");
  });
});

// ---------------------------------------------------------------------------
// CSP — other security directives
// ---------------------------------------------------------------------------

describe('CSP static config — security directives', () => {
  it("sets default-src 'self'", async () => {
    const csp = await getCspValue();
    expect(csp).toContain("default-src 'self'");
  });

  it("sets frame-ancestors 'none'", async () => {
    const csp = await getCspValue();
    expect(csp).toContain("frame-ancestors 'none'");
  });

  it("sets object-src 'none'", async () => {
    const csp = await getCspValue();
    expect(csp).toContain("object-src 'none'");
  });

  it("sets form-action 'self'", async () => {
    const csp = await getCspValue();
    expect(csp).toContain("form-action 'self'");
  });

  it("sets base-uri 'self'", async () => {
    const csp = await getCspValue();
    expect(csp).toContain("base-uri 'self'");
  });
});
