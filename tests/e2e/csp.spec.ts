/**
 * CSP (Content Security Policy) — E2E Tests
 *
 * Verifies that the dynamic CSP with per-request nonce is working:
 * - CSP header present on every response
 * - Nonce changes per request
 * - No CSP violations in the browser console
 * - Scripts load successfully
 */

import { test, expect } from '@playwright/test';

test.describe('CSP Header', () => {
  test('CSP header is present on page responses', async ({ page }) => {
    const response = await page.goto('/');
    const csp = response?.headers()['content-security-policy'];

    expect(csp).toBeTruthy();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain('script-src');
    expect(csp).toContain('report-uri /api/csp-report');
  });

  test('CSP header contains a nonce in script-src', async ({ page }) => {
    const response = await page.goto('/');
    const csp = response?.headers()['content-security-policy'] ?? '';

    // Should contain 'nonce-<value>' in script-src
    expect(csp).toMatch(/script-src[^;]*'nonce-[A-Za-z0-9\-_]+'/);
  });

  test('nonce is different on each request', async ({ page }) => {
    const extractNonce = (csp: string): string | null => {
      const match = csp.match(/'nonce-([A-Za-z0-9\-_]+)'/);
      return match ? match[1] : null;
    };

    const response1 = await page.goto('/');
    const csp1 = response1?.headers()['content-security-policy'] ?? '';
    const nonce1 = extractNonce(csp1);

    const response2 = await page.goto('/');
    const csp2 = response2?.headers()['content-security-policy'] ?? '';
    const nonce2 = extractNonce(csp2);

    expect(nonce1).toBeTruthy();
    expect(nonce2).toBeTruthy();
    expect(nonce1).not.toBe(nonce2);
  });

  test('CSP does not include unsafe-eval in production mode', async ({ page }) => {
    // In test/prod mode, unsafe-eval should not appear in script-src
    const response = await page.goto('/');
    const csp = response?.headers()['content-security-policy'] ?? '';

    const scriptSrc = csp.split(';').find((d) => d.trim().startsWith('script-src')) ?? '';

    // In dev mode unsafe-eval may be present, so we skip this assertion in dev
    if (process.env.NODE_ENV !== 'development') {
      expect(scriptSrc).not.toContain("'unsafe-eval'");
    }
  });

  test('CSP includes required external domains', async ({ page }) => {
    const response = await page.goto('/');
    const csp = response?.headers()['content-security-policy'] ?? '';

    // Google OAuth & Analytics
    expect(csp).toContain('https://accounts.google.com');
    // Smartlook
    expect(csp).toContain('https://web-sdk.smartlook.com');
    // Google Tag Manager
    expect(csp).toContain('https://www.googletagmanager.com');
  });

  test('no CSP violations in browser console on landing page', async ({ page }) => {
    const violations: string[] = [];

    page.on('console', (msg) => {
      const text = msg.text();
      if (
        msg.type() === 'error' &&
        (text.includes('Content Security Policy') ||
          text.includes('CSP') ||
          text.includes('Refused to'))
      ) {
        violations.push(text);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Allow a short grace period for late-loading scripts
    await page.waitForTimeout(1000);

    expect(violations).toHaveLength(0);
  });
});

test.describe('CSP Report Endpoint', () => {
  test('CSP report endpoint accepts POST requests', async ({ request }) => {
    const response = await request.post('/api/csp-report', {
      data: {
        'csp-report': {
          'document-uri': 'http://localhost:3000/',
          'violated-directive': "script-src 'self'",
          'blocked-uri': 'https://evil.example.com/script.js',
        },
      },
      headers: {
        'Content-Type': 'application/csp-report',
      },
    });

    expect(response.status()).toBe(204);
  });
});

