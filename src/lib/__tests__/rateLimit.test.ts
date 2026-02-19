/**
 * Rate Limiting Tests
 *
 * Tests for in-memory rate limiter (the fallback used in tests).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock config to avoid env var issues
vi.mock('../config', () => ({
  config: {
    upstashRedisRestUrl: undefined,
    upstashRedisRestToken: undefined,
    encryptionKey: 'a'.repeat(64),
  },
}));

// Mock audit log to avoid Prisma dependency
vi.mock('../auditLog', () => ({
  logAuditEvent: vi.fn(),
  AuditAction: {
    RATE_LIMITED: 'RATE_LIMITED',
  },
}));

// Mock prisma
vi.mock('../prisma', () => ({
  prisma: {},
}));

import { checkRateLimit, RATE_LIMITS } from '../rateLimit';

describe('In-memory rate limiter', () => {
  it('should allow requests within limit', async () => {
    const config = { maxRequests: 5, windowSeconds: 60 };
    const result = await checkRateLimit('test:user1', config);
    expect(result.success).toBe(true);
    expect(result.remaining).toBeGreaterThanOrEqual(0);
  });

  it('should block requests over limit', async () => {
    const config = { maxRequests: 3, windowSeconds: 60 };
    const identifier = `test:user-limit-${Date.now()}`;

    // Make 3 allowed requests
    for (let i = 0; i < 3; i++) {
      const result = await checkRateLimit(identifier, config);
      expect(result.success).toBe(true);
    }

    // 4th should be blocked
    const result = await checkRateLimit(identifier, config);
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('should track remaining count correctly', async () => {
    const config = { maxRequests: 5, windowSeconds: 60 };
    const identifier = `test:remaining-${Date.now()}`;

    const r1 = await checkRateLimit(identifier, config);
    expect(r1.remaining).toBe(4);

    const r2 = await checkRateLimit(identifier, config);
    expect(r2.remaining).toBe(3);
  });

  it('should have proper preset configurations', () => {
    expect(RATE_LIMITS.auth.maxRequests).toBeLessThanOrEqual(10);
    expect(RATE_LIMITS.upload.maxRequests).toBeLessThanOrEqual(20);
    expect(RATE_LIMITS.contact.maxRequests).toBeLessThanOrEqual(10);
    expect(RATE_LIMITS.ai.maxRequests).toBeLessThanOrEqual(30);
  });
});

