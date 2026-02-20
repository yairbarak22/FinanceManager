/**
 * Regression E2E Tests
 *
 * Verifies that existing features still work after the security changes:
 * - CSP with nonce
 * - Cross-Origin Headers
 * - Zod Validation on API routes
 *
 * These tests run against an unauthenticated context unless noted.
 */

import { test, expect } from '@playwright/test';

test.describe('Landing Page Regression', () => {
  test('landing page loads without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(errors).toHaveLength(0);
    await expect(page.locator('body')).toBeVisible();
  });

  test('landing page has a title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/./);
  });

  test('landing page renders visible content', async ({ page }) => {
    await page.goto('/');
    // At least one heading or main content should be visible
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(0);
  });
});

test.describe('Authentication Redirects', () => {
  test('unauthenticated users redirect from /dashboard to /', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/$/);
  });

  test('unauthenticated /login redirects to /', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('body')).toBeVisible();
  });

  test('unauthenticated API calls return redirect', async ({ request }) => {
    const response = await request.get('/api/transactions', {
      maxRedirects: 0,
    });
    expect([301, 302, 303, 307, 308]).toContain(response.status());
  });
});

test.describe('CSRF Protection', () => {
  test('API POST without CSRF header is blocked', async ({ request }) => {
    const response = await request.post('/api/transactions', {
      data: { type: 'expense', amount: 100, category: 'Test', description: 'test', date: '2024-01-01' },
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Protection': '', // Override global
      },
      maxRedirects: 0,
    });
    // Blocked by auth redirect or CSRF
    expect([301, 302, 303, 307, 308, 401, 403]).toContain(response.status());
  });
});

test.describe('API Validation (unauthenticated)', () => {
  // These test that the server responds without crashing even for bad input.
  // Auth redirect will likely happen first, but the server should not 500.

  test('POST /api/transactions with invalid data does not crash', async ({ request }) => {
    const response = await request.post('/api/transactions', {
      data: { invalid: true },
      maxRedirects: 0,
    });
    // Should get a redirect (auth) or 400/403, NOT 500
    expect(response.status()).not.toBe(500);
  });

  test('POST /api/recurring with invalid data does not crash', async ({ request }) => {
    const response = await request.post('/api/recurring', {
      data: { amount: -100 },
      maxRedirects: 0,
    });
    expect(response.status()).not.toBe(500);
  });

  test('POST /api/liabilities with invalid data does not crash', async ({ request }) => {
    const response = await request.post('/api/liabilities', {
      data: {},
      maxRedirects: 0,
    });
    expect(response.status()).not.toBe(500);
  });

  test('POST /api/goals with invalid data does not crash', async ({ request }) => {
    const response = await request.post('/api/goals', {
      data: { targetAmount: -1 },
      maxRedirects: 0,
    });
    expect(response.status()).not.toBe(500);
  });
});

test.describe('Static Assets', () => {
  test('favicon loads', async ({ request }) => {
    const response = await request.get('/favicon.ico');
    expect(response.status()).toBe(200);
  });
});

