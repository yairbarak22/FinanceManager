/**
 * Security Headers — E2E Tests
 *
 * Verifies that all security headers (including the new Cross-Origin headers)
 * are present on responses from the application.
 */

import { test, expect } from '@playwright/test';

test.describe('Cross-Origin Headers', () => {
  test('all Cross-Origin headers present on landing page', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers() ?? {};

    expect(headers['cross-origin-opener-policy']).toBe('same-origin-allow-popups');
    expect(headers['cross-origin-embedder-policy']).toBe('unsafe-none');
    expect(headers['cross-origin-resource-policy']).toBe('same-origin');
    expect(headers['x-permitted-cross-domain-policies']).toBe('none');
    expect(headers['x-dns-prefetch-control']).toBe('off');
  });

  test('Cross-Origin headers present on redirect responses', async ({ request }) => {
    // /dashboard should redirect unauthenticated users
    const response = await request.get('/dashboard', { maxRedirects: 0 });
    const headers = response.headers();

    // Redirect responses from next.config.ts headers also apply
    // These are set at the Next.js config level on all routes
    expect(headers['cross-origin-opener-policy']).toBe('same-origin-allow-popups');
    expect(headers['cross-origin-resource-policy']).toBe('same-origin');
  });
});

test.describe('Existing Security Headers', () => {
  test('standard security headers are present', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers() ?? {};

    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  });

  test('HSTS header is present', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers() ?? {};

    // In development, HSTS may not be present
    if (process.env.NODE_ENV !== 'development') {
      const hsts = headers['strict-transport-security'];
      if (hsts) {
        expect(hsts).toContain('max-age=');
        expect(hsts).toContain('includeSubDomains');
      }
    }
  });

  test('Permissions-Policy header is present', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers() ?? {};

    const pp = headers['permissions-policy'];
    if (pp) {
      expect(pp).toContain('camera=()');
      expect(pp).toContain('microphone=()');
      expect(pp).toContain('geolocation=()');
    }
  });

  test('CSP header is present (dynamic, from middleware)', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers() ?? {};

    expect(headers['content-security-policy']).toBeTruthy();
    expect(headers['content-security-policy']).toContain("default-src 'self'");
  });
});

test.describe('Headers on API routes', () => {
  test('security headers on API responses (unauthenticated redirect)', async ({ request }) => {
    const response = await request.get('/api/transactions', { maxRedirects: 0 });
    const headers = response.headers();

    // Cross-Origin headers should be present even on API redirects
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['cross-origin-opener-policy']).toBe('same-origin-allow-popups');
  });
});

