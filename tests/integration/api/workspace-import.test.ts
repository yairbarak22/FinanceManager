/**
 * Workspace Import Stage + Finalize Integration Tests
 *
 * Tests the new draft-based import flow:
 *   1. POST /api/workspace/import/stage — dedup + recurring matching → draft rows
 *   2. POST /api/workspace/import/finalize — promote drafts → Transaction or RecurringMonthlyCoverage
 *   3. POST /api/workspace/import/abandon — mark session abandoned
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ─────────────────────────────────────────────────────────
// Module mocks
// ─────────────────────────────────────────────────────────

const mockSession = {
  id: 'session-1',
  userId: 'test-user-1',
  monthKey: '2026-03',
  status: 'OPEN',
  createdAt: new Date(),
  updatedAt: new Date(),
  rows: [] as ReturnType<typeof makeRow>[],
};

function makeRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'row-1',
    sessionId: 'session-1',
    date: new Date('2026-03-15'),
    amount: 100,
    type: 'expense',
    description: 'שופרסל',
    suggestedCategory: 'food',
    matchKind: 'NEW',
    matchedTransactionId: null,
    matchedRecurringId: null,
    userResolution: 'IMPORT_AS_TX',
    finalCategory: null,
    ...overrides,
  };
}

vi.mock('@/lib/prisma', () => ({
  prisma: {
    workspaceImportSession: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    workspaceImportRow: {
      update: vi.fn(),
    },
    transaction: {
      findMany: vi.fn().mockResolvedValue([]),
      createMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    recurringTransaction: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    recurringMonthlyCoverage: {
      upsert: vi.fn(),
    },
    merchantCategoryMap: {
      upsert: vi.fn(),
    },
    globalMerchantVote: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn(),
    },
    globalMerchantStats: {
      upsert: vi.fn(),
    },
    user: {
      findUnique: vi.fn().mockResolvedValue({ id: 'test-user-1', signupSource: null }),
    },
    sharedAccountMember: {
      findFirst: vi.fn().mockResolvedValue({ sharedAccountId: 'shared-1', userId: 'test-user-1' }),
      findMany: vi.fn().mockResolvedValue([{ userId: 'test-user-1' }]),
    },
    $transaction: vi.fn().mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      if (typeof fn === 'function') {
        return fn(prisma);
      }
      return Promise.all(fn);
    }),
  },
}));

vi.mock('@/lib/cache', () => ({
  cacheGet: vi.fn().mockResolvedValue({ id: 'test-user-1' }),
  cacheSet: vi.fn(),
  cacheDelete: vi.fn(),
  CacheKeys: { authUser: (id: string) => `auth:${id}`, sharedMembers: (id: string) => `shared:${id}` },
  CacheTTL: { AUTH_USER: 3600, SHARED_MEMBERS: 300 },
}));

vi.mock('next-auth', () => ({
  getServerSession: vi.fn().mockResolvedValue({
    user: { id: 'test-user-1', email: 'test@example.com', name: 'Test' },
  }),
}));

vi.mock('@/lib/auth', () => ({ authOptions: {} }));

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
  AuditAction: { CREATE: 'CREATE' },
  getRequestInfo: vi.fn().mockReturnValue({ ipAddress: '127.0.0.1', userAgent: 'test' }),
}));

import { prisma } from '@/lib/prisma';

const mockPrisma = vi.mocked(prisma);

beforeEach(() => {
  vi.clearAllMocks();
});

// ============================================================================
// POST /api/workspace/import/stage
// ============================================================================

describe('POST /api/workspace/import/stage', () => {
  let POST: (req: NextRequest) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import('@/app/api/workspace/import/stage/route');
    POST = mod.POST;
  });

  it('creates a session with draft rows and returns counts', async () => {
    const row = makeRow();
    mockSession.rows = [row];

    mockPrisma.workspaceImportSession.create.mockResolvedValue({
      ...mockSession,
      rows: [row],
    } as never);

    const req = new NextRequest('http://localhost:3000/api/workspace/import/stage', {
      method: 'POST',
      body: JSON.stringify({
        monthKey: '2026-03',
        rows: [{
          date: '2026-03-15T00:00:00.000Z',
          amount: 100,
          type: 'expense',
          description: 'שופרסל',
          suggestedCategory: 'food',
        }],
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.sessionId).toBe('session-1');
    expect(data.counts.total).toBe(1);
    expect(data.rows).toHaveLength(1);
    expect(mockPrisma.workspaceImportSession.create).toHaveBeenCalledOnce();
  });

  it('marks rows as EXACT_DUPLICATE when matching existing transaction exists', async () => {
    mockPrisma.transaction.findMany.mockResolvedValue([{
      id: 'existing-tx-1',
      userId: 'test-user-1',
      date: new Date('2026-03-15'),
      amount: 100,
      type: 'expense',
      description: 'שופרסל',
      category: 'food',
      currency: 'ILS',
      source: 'web',
      needsDetailsReview: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }]);

    const dupRow = makeRow({ matchKind: 'EXACT_DUPLICATE', matchedTransactionId: 'existing-tx-1', userResolution: 'SKIP_DUPLICATE' });
    mockPrisma.workspaceImportSession.create.mockResolvedValue({
      ...mockSession,
      rows: [dupRow],
    } as never);

    const req = new NextRequest('http://localhost:3000/api/workspace/import/stage', {
      method: 'POST',
      body: JSON.stringify({
        monthKey: '2026-03',
        rows: [{
          date: '2026-03-15T00:00:00.000Z',
          amount: 100,
          type: 'expense',
          description: 'שופרסל',
          suggestedCategory: 'food',
        }],
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.rows[0].matchKind).toBe('EXACT_DUPLICATE');
  });

  it('rejects invalid monthKey format', async () => {
    const req = new NextRequest('http://localhost:3000/api/workspace/import/stage', {
      method: 'POST',
      body: JSON.stringify({
        monthKey: 'invalid',
        rows: [{ date: '2026-03-15', amount: 100, type: 'expense', description: 'test', suggestedCategory: null }],
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

// ============================================================================
// POST /api/workspace/import/finalize
// ============================================================================

describe('POST /api/workspace/import/finalize', () => {
  let POST: (req: NextRequest) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import('@/app/api/workspace/import/finalize/route');
    POST = mod.POST;
  });

  it('creates transactions for IMPORT_AS_TX resolutions and marks session finalized', async () => {
    const row = makeRow({ id: 'row-1', userResolution: 'PENDING' });
    mockPrisma.workspaceImportSession.findUnique.mockResolvedValue({
      ...mockSession,
      rows: [row],
    } as never);

    const req = new NextRequest('http://localhost:3000/api/workspace/import/finalize', {
      method: 'POST',
      body: JSON.stringify({
        sessionId: 'session-1',
        resolutions: [{ rowId: 'row-1', resolution: 'IMPORT_AS_TX', category: 'food' }],
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('creates RecurringMonthlyCoverage for LINK_RECURRING resolutions', async () => {
    const row = makeRow({
      id: 'row-2',
      matchKind: 'RECURRING_CANDIDATE',
      matchedRecurringId: 'rec-1',
      userResolution: 'PENDING',
    });
    mockPrisma.workspaceImportSession.findUnique.mockResolvedValue({
      ...mockSession,
      rows: [row],
    } as never);

    const req = new NextRequest('http://localhost:3000/api/workspace/import/finalize', {
      method: 'POST',
      body: JSON.stringify({
        sessionId: 'session-1',
        resolutions: [{ rowId: 'row-2', resolution: 'LINK_RECURRING' }],
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.linked).toBe(1);
  });

  it('rejects finalize for session not owned by user', async () => {
    mockPrisma.workspaceImportSession.findUnique.mockResolvedValue({
      ...mockSession,
      userId: 'other-user',
      rows: [],
    } as never);

    const req = new NextRequest('http://localhost:3000/api/workspace/import/finalize', {
      method: 'POST',
      body: JSON.stringify({
        sessionId: 'session-1',
        resolutions: [],
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it('rejects finalize for already finalized session', async () => {
    mockPrisma.workspaceImportSession.findUnique.mockResolvedValue({
      ...mockSession,
      status: 'FINALIZED',
      rows: [],
    } as never);

    const req = new NextRequest('http://localhost:3000/api/workspace/import/finalize', {
      method: 'POST',
      body: JSON.stringify({
        sessionId: 'session-1',
        resolutions: [],
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(409);
  });
});

// ============================================================================
// POST /api/workspace/import/abandon
// ============================================================================

describe('POST /api/workspace/import/abandon', () => {
  let POST: (req: NextRequest) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import('@/app/api/workspace/import/abandon/route');
    POST = mod.POST;
  });

  it('marks open session as abandoned', async () => {
    mockPrisma.workspaceImportSession.findUnique.mockResolvedValue({
      ...mockSession,
      status: 'OPEN',
    } as never);

    const req = new NextRequest('http://localhost:3000/api/workspace/import/abandon', {
      method: 'POST',
      body: JSON.stringify({ sessionId: 'session-1' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockPrisma.workspaceImportSession.update).toHaveBeenCalledWith({
      where: { id: 'session-1' },
      data: { status: 'ABANDONED' },
    });
  });

  it('succeeds silently for non-existent session', async () => {
    mockPrisma.workspaceImportSession.findUnique.mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/workspace/import/abandon', {
      method: 'POST',
      body: JSON.stringify({ sessionId: 'nonexistent' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});
