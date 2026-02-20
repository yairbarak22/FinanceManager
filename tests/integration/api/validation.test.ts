/**
 * API Routes — Zod Validation Integration Tests
 *
 * Tests that all routes using validateRequest properly reject invalid input
 * and accept valid input. Routes tested:
 *   - POST /api/transactions
 *   - PUT  /api/transactions/[id]
 *   - POST /api/recurring
 *   - POST /api/liabilities
 *   - POST /api/goals
 *
 * Mocks: auth, prisma, rateLimit — we only test the validation layer.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Mocks (must be before any imports that use these modules)
// ---------------------------------------------------------------------------

vi.mock('@/lib/prisma', () => ({
  prisma: {
    transaction: {
      create: vi.fn().mockResolvedValue({ id: 'tx-1', userId: 'user-1' }),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      findFirst: vi.fn().mockResolvedValue({ id: 'tx-1', userId: 'user-1', type: 'expense', amount: 100, category: 'Food', description: 'Lunch', date: new Date() }),
    },
    recurringTransaction: {
      create: vi.fn().mockResolvedValue({ id: 'rec-1', userId: 'user-1', type: 'expense', amount: 500, category: 'Housing', name: 'Rent', isActive: true }),
    },
    liability: {
      create: vi.fn().mockResolvedValue({ id: 'liab-1', userId: 'user-1' }),
    },
    financialGoal: {
      create: vi.fn().mockResolvedValue({ id: 'goal-1', userId: 'user-1' }),
      findFirst: vi.fn().mockResolvedValue(null),
    },
    customCategory: {
      upsert: vi.fn().mockResolvedValue({ id: 'cat-1' }),
    },
    $transaction: vi.fn().mockImplementation((fn: (tx: unknown) => Promise<unknown>) => {
      const txClient = {
        recurringTransaction: {
          create: vi.fn().mockResolvedValue({ id: 'rec-1', userId: 'user-1', type: 'expense', amount: 1000, category: 'Goal', name: 'Savings', isActive: true }),
        },
        customCategory: {
          upsert: vi.fn().mockResolvedValue({ id: 'cat-1' }),
        },
        financialGoal: {
          create: vi.fn().mockResolvedValue({ id: 'goal-1', userId: 'user-1', name: 'Emergency Fund', targetAmount: 50000, currentAmount: 0, deadline: new Date('2025-12-31'), recurringTransaction: { id: 'rec-1' } }),
        },
      };
      return fn(txClient);
    }),
  },
}));

vi.mock('@/lib/authHelpers', () => ({
  requireAuth: vi.fn().mockResolvedValue({ userId: 'user-1', error: null }),
  withSharedAccount: vi.fn().mockResolvedValue({ userId: { in: ['user-1'] } }),
  withSharedAccountId: vi.fn().mockResolvedValue({ id: 'tx-1', userId: { in: ['user-1'] } }),
  checkPermission: vi.fn().mockResolvedValue({ allowed: true }),
  getOrCreateSharedAccount: vi.fn().mockResolvedValue('shared-1'),
  getSharedUserIds: vi.fn().mockResolvedValue(['user-1']),
  withUserId: vi.fn((userId: string) => ({ userId })),
  withIdAndUserId: vi.fn((id: string, userId: string) => ({ id, userId })),
}));

vi.mock('@/lib/rateLimit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ success: true, limit: 100, remaining: 99, resetTime: Date.now() + 60000 }),
  RATE_LIMITS: { api: { maxRequests: 100, windowSeconds: 60 } },
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
}));

vi.mock('@/lib/config', () => ({
  config: {
    encryptionKey: 'a'.repeat(64),
    nodeEnv: 'test',
  },
}));

vi.mock('@/lib/auditLog', () => ({
  logAuditEvent: vi.fn(),
  AuditAction: { CREATE: 'CREATE', UPDATE: 'UPDATE', DELETE: 'DELETE' },
  getRequestInfo: vi.fn().mockReturnValue({ ipAddress: '127.0.0.1', userAgent: 'test' }),
}));

vi.mock('@/lib/cache', () => ({
  cacheGet: vi.fn().mockResolvedValue(null),
  cacheSet: vi.fn(),
  cacheDelete: vi.fn(),
  CacheKeys: { authUser: (id: string) => `auth:${id}`, sharedMembers: (id: string) => `shared:${id}` },
  CacheTTL: { AUTH_USER: 3600, SHARED_MEMBERS: 300 },
}));

vi.mock('next-auth', () => ({
  getServerSession: vi.fn().mockResolvedValue({
    user: { id: 'user-1', email: 'test@example.com', name: 'Test' },
  }),
}));

vi.mock('@/lib/auth', () => ({ authOptions: {} }));

vi.mock('@/lib/netWorthHistory', () => ({
  saveCurrentMonthNetWorth: vi.fn(),
}));

vi.mock('@/lib/goalCalculations', () => ({
  calculateMonthlyContribution: vi.fn().mockReturnValue(1000),
  calculateMonthlyContributionWithInterest: vi.fn().mockReturnValue(900),
  recalculateDeadline: vi.fn().mockReturnValue(new Date('2026-12-31')),
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { POST as transactionsPOST } from '@/app/api/transactions/route';
import { PUT as transactionsPUT } from '@/app/api/transactions/[id]/route';
import { POST as recurringPOST } from '@/app/api/recurring/route';
import { POST as liabilitiesPOST } from '@/app/api/liabilities/route';
import { POST as goalsPOST } from '@/app/api/goals/route';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function jsonRequest(url: string, body: unknown): NextRequest {
  return new NextRequest(`http://localhost:3000${url}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Protection': '1',
    },
    body: JSON.stringify(body),
  });
}

function putRequest(url: string, body: unknown): NextRequest {
  return new NextRequest(`http://localhost:3000${url}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Protection': '1',
    },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ============================================================================
// POST /api/transactions
// ============================================================================

describe('POST /api/transactions — Zod validation', () => {
  const validBody = {
    type: 'expense',
    amount: 100,
    category: 'Food',
    description: 'Lunch at restaurant',
    date: '2024-06-15T12:00:00Z',
  };

  it('accepts valid transaction', async () => {
    const res = await transactionsPOST(jsonRequest('/api/transactions', validBody));
    expect(res.status).toBe(200);
  });

  it('rejects missing type', async () => {
    const { type, ...body } = validBody;
    const res = await transactionsPOST(jsonRequest('/api/transactions', body));
    expect(res.status).toBe(400);
  });

  it('rejects invalid type', async () => {
    const res = await transactionsPOST(jsonRequest('/api/transactions', { ...validBody, type: 'transfer' }));
    expect(res.status).toBe(400);
  });

  it('rejects negative amount', async () => {
    const res = await transactionsPOST(jsonRequest('/api/transactions', { ...validBody, amount: -50 }));
    expect(res.status).toBe(400);
  });

  it('rejects zero amount', async () => {
    const res = await transactionsPOST(jsonRequest('/api/transactions', { ...validBody, amount: 0 }));
    expect(res.status).toBe(400);
  });

  it('rejects empty category', async () => {
    const res = await transactionsPOST(jsonRequest('/api/transactions', { ...validBody, category: '' }));
    expect(res.status).toBe(400);
  });

  it('rejects empty description', async () => {
    const res = await transactionsPOST(jsonRequest('/api/transactions', { ...validBody, description: '' }));
    expect(res.status).toBe(400);
  });

  it('rejects invalid date', async () => {
    const res = await transactionsPOST(jsonRequest('/api/transactions', { ...validBody, date: 'not-a-date' }));
    expect(res.status).toBe(400);
  });

  it('rejects missing date', async () => {
    const { date, ...body } = validBody;
    const res = await transactionsPOST(jsonRequest('/api/transactions', body));
    expect(res.status).toBe(400);
  });

  it('returns error message in response body', async () => {
    const res = await transactionsPOST(jsonRequest('/api/transactions', { ...validBody, amount: -1 }));
    const json = await res.json();
    expect(json.error).toBeTruthy();
    expect(typeof json.error).toBe('string');
  });

  it('rejects non-JSON body', async () => {
    const req = new NextRequest('http://localhost:3000/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json at all',
    });
    const res = await transactionsPOST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Invalid JSON body');
  });
});

// ============================================================================
// PUT /api/transactions/[id]
// ============================================================================

describe('PUT /api/transactions/[id] — Zod validation', () => {
  const params = Promise.resolve({ id: 'tx-1' });

  it('accepts valid partial update (amount only)', async () => {
    const res = await transactionsPUT(putRequest('/api/transactions/tx-1', { amount: 200 }), { params });
    expect(res.status).toBe(200);
  });

  it('accepts valid partial update (category only)', async () => {
    const res = await transactionsPUT(putRequest('/api/transactions/tx-1', { category: 'Transport' }), { params });
    expect(res.status).toBe(200);
  });

  it('accepts empty object (all fields optional)', async () => {
    const res = await transactionsPUT(putRequest('/api/transactions/tx-1', {}), { params });
    expect(res.status).toBe(200);
  });

  it('rejects invalid type', async () => {
    const res = await transactionsPUT(putRequest('/api/transactions/tx-1', { type: 'invalid' }), { params });
    expect(res.status).toBe(400);
  });

  it('rejects negative amount', async () => {
    const res = await transactionsPUT(putRequest('/api/transactions/tx-1', { amount: -100 }), { params });
    expect(res.status).toBe(400);
  });

  it('rejects invalid date', async () => {
    const res = await transactionsPUT(putRequest('/api/transactions/tx-1', { date: 'garbage' }), { params });
    expect(res.status).toBe(400);
  });
});

// ============================================================================
// POST /api/recurring
// ============================================================================

describe('POST /api/recurring — Zod validation', () => {
  const validBody = {
    type: 'expense',
    amount: 500,
    category: 'Housing',
    name: 'Monthly Rent',
  };

  it('accepts valid recurring transaction', async () => {
    const res = await recurringPOST(jsonRequest('/api/recurring', validBody));
    expect(res.status).toBe(200);
  });

  it('rejects empty name', async () => {
    const res = await recurringPOST(jsonRequest('/api/recurring', { ...validBody, name: '' }));
    expect(res.status).toBe(400);
  });

  it('rejects negative amount', async () => {
    const res = await recurringPOST(jsonRequest('/api/recurring', { ...validBody, amount: -500 }));
    expect(res.status).toBe(400);
  });

  it('rejects invalid type', async () => {
    const res = await recurringPOST(jsonRequest('/api/recurring', { ...validBody, type: 'transfer' }));
    expect(res.status).toBe(400);
  });

  it('rejects missing required fields', async () => {
    const res = await recurringPOST(jsonRequest('/api/recurring', { type: 'expense' }));
    expect(res.status).toBe(400);
  });

  it('accepts with optional activeMonths', async () => {
    const res = await recurringPOST(jsonRequest('/api/recurring', { ...validBody, activeMonths: [1, 2, 3] }));
    expect(res.status).toBe(200);
  });

  it('rejects invalid activeMonths (month 13)', async () => {
    const res = await recurringPOST(jsonRequest('/api/recurring', { ...validBody, activeMonths: [1, 13] }));
    expect(res.status).toBe(400);
  });
});

// ============================================================================
// POST /api/liabilities
// ============================================================================

describe('POST /api/liabilities — Zod validation', () => {
  const validBody = {
    name: 'Mortgage',
    type: 'mortgage',
    totalAmount: 1000000,
    monthlyPayment: 5000,
  };

  it('accepts valid liability', async () => {
    const res = await liabilitiesPOST(jsonRequest('/api/liabilities', validBody));
    expect(res.status).toBe(200);
  });

  it('rejects empty name', async () => {
    const res = await liabilitiesPOST(jsonRequest('/api/liabilities', { ...validBody, name: '' }));
    expect(res.status).toBe(400);
  });

  it('rejects negative totalAmount', async () => {
    const res = await liabilitiesPOST(jsonRequest('/api/liabilities', { ...validBody, totalAmount: -100 }));
    expect(res.status).toBe(400);
  });

  it('rejects negative monthlyPayment', async () => {
    const res = await liabilitiesPOST(jsonRequest('/api/liabilities', { ...validBody, monthlyPayment: -100 }));
    expect(res.status).toBe(400);
  });

  it('accepts zero monthlyPayment', async () => {
    const res = await liabilitiesPOST(jsonRequest('/api/liabilities', { ...validBody, monthlyPayment: 0 }));
    expect(res.status).toBe(200);
  });

  it('rejects interestRate above 100', async () => {
    const res = await liabilitiesPOST(jsonRequest('/api/liabilities', { ...validBody, interestRate: 150 }));
    expect(res.status).toBe(400);
  });

  it('rejects invalid loanMethod', async () => {
    const res = await liabilitiesPOST(jsonRequest('/api/liabilities', { ...validBody, loanMethod: 'bullet' }));
    expect(res.status).toBe(400);
  });

  it('rejects missing required fields', async () => {
    const res = await liabilitiesPOST(jsonRequest('/api/liabilities', { name: 'test' }));
    expect(res.status).toBe(400);
  });
});

// ============================================================================
// POST /api/goals
// ============================================================================

describe('POST /api/goals — Zod validation', () => {
  const validBody = {
    name: 'Emergency Fund',
    targetAmount: 50000,
    deadline: '2025-12-31',
  };

  it('accepts valid goal', async () => {
    const res = await goalsPOST(jsonRequest('/api/goals', validBody));
    expect(res.status).toBe(200);
  });

  it('rejects empty name', async () => {
    const res = await goalsPOST(jsonRequest('/api/goals', { ...validBody, name: '' }));
    expect(res.status).toBe(400);
  });

  it('rejects negative targetAmount', async () => {
    const res = await goalsPOST(jsonRequest('/api/goals', { ...validBody, targetAmount: -1000 }));
    expect(res.status).toBe(400);
  });

  it('rejects targetAmount above 100M', async () => {
    const res = await goalsPOST(jsonRequest('/api/goals', { ...validBody, targetAmount: 200_000_000 }));
    expect(res.status).toBe(400);
  });

  it('rejects invalid deadline', async () => {
    const res = await goalsPOST(jsonRequest('/api/goals', { ...validBody, deadline: 'not-a-date' }));
    expect(res.status).toBe(400);
  });

  it('rejects missing deadline', async () => {
    const { deadline, ...body } = validBody;
    const res = await goalsPOST(jsonRequest('/api/goals', body));
    expect(res.status).toBe(400);
  });

  it('rejects missing required fields', async () => {
    const res = await goalsPOST(jsonRequest('/api/goals', { name: 'test' }));
    expect(res.status).toBe(400);
  });
});

