/**
 * Integration Tests — /api/categories (POST & GET)
 *
 * Covers:
 *   1. Authentication   — requireAuth() blocks unauthenticated requests
 *   2. POST validation  — name required, type must be valid enum
 *   3. Duplicate guard  — rejects duplicate name+type per user
 *   4. isMaaserEligible — only set for income/expense; forced false for asset/liability
 *   5. GET grouping     — categories returned grouped by type
 *   6. GET scope        — uses withSharedAccount to include all shared account members
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/categories/route';
import { createMockRequest } from '../../helpers/api';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/authHelpers', () => ({
  requireAuth: vi.fn(),
  withUserId: vi.fn((userId: string) => ({ userId })),
  withSharedAccount: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    customCategory: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import { requireAuth, withSharedAccount } from '@/lib/authHelpers';
import { prisma } from '@/lib/prisma';

const mockRequireAuth = vi.mocked(requireAuth);
const mockWithSharedAccount = vi.mocked(withSharedAccount);
const mockFindFirst = vi.mocked(prisma.customCategory.findFirst);
const mockFindMany = vi.mocked(prisma.customCategory.findMany);
const mockCreate = vi.mocked(prisma.customCategory.create);

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const USER_ID = 'user-abc';

const EXPENSE_CAT = {
  id: 'cat-1',
  userId: USER_ID,
  name: 'אינטרנט',
  type: 'expense',
  icon: null,
  color: null,
  isMaaserEligible: false,
  createdAt: new Date(),
};

const INCOME_CAT = { ...EXPENSE_CAT, id: 'cat-2', name: 'משכורת', type: 'income', isMaaserEligible: true };
const ASSET_CAT = { ...EXPENSE_CAT, id: 'cat-3', name: 'דירה', type: 'asset', isMaaserEligible: false };
const LIABILITY_CAT = { ...EXPENSE_CAT, id: 'cat-4', name: 'הלוואה', type: 'liability', isMaaserEligible: false };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function allowAuth() {
  mockRequireAuth.mockResolvedValue({ userId: USER_ID, error: null });
}

function denyAuth() {
  const { NextResponse } = require('next/server');
  mockRequireAuth.mockResolvedValue({
    userId: null,
    error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  allowAuth();
  mockWithSharedAccount.mockResolvedValue({ userId: { in: [USER_ID] } } as never);
  mockFindFirst.mockResolvedValue(null as never); // no duplicate by default
  mockCreate.mockResolvedValue(EXPENSE_CAT as never);
  mockFindMany.mockResolvedValue([EXPENSE_CAT, INCOME_CAT, ASSET_CAT, LIABILITY_CAT] as never);
});

// ===========================================================================
// POST /api/categories
// ===========================================================================

describe('POST /api/categories — authentication', () => {
  it('returns 401 when unauthenticated', async () => {
    denyAuth();
    const req = createMockRequest('/api/categories', {
      method: 'POST',
      body: { name: 'חשמל', type: 'expense' },
    });

    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it('calls requireAuth()', async () => {
    const req = createMockRequest('/api/categories', {
      method: 'POST',
      body: { name: 'חשמל', type: 'expense' },
    });

    await POST(req);

    expect(mockRequireAuth).toHaveBeenCalledOnce();
  });
});

describe('POST /api/categories — name validation', () => {
  it('returns 400 when name is missing', async () => {
    const req = createMockRequest('/api/categories', {
      method: 'POST',
      body: { type: 'expense' },
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('returns 400 when name is empty string', async () => {
    const req = createMockRequest('/api/categories', {
      method: 'POST',
      body: { name: '', type: 'expense' },
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('returns 400 when name is whitespace only', async () => {
    const req = createMockRequest('/api/categories', {
      method: 'POST',
      body: { name: '   ', type: 'expense' },
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('returns 400 when name is a number', async () => {
    const req = createMockRequest('/api/categories', {
      method: 'POST',
      body: { name: 123, type: 'expense' },
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
  });
});

describe('POST /api/categories — type validation', () => {
  it('returns 400 when type is missing', async () => {
    const req = createMockRequest('/api/categories', {
      method: 'POST',
      body: { name: 'חשמל' },
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('returns 400 when type is an invalid value', async () => {
    const req = createMockRequest('/api/categories', {
      method: 'POST',
      body: { name: 'חשמל', type: 'food' },
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('accepts expense type', async () => {
    const req = createMockRequest('/api/categories', {
      method: 'POST',
      body: { name: 'חשמל', type: 'expense' },
    });

    const res = await POST(req);

    expect(res.status).toBe(200);
  });

  it('accepts income type', async () => {
    mockCreate.mockResolvedValue(INCOME_CAT as never);
    const req = createMockRequest('/api/categories', {
      method: 'POST',
      body: { name: 'משכורת', type: 'income' },
    });

    const res = await POST(req);

    expect(res.status).toBe(200);
  });

  it('accepts asset type', async () => {
    mockCreate.mockResolvedValue(ASSET_CAT as never);
    const req = createMockRequest('/api/categories', {
      method: 'POST',
      body: { name: 'דירה', type: 'asset' },
    });

    const res = await POST(req);

    expect(res.status).toBe(200);
  });

  it('accepts liability type', async () => {
    mockCreate.mockResolvedValue(LIABILITY_CAT as never);
    const req = createMockRequest('/api/categories', {
      method: 'POST',
      body: { name: 'הלוואה', type: 'liability' },
    });

    const res = await POST(req);

    expect(res.status).toBe(200);
  });
});

describe('POST /api/categories — duplicate guard', () => {
  it('returns 400 when same name+type already exists for user', async () => {
    mockFindFirst.mockResolvedValue(EXPENSE_CAT as never);

    const req = createMockRequest('/api/categories', {
      method: 'POST',
      body: { name: 'אינטרנט', type: 'expense' },
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/קיימת/);
  });

  it('allows same name with different type (expense vs income)', async () => {
    // No duplicate for this type
    mockFindFirst.mockResolvedValue(null as never);
    mockCreate.mockResolvedValue({ ...INCOME_CAT, name: 'אינטרנט' } as never);

    const req = createMockRequest('/api/categories', {
      method: 'POST',
      body: { name: 'אינטרנט', type: 'income' },
    });

    const res = await POST(req);

    expect(res.status).toBe(200);
  });
});

describe('POST /api/categories — isMaaserEligible rules', () => {
  it('sets isMaaserEligible=true for expense category when passed true', async () => {
    mockCreate.mockResolvedValue({ ...EXPENSE_CAT, isMaaserEligible: true } as never);

    const req = createMockRequest('/api/categories', {
      method: 'POST',
      body: { name: 'תרומה', type: 'expense', isMaaserEligible: true },
    });

    await POST(req);

    expect(mockCreate).toHaveBeenCalledOnce();
    const [args] = mockCreate.mock.calls[0];
    expect(args.data.isMaaserEligible).toBe(true);
  });

  it('sets isMaaserEligible=true for income category when passed true', async () => {
    mockCreate.mockResolvedValue({ ...INCOME_CAT, isMaaserEligible: true } as never);

    const req = createMockRequest('/api/categories', {
      method: 'POST',
      body: { name: 'בונוס', type: 'income', isMaaserEligible: true },
    });

    await POST(req);

    const [args] = mockCreate.mock.calls[0];
    expect(args.data.isMaaserEligible).toBe(true);
  });

  it('forces isMaaserEligible=false for asset category even when passed true', async () => {
    mockCreate.mockResolvedValue(ASSET_CAT as never);

    const req = createMockRequest('/api/categories', {
      method: 'POST',
      body: { name: 'דירה', type: 'asset', isMaaserEligible: true },
    });

    await POST(req);

    const [args] = mockCreate.mock.calls[0];
    expect(args.data.isMaaserEligible).toBe(false);
  });

  it('forces isMaaserEligible=false for liability category even when passed true', async () => {
    mockCreate.mockResolvedValue(LIABILITY_CAT as never);

    const req = createMockRequest('/api/categories', {
      method: 'POST',
      body: { name: 'הלוואה', type: 'liability', isMaaserEligible: true },
    });

    await POST(req);

    const [args] = mockCreate.mock.calls[0];
    expect(args.data.isMaaserEligible).toBe(false);
  });

  it('defaults isMaaserEligible=false for expense when not provided', async () => {
    const req = createMockRequest('/api/categories', {
      method: 'POST',
      body: { name: 'חשמל', type: 'expense' },
    });

    await POST(req);

    const [args] = mockCreate.mock.calls[0];
    expect(args.data.isMaaserEligible).toBe(false);
  });
});

describe('POST /api/categories — response shape', () => {
  it('returns isCustom: true in response body', async () => {
    const req = createMockRequest('/api/categories', {
      method: 'POST',
      body: { name: 'חשמל', type: 'expense' },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(body.isCustom).toBe(true);
  });

  it('returns id, name, type, isMaaserEligible in response', async () => {
    mockCreate.mockResolvedValue({ ...EXPENSE_CAT, name: 'חשמל', isMaaserEligible: false } as never);

    const req = createMockRequest('/api/categories', {
      method: 'POST',
      body: { name: 'חשמל', type: 'expense' },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(body.id).toBeDefined();
    expect(body.name).toBe('חשמל');
    expect(body.type).toBe('expense');
    expect(body.isMaaserEligible).toBe(false);
  });

  it('stores userId on the created category', async () => {
    const req = createMockRequest('/api/categories', {
      method: 'POST',
      body: { name: 'חשמל', type: 'expense' },
    });

    await POST(req);

    const [args] = mockCreate.mock.calls[0];
    expect(args.data.userId).toBe(USER_ID);
  });
});

// ===========================================================================
// GET /api/categories
// ===========================================================================

describe('GET /api/categories — authentication', () => {
  it('returns 401 when unauthenticated', async () => {
    denyAuth();
    const req = createMockRequest('/api/categories', { method: 'GET' });

    const res = await GET(req);

    expect(res.status).toBe(401);
  });
});

describe('GET /api/categories — shared account scope', () => {
  it('calls withSharedAccount to include all shared members', async () => {
    const req = createMockRequest('/api/categories', { method: 'GET' });

    await GET(req);

    expect(mockWithSharedAccount).toHaveBeenCalledWith(USER_ID);
  });

  it('passes withSharedAccount result to findMany where clause', async () => {
    const sharedWhere = { userId: { in: [USER_ID, 'other-user'] } };
    mockWithSharedAccount.mockResolvedValue(sharedWhere as never);

    const req = createMockRequest('/api/categories', { method: 'GET' });

    await GET(req);

    expect(mockFindMany).toHaveBeenCalledOnce();
    const [args] = mockFindMany.mock.calls[0];
    expect(args.where).toEqual(sharedWhere);
  });
});

describe('GET /api/categories — response grouping', () => {
  it('returns categories grouped into expense, income, asset, liability arrays', async () => {
    const req = createMockRequest('/api/categories', { method: 'GET' });

    const res = await GET(req);
    const body = await res.json();

    expect(Array.isArray(body.expense)).toBe(true);
    expect(Array.isArray(body.income)).toBe(true);
    expect(Array.isArray(body.asset)).toBe(true);
    expect(Array.isArray(body.liability)).toBe(true);
  });

  it('correctly routes expense category to expense array', async () => {
    mockFindMany.mockResolvedValue([EXPENSE_CAT] as never);

    const req = createMockRequest('/api/categories', { method: 'GET' });
    const res = await GET(req);
    const body = await res.json();

    expect(body.expense).toHaveLength(1);
    expect(body.expense[0].name).toBe('אינטרנט');
    expect(body.income).toHaveLength(0);
    expect(body.asset).toHaveLength(0);
    expect(body.liability).toHaveLength(0);
  });

  it('correctly routes all four types when all are present', async () => {
    const req = createMockRequest('/api/categories', { method: 'GET' });
    const res = await GET(req);
    const body = await res.json();

    expect(body.expense).toHaveLength(1);
    expect(body.income).toHaveLength(1);
    expect(body.asset).toHaveLength(1);
    expect(body.liability).toHaveLength(1);
  });

  it('every returned category has isCustom: true', async () => {
    const req = createMockRequest('/api/categories', { method: 'GET' });
    const res = await GET(req);
    const body = await res.json();

    const all = [...body.expense, ...body.income, ...body.asset, ...body.liability];
    expect(all.every((c: { isCustom: boolean }) => c.isCustom === true)).toBe(true);
  });

  it('returns empty arrays when user has no custom categories', async () => {
    mockFindMany.mockResolvedValue([] as never);

    const req = createMockRequest('/api/categories', { method: 'GET' });
    const res = await GET(req);
    const body = await res.json();

    expect(body.expense).toHaveLength(0);
    expect(body.income).toHaveLength(0);
    expect(body.asset).toHaveLength(0);
    expect(body.liability).toHaveLength(0);
  });
});
