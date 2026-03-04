/**
 * Integration Tests — merchant-category API route
 *
 * Covers the three security layers added in the critical security fix:
 *   1. Authentication  – requireAuth() is called; 401 returned when unauthenticated
 *   2. Rate Limiting   – checkRateLimit() is called; 429 returned when limit exceeded
 *   3. Zod Validation  – schema is enforced; 400 returned for bad input
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, DELETE } from '@/app/api/merchant-category/route';
import { createMockRequest } from '../../helpers/api';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Auth — controlled per test
vi.mock('@/lib/authHelpers', () => ({
  requireAuth: vi.fn(),
}));

// Rate limit — allow by default, override per test
vi.mock('@/lib/rateLimit', () => ({
  checkRateLimit: vi.fn(),
  RATE_LIMITS: { api: { maxRequests: 100, windowSeconds: 60 } },
}));

// Prisma — never hits the real DB
vi.mock('@/lib/prisma', () => ({
  prisma: {
    merchantCategoryMap: {
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

// ---------------------------------------------------------------------------
// Import mocked helpers AFTER vi.mock() declarations so they are already
// replaced by the time we grab a reference to them.
// ---------------------------------------------------------------------------
import { requireAuth } from '@/lib/authHelpers';
import { checkRateLimit } from '@/lib/rateLimit';
import { prisma } from '@/lib/prisma';

const mockRequireAuth = vi.mocked(requireAuth);
const mockCheckRateLimit = vi.mocked(checkRateLimit);
const mockUpsert = vi.mocked(prisma.merchantCategoryMap.upsert);
const mockDeleteMany = vi.mocked(prisma.merchantCategoryMap.deleteMany);

// ---------------------------------------------------------------------------
// Shared setup
// ---------------------------------------------------------------------------

const AUTHED_USER_ID = 'user-test-123';

function allowAuth() {
  mockRequireAuth.mockResolvedValue({ userId: AUTHED_USER_ID, error: null });
}

function denyAuth() {
  const { NextResponse } = require('next/server');
  mockRequireAuth.mockResolvedValue({
    userId: null,
    error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
  });
}

function allowRateLimit() {
  mockCheckRateLimit.mockResolvedValue({
    success: true,
    remaining: 99,
    reset: Date.now() + 60_000,
  });
}

function denyRateLimit() {
  mockCheckRateLimit.mockResolvedValue({
    success: false,
    remaining: 0,
    reset: Date.now() + 60_000,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  allowAuth();
  allowRateLimit();
  mockUpsert.mockResolvedValue({
    id: 'map-1',
    userId: AUTHED_USER_ID,
    merchantName: 'coffee shop',
    category: 'food',
    alwaysAsk: false,
    isManual: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as never);
  mockDeleteMany.mockResolvedValue({ count: 1 });
});

// ===========================================================================
// POST /api/merchant-category
// ===========================================================================

describe('POST /api/merchant-category — authentication', () => {
  it('calls requireAuth()', async () => {
    const req = createMockRequest('/api/merchant-category', {
      method: 'POST',
      body: { merchantName: 'Coffee Shop', category: 'food' },
    });

    await POST(req);

    expect(mockRequireAuth).toHaveBeenCalledOnce();
  });

  it('returns 401 when unauthenticated', async () => {
    denyAuth();
    const req = createMockRequest('/api/merchant-category', {
      method: 'POST',
      body: { merchantName: 'Coffee Shop', category: 'food' },
    });

    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it('does NOT call checkRateLimit when auth fails', async () => {
    denyAuth();
    const req = createMockRequest('/api/merchant-category', {
      method: 'POST',
      body: { merchantName: 'Coffee Shop' },
    });

    await POST(req);

    expect(mockCheckRateLimit).not.toHaveBeenCalled();
  });
});

describe('POST /api/merchant-category — rate limiting', () => {
  it('calls checkRateLimit with correct identifier and config', async () => {
    const req = createMockRequest('/api/merchant-category', {
      method: 'POST',
      body: { merchantName: 'Coffee Shop', category: 'food' },
    });

    await POST(req);

    expect(mockCheckRateLimit).toHaveBeenCalledOnce();
    const [identifier, config] = mockCheckRateLimit.mock.calls[0];
    expect(identifier).toBe(`api:${AUTHED_USER_ID}`);
    expect(config).toBeDefined();
  });

  it('returns 429 when rate limit is exceeded', async () => {
    denyRateLimit();
    const req = createMockRequest('/api/merchant-category', {
      method: 'POST',
      body: { merchantName: 'Coffee Shop' },
    });

    const res = await POST(req);

    expect(res.status).toBe(429);
  });

  it('does NOT proceed to business logic when rate-limited', async () => {
    denyRateLimit();
    const req = createMockRequest('/api/merchant-category', {
      method: 'POST',
      body: { merchantName: 'Coffee Shop' },
    });

    await POST(req);

    expect(mockUpsert).not.toHaveBeenCalled();
  });
});

describe('POST /api/merchant-category — Zod validation', () => {
  it('accepts a valid body with merchantName only', async () => {
    const req = createMockRequest('/api/merchant-category', {
      method: 'POST',
      body: { merchantName: 'Coffee Shop' },
    });

    const res = await POST(req);

    expect(res.status).toBe(200);
  });

  it('accepts a valid body with all optional fields', async () => {
    const req = createMockRequest('/api/merchant-category', {
      method: 'POST',
      body: { merchantName: 'Coffee Shop', category: 'food', alwaysAsk: true },
    });

    const res = await POST(req);

    expect(res.status).toBe(200);
  });

  it('returns 400 when merchantName is missing', async () => {
    const req = createMockRequest('/api/merchant-category', {
      method: 'POST',
      body: { category: 'food' },
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('returns 400 when merchantName is empty string', async () => {
    const req = createMockRequest('/api/merchant-category', {
      method: 'POST',
      body: { merchantName: '' },
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('returns 400 when merchantName is whitespace only', async () => {
    const req = createMockRequest('/api/merchant-category', {
      method: 'POST',
      body: { merchantName: '   ' },
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('returns 400 when merchantName exceeds 255 characters', async () => {
    const req = createMockRequest('/api/merchant-category', {
      method: 'POST',
      body: { merchantName: 'a'.repeat(256) },
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('returns 400 when alwaysAsk is not a boolean', async () => {
    const req = createMockRequest('/api/merchant-category', {
      method: 'POST',
      body: { merchantName: 'Coffee Shop', alwaysAsk: 'yes' },
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('includes field error details in the 400 response body', async () => {
    const req = createMockRequest('/api/merchant-category', {
      method: 'POST',
      body: { merchantName: '' },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(body.error).toBe('Invalid request body');
    expect(body.details).toBeDefined();
    expect(body.details.merchantName).toBeDefined();
  });
});

describe('POST /api/merchant-category — business logic', () => {
  it('upserts the mapping with lowercased merchantName and userId', async () => {
    const req = createMockRequest('/api/merchant-category', {
      method: 'POST',
      body: { merchantName: 'Coffee Shop', category: 'food', alwaysAsk: false },
    });

    await POST(req);

    expect(mockUpsert).toHaveBeenCalledOnce();
    const { where, create } = mockUpsert.mock.calls[0][0];
    expect(where.userId_merchantName.userId).toBe(AUTHED_USER_ID);
    expect(where.userId_merchantName.merchantName).toBe('coffee shop');
    expect(create.userId).toBe(AUTHED_USER_ID);
    expect(create.category).toBe('food');
    expect(create.isManual).toBe(true);
  });

  it('returns success:true and the mapping on success', async () => {
    const req = createMockRequest('/api/merchant-category', {
      method: 'POST',
      body: { merchantName: 'Coffee Shop', category: 'food' },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.mapping).toBeDefined();
  });
});

// ===========================================================================
// DELETE /api/merchant-category
// ===========================================================================

describe('DELETE /api/merchant-category — authentication', () => {
  it('calls requireAuth()', async () => {
    const req = createMockRequest('/api/merchant-category', {
      method: 'DELETE',
      searchParams: { merchantName: 'Coffee Shop' },
    });

    await DELETE(req);

    expect(mockRequireAuth).toHaveBeenCalledOnce();
  });

  it('returns 401 when unauthenticated', async () => {
    denyAuth();
    const req = createMockRequest('/api/merchant-category', {
      method: 'DELETE',
      searchParams: { merchantName: 'Coffee Shop' },
    });

    const res = await DELETE(req);

    expect(res.status).toBe(401);
  });
});

describe('DELETE /api/merchant-category — rate limiting', () => {
  it('calls checkRateLimit with correct identifier', async () => {
    const req = createMockRequest('/api/merchant-category', {
      method: 'DELETE',
      searchParams: { merchantName: 'Coffee Shop' },
    });

    await DELETE(req);

    expect(mockCheckRateLimit).toHaveBeenCalledOnce();
    const [identifier] = mockCheckRateLimit.mock.calls[0];
    expect(identifier).toBe(`api:${AUTHED_USER_ID}`);
  });

  it('returns 429 when rate limit is exceeded', async () => {
    denyRateLimit();
    const req = createMockRequest('/api/merchant-category', {
      method: 'DELETE',
      searchParams: { merchantName: 'Coffee Shop' },
    });

    const res = await DELETE(req);

    expect(res.status).toBe(429);
  });
});

describe('DELETE /api/merchant-category — input validation', () => {
  it('returns 400 when merchantName query param is missing', async () => {
    const req = createMockRequest('/api/merchant-category', {
      method: 'DELETE',
    });

    const res = await DELETE(req);

    expect(res.status).toBe(400);
  });

  it('returns 400 when merchantName is empty string', async () => {
    const req = createMockRequest('/api/merchant-category', {
      method: 'DELETE',
      searchParams: { merchantName: '' },
    });

    const res = await DELETE(req);

    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/merchant-category — business logic', () => {
  it("deletes only the authenticated user's mapping", async () => {
    const req = createMockRequest('/api/merchant-category', {
      method: 'DELETE',
      searchParams: { merchantName: 'Coffee Shop' },
    });

    await DELETE(req);

    expect(mockDeleteMany).toHaveBeenCalledOnce();
    const { where } = mockDeleteMany.mock.calls[0][0];
    expect(where.userId).toBe(AUTHED_USER_ID);
    expect(where.merchantName).toBe('coffee shop');
  });

  it('returns success:true on successful deletion', async () => {
    const req = createMockRequest('/api/merchant-category', {
      method: 'DELETE',
      searchParams: { merchantName: 'Coffee Shop' },
    });

    const res = await DELETE(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });
});
