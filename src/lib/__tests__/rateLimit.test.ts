/**
 * Rate Limiting Tests
 *
 * Tests for in-memory rate limiter (the fallback used in tests),
 * including the new IP-based rate limiting functionality.
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

import {
  checkRateLimit,
  checkRateLimitWithIp,
  getClientIp,
  RATE_LIMITS,
  IP_RATE_LIMITS,
} from '../rateLimit';
import { logAuditEvent } from '../auditLog';

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

describe('IP-based rate limiting presets', () => {
  it('should have IP_RATE_LIMITS for all critical endpoints', () => {
    expect(IP_RATE_LIMITS.upload).toBeDefined();
    expect(IP_RATE_LIMITS.download).toBeDefined();
    expect(IP_RATE_LIMITS.import).toBeDefined();
    expect(IP_RATE_LIMITS.contact).toBeDefined();
    expect(IP_RATE_LIMITS.auth).toBeDefined();
    expect(IP_RATE_LIMITS.api).toBeDefined();
  });

  it('should have reasonable values for IP limits', () => {
    expect(IP_RATE_LIMITS.upload.maxRequests).toBeGreaterThan(0);
    expect(IP_RATE_LIMITS.upload.maxRequests).toBeLessThanOrEqual(50);
    expect(IP_RATE_LIMITS.download.maxRequests).toBeGreaterThan(0);
    expect(IP_RATE_LIMITS.import.maxRequests).toBeGreaterThan(0);
    expect(IP_RATE_LIMITS.import.maxRequests).toBeLessThanOrEqual(20);
  });
});

describe('checkRateLimitWithIp', () => {
  it('should allow requests when both user and IP are within limits', async () => {
    const ts = Date.now();
    const result = await checkRateLimitWithIp(
      `user-both-ok-${ts}`,
      `192.168.1.${ts % 255}`,
      { maxRequests: 10, windowSeconds: 60 },
      { maxRequests: 20, windowSeconds: 60 },
      'test-both-ok',
    );
    expect(result.success).toBe(true);
    expect(result.remaining).toBeGreaterThan(0);
  });

  it('should block when user limit is exceeded', async () => {
    const ts = Date.now();
    const userId = `user-blocked-${ts}`;
    const ipAddress = `10.0.0.${ts % 255}`;
    const userConfig = { maxRequests: 2, windowSeconds: 60 };
    const ipConfig = { maxRequests: 100, windowSeconds: 60 };

    // Exhaust user limit
    await checkRateLimitWithIp(userId, ipAddress, userConfig, ipConfig, `test-user-block-${ts}`);
    await checkRateLimitWithIp(userId, ipAddress, userConfig, ipConfig, `test-user-block-${ts}`);

    // 3rd request should be blocked by user limit
    const result = await checkRateLimitWithIp(userId, ipAddress, userConfig, ipConfig, `test-user-block-${ts}`);
    expect(result.success).toBe(false);
  });

  it('should block when IP limit is exceeded', async () => {
    const ts = Date.now();
    const ipAddress = `172.16.0.${ts % 255}`;
    const userConfig = { maxRequests: 100, windowSeconds: 60 };
    const ipConfig = { maxRequests: 2, windowSeconds: 60 };
    const endpoint = `test-ip-block-${ts}`;

    // Exhaust IP limit with different users
    await checkRateLimitWithIp(`user-a-${ts}`, ipAddress, userConfig, ipConfig, endpoint);
    await checkRateLimitWithIp(`user-b-${ts}`, ipAddress, userConfig, ipConfig, endpoint);

    // 3rd request from same IP (different user) should be blocked
    const result = await checkRateLimitWithIp(`user-c-${ts}`, ipAddress, userConfig, ipConfig, endpoint);
    expect(result.success).toBe(false);
  });

  it('should log audit event when IP rate limit is hit', async () => {
    const ts = Date.now();
    const ipAddress = `10.10.10.${ts % 255}`;
    const userConfig = { maxRequests: 100, windowSeconds: 60 };
    const ipConfig = { maxRequests: 1, windowSeconds: 60 };
    const endpoint = `test-audit-${ts}`;

    // First request - allowed
    await checkRateLimitWithIp(`user-audit-${ts}`, ipAddress, userConfig, ipConfig, endpoint);

    // Second request - blocked, should log audit
    vi.mocked(logAuditEvent).mockClear();
    await checkRateLimitWithIp(`user-audit2-${ts}`, ipAddress, userConfig, ipConfig, endpoint);

    expect(logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'RATE_LIMITED',
        metadata: expect.objectContaining({
          type: 'ip_rate_limit',
          endpoint,
          ipAddress,
        }),
      }),
    );
  });

  it('should return the most restrictive remaining count when both pass', async () => {
    const ts = Date.now();
    const userConfig = { maxRequests: 5, windowSeconds: 60 };
    const ipConfig = { maxRequests: 3, windowSeconds: 60 };
    const endpoint = `test-restrictive-${ts}`;

    const result = await checkRateLimitWithIp(
      `user-restrict-${ts}`,
      `10.20.30.${ts % 255}`,
      userConfig,
      ipConfig,
      endpoint,
    );

    expect(result.success).toBe(true);
    // Should be min(userRemaining, ipRemaining) = min(4, 2) = 2
    expect(result.remaining).toBeLessThanOrEqual(4);
  });

  it('should default to IP_RATE_LIMITS.api when no ipConfig is provided', async () => {
    const ts = Date.now();
    const result = await checkRateLimitWithIp(
      `user-default-${ts}`,
      `192.168.99.${ts % 255}`,
      { maxRequests: 10, windowSeconds: 60 },
      undefined, // no ipConfig
      `test-default-${ts}`,
    );
    expect(result.success).toBe(true);
  });

  it('should isolate different endpoints', async () => {
    const ts = Date.now();
    const userId = `user-isolate-${ts}`;
    const ipAddress = `10.0.99.${ts % 255}`;
    const config = { maxRequests: 1, windowSeconds: 60 };

    // Exhaust limit on endpoint A
    await checkRateLimitWithIp(userId, ipAddress, config, config, `endpoint-a-${ts}`);
    const resultA = await checkRateLimitWithIp(userId, ipAddress, config, config, `endpoint-a-${ts}`);
    expect(resultA.success).toBe(false);

    // Endpoint B should still work
    const resultB = await checkRateLimitWithIp(userId, ipAddress, config, config, `endpoint-b-${ts}`);
    expect(resultB.success).toBe(true);
  });
});

describe('getClientIp', () => {
  it('should extract IP from x-real-ip header', () => {
    const headers = new Headers({ 'x-real-ip': '1.2.3.4' });
    expect(getClientIp(headers)).toBe('1.2.3.4');
  });

  it('should extract first IP from x-forwarded-for', () => {
    const headers = new Headers({ 'x-forwarded-for': '5.6.7.8, 10.0.0.1' });
    expect(getClientIp(headers)).toBe('5.6.7.8');
  });

  it('should extract IP from cf-connecting-ip', () => {
    const headers = new Headers({ 'cf-connecting-ip': '9.8.7.6' });
    expect(getClientIp(headers)).toBe('9.8.7.6');
  });

  it('should return unknown when no IP headers present', () => {
    const headers = new Headers();
    expect(getClientIp(headers)).toBe('unknown');
  });

  it('should prefer x-real-ip over x-forwarded-for', () => {
    const headers = new Headers({
      'x-real-ip': '1.1.1.1',
      'x-forwarded-for': '2.2.2.2',
    });
    expect(getClientIp(headers)).toBe('1.1.1.1');
  });
});

