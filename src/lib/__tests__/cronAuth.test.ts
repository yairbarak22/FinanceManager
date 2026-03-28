/**
 * Cron Auth Tests
 *
 * Tests for isAuthorizedCronRequest() from src/lib/cronAuth.ts.
 * Verifies fail-closed behavior and query param restrictions.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { isAuthorizedCronRequest } from '../cronAuth';

// Save and restore env vars
let savedEnv: Record<string, string | undefined>;

beforeEach(() => {
  savedEnv = {
    CRON_SECRET: process.env.CRON_SECRET,
    NODE_ENV: process.env.NODE_ENV,
  };
});

afterEach(() => {
  if (savedEnv.CRON_SECRET === undefined) {
    delete process.env.CRON_SECRET;
  } else {
    process.env.CRON_SECRET = savedEnv.CRON_SECRET;
  }
  if (savedEnv.NODE_ENV === undefined) {
    delete process.env.NODE_ENV;
  } else {
    process.env.NODE_ENV = savedEnv.NODE_ENV;
  }
});

function createCronRequest(options: {
  bearerToken?: string;
  querySecret?: string;
} = {}): NextRequest {
  let url = 'http://localhost:3000/api/cron/smart-send';
  if (options.querySecret) {
    url += `?secret=${options.querySecret}`;
  }
  const headers: Record<string, string> = {};
  if (options.bearerToken) {
    headers['authorization'] = `Bearer ${options.bearerToken}`;
  }
  return new NextRequest(url, { headers });
}

// ============================================================================
// CRON_SECRET not set
// ============================================================================

describe('CRON_SECRET is not set', () => {
  it('should deny in production (fail-closed)', () => {
    delete process.env.CRON_SECRET;
    process.env.NODE_ENV = 'production';
    const request = createCronRequest();
    expect(isAuthorizedCronRequest(request)).toBe(false);
  });

  it('should allow in non-production (development/test)', () => {
    delete process.env.CRON_SECRET;
    process.env.NODE_ENV = 'test';
    const request = createCronRequest();
    expect(isAuthorizedCronRequest(request)).toBe(true);
  });
});

// ============================================================================
// Bearer token authentication
// ============================================================================

describe('Bearer token authentication', () => {
  it('should accept valid Bearer token in production', () => {
    process.env.CRON_SECRET = 'test-secret';
    process.env.NODE_ENV = 'production';
    const request = createCronRequest({ bearerToken: 'test-secret' });
    expect(isAuthorizedCronRequest(request)).toBe(true);
  });

  it('should reject invalid Bearer token', () => {
    process.env.CRON_SECRET = 'test-secret';
    process.env.NODE_ENV = 'production';
    const request = createCronRequest({ bearerToken: 'wrong-secret' });
    expect(isAuthorizedCronRequest(request)).toBe(false);
  });

  it('should reject missing Authorization header', () => {
    process.env.CRON_SECRET = 'test-secret';
    process.env.NODE_ENV = 'production';
    const request = createCronRequest();
    expect(isAuthorizedCronRequest(request)).toBe(false);
  });
});

// ============================================================================
// Query parameter authentication
// ============================================================================

describe('Query parameter authentication', () => {
  it('should accept valid query param in non-production', () => {
    process.env.CRON_SECRET = 'test-secret';
    process.env.NODE_ENV = 'test';
    const request = createCronRequest({ querySecret: 'test-secret' });
    expect(isAuthorizedCronRequest(request)).toBe(true);
  });

  it('should reject query param in production (prevents secret in logs)', () => {
    process.env.CRON_SECRET = 'test-secret';
    process.env.NODE_ENV = 'production';
    const request = createCronRequest({ querySecret: 'test-secret' });
    expect(isAuthorizedCronRequest(request)).toBe(false);
  });

  it('should reject invalid query param value', () => {
    process.env.CRON_SECRET = 'test-secret';
    process.env.NODE_ENV = 'test';
    const request = createCronRequest({ querySecret: 'wrong-secret' });
    expect(isAuthorizedCronRequest(request)).toBe(false);
  });
});

// ============================================================================
// Priority
// ============================================================================

describe('Authentication priority', () => {
  it('should accept valid Bearer token even with invalid query param', () => {
    process.env.CRON_SECRET = 'test-secret';
    process.env.NODE_ENV = 'test';
    const request = createCronRequest({
      bearerToken: 'test-secret',
      querySecret: 'wrong-value',
    });
    expect(isAuthorizedCronRequest(request)).toBe(true);
  });
});
