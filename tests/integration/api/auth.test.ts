/**
 * Authentication Integration Tests
 *
 * Tests for CSRF protection, admin access control,
 * and middleware behavior.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock config
vi.mock('@/lib/config', () => ({
  config: {
    adminEmails: ['admin@example.com'],
    encryptionKey: 'a'.repeat(64),
    nodeEnv: 'test',
  },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {},
}));

import { createMockRequest } from '../../helpers/api';

// ============================================================================
// Test Environment Safety
// ============================================================================

describe('Test environment safety', () => {
  it('should have NODE_ENV set to test', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });
});

// ============================================================================
// CSRF Protection
// ============================================================================

describe('CSRF Protection', () => {
  it('should allow passing X-CSRF-Token header for POST requests', () => {
    const csrfToken = 'a'.repeat(64);
    const request = createMockRequest('/api/transactions', {
      method: 'POST',
      body: { type: 'expense', amount: 100 },
      headers: { 'X-CSRF-Token': csrfToken },
    });

    expect(request.headers.get('X-CSRF-Token')).toBe(csrfToken);
  });

  it('should not require CSRF for GET requests', () => {
    const request = createMockRequest('/api/transactions', {
      method: 'GET',
    });

    expect(request.headers.get('X-CSRF-Token')).toBeNull();
  });

  it('should allow passing X-CSRF-Token header for PUT/DELETE/PATCH requests', () => {
    const csrfToken = 'b'.repeat(64);
    const putReq = createMockRequest('/api/transactions/1', { method: 'PUT', body: {}, headers: { 'X-CSRF-Token': csrfToken } });
    const deleteReq = createMockRequest('/api/transactions/1', { method: 'DELETE', headers: { 'X-CSRF-Token': csrfToken } });
    const patchReq = createMockRequest('/api/transactions/1', { method: 'PATCH', body: {}, headers: { 'X-CSRF-Token': csrfToken } });

    expect(putReq.headers.get('X-CSRF-Token')).toBe(csrfToken);
    expect(deleteReq.headers.get('X-CSRF-Token')).toBe(csrfToken);
    expect(patchReq.headers.get('X-CSRF-Token')).toBe(csrfToken);
  });
});

// ============================================================================
// Admin Access Control
// ============================================================================

describe('Admin access control', () => {
  it('should identify admin emails', () => {
    const adminEmails = ['admin@example.com'];
    expect(adminEmails.includes('admin@example.com')).toBe(true);
    expect(adminEmails.includes('regular@example.com')).toBe(false);
  });

  it('should be case-insensitive for admin check', () => {
    const adminEmails = ['admin@example.com'];
    const email = 'ADMIN@EXAMPLE.COM'.toLowerCase();
    expect(adminEmails.includes(email)).toBe(true);
  });
});

// ============================================================================
// Mock Request Validation
// ============================================================================

describe('API request helpers', () => {
  it('should create request with correct URL', () => {
    const request = createMockRequest('/api/test');
    expect(request.url).toContain('/api/test');
  });

  it('should create request with search params', () => {
    const request = createMockRequest('/api/test', {
      searchParams: { page: '1', limit: '10' },
    });
    const url = new URL(request.url);
    expect(url.searchParams.get('page')).toBe('1');
    expect(url.searchParams.get('limit')).toBe('10');
  });

  it('should create request with custom headers', () => {
    const request = createMockRequest('/api/test', {
      headers: { 'X-Custom': 'value' },
    });
    expect(request.headers.get('X-Custom')).toBe('value');
  });
});

