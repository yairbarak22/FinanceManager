/**
 * Smoke E2E Tests
 *
 * Basic tests to verify the app loads and critical pages are accessible.
 * These run against a Neon branch database (not production).
 */

import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('should load the landing page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/./); // Has some title
    // The page should render without errors
    await expect(page.locator('body')).toBeVisible();
  });

  test('should redirect unauthenticated users from dashboard to landing', async ({ page }) => {
    await page.goto('/dashboard');
    // Middleware redirects unauthenticated users to /
    // After redirect completes, URL should be the landing page
    await expect(page).toHaveURL(/\/$/);
  });

  test('should show landing page for unauthenticated users visiting /login', async ({ page }) => {
    // Middleware redirects /login to / for unauthenticated users
    await page.goto('/login');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should redirect unauthenticated API calls', async ({ request }) => {
    // The middleware redirects unauthenticated requests to /
    // Use maxRedirects: 0 to catch the redirect itself
    const response = await request.get('/api/transactions', {
      maxRedirects: 0,
    });
    // Middleware returns a redirect (307 or 302) to landing page
    expect([301, 302, 303, 307, 308]).toContain(response.status());
  });

  test('should block API POST without CSRF header', async ({ request }) => {
    // Create a fresh request context WITHOUT the global CSRF header
    const response = await request.post('/api/transactions', {
      data: { type: 'expense', amount: 100 },
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Protection': '', // Override global header to empty
      },
      maxRedirects: 0,
    });
    // Should be blocked by auth redirect (302/307) or CSRF (403)
    expect([301, 302, 303, 307, 308, 401, 403]).toContain(response.status());
  });
});

test.describe('Security Headers', () => {
  test('should include security headers', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers();

    if (headers) {
      // These headers should be set by next.config.ts
      // Note: in dev mode some headers may not be present
      expect(headers['x-content-type-options']).toBe('nosniff');
      expect(headers['x-frame-options']).toBe('DENY');
    }
  });
});
