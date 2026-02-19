/**
 * File Upload E2E Tests
 *
 * Tests for the complete file upload flow including validation,
 * storage, and retrieval.
 *
 * NOTE: These tests require authentication. In a real E2E setup,
 * you would need to set up an authenticated session first.
 * For now, these test the API endpoints directly.
 */

import { test, expect } from '@playwright/test';

test.describe('File Upload API', () => {
  test('should reject upload without authentication', async ({ request }) => {
    // Create a small test file
    const buffer = Buffer.from('%PDF-1.4 test content');

    const response = await request.post('/api/documents', {
      multipart: {
        file: {
          name: 'test.pdf',
          mimeType: 'application/pdf',
          buffer,
        },
        entityType: 'asset',
        entityId: 'test-asset-1',
      },
      headers: {
        'X-CSRF-Protection': '1',
      },
      maxRedirects: 0,
    });

    // Should be redirected by middleware (unauthenticated)
    expect([301, 302, 303, 307, 308]).toContain(response.status());
  });

  test('should reject upload without CSRF header', async ({ request }) => {
    const buffer = Buffer.from('%PDF-1.4 test content');

    const response = await request.post('/api/documents', {
      multipart: {
        file: {
          name: 'test.pdf',
          mimeType: 'application/pdf',
          buffer,
        },
        entityType: 'asset',
        entityId: 'test-asset-1',
      },
      headers: {
        'X-CSRF-Protection': '', // Override global header to empty
      },
      maxRedirects: 0,
    });

    // Should be blocked by auth redirect (302/307) or CSRF (403)
    expect([301, 302, 303, 307, 308, 401, 403]).toContain(response.status());
  });
});

test.describe('File Download API', () => {
  test('should reject download without authentication', async ({ request }) => {
    const response = await request.get('/api/documents/download/fake-doc-id', {
      maxRedirects: 0,
    });
    // Should be redirected by middleware (unauthenticated)
    expect([301, 302, 303, 307, 308]).toContain(response.status());
  });
});
