/**
 * Selective Data Deletion API Integration Tests
 *
 * Tests for the granular deletion flow: preview, validation, and execution.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockDeleteMany, mockCount, mockFindMany, mockTransaction } = vi.hoisted(() => {
  const mockDeleteMany = vi.fn().mockResolvedValue({ count: 5 });
  const mockCount = vi.fn().mockResolvedValue(3);
  const mockFindMany = vi.fn().mockResolvedValue([]);
  const mockTransaction = vi.fn().mockImplementation(async (fn: (tx: unknown) => Promise<void>) => {
    const tx = new Proxy(
      {},
      {
        get: () => ({
          deleteMany: mockDeleteMany,
          findMany: mockFindMany,
          count: mockCount,
        }),
      }
    );
    return fn(tx);
  });
  return { mockDeleteMany, mockCount, mockFindMany, mockTransaction };
});

vi.mock('@/lib/prisma', () => ({
  prisma: {
    transaction: { count: mockCount, deleteMany: mockDeleteMany },
    recurringTransaction: { count: mockCount, deleteMany: mockDeleteMany },
    financialGoal: { count: mockCount, deleteMany: mockDeleteMany },
    asset: { count: mockCount, deleteMany: mockDeleteMany },
    assetValueHistory: { deleteMany: mockDeleteMany },
    liability: { count: mockCount, deleteMany: mockDeleteMany },
    holding: { count: mockCount, deleteMany: mockDeleteMany },
    document: { count: mockCount, deleteMany: mockDeleteMany, findMany: mockFindMany },
    customCategory: { count: mockCount, deleteMany: mockDeleteMany },
    merchantCategoryMap: { count: mockCount, deleteMany: mockDeleteMany },
    maaserPreference: { count: mockCount, deleteMany: mockDeleteMany },
    maaserExpenseOffset: { count: mockCount, deleteMany: mockDeleteMany },
    budget: { count: mockCount, deleteMany: mockDeleteMany },
    passoverSection: { count: mockCount, deleteMany: mockDeleteMany },
    monthlyReport: { count: mockCount, deleteMany: mockDeleteMany },
    netWorthHistory: { count: mockCount, deleteMany: mockDeleteMany },
    ivrCallSession: { count: mockCount, deleteMany: mockDeleteMany },
    ivrPin: { count: mockCount, deleteMany: mockDeleteMany },
    reportingPhone: { count: mockCount, deleteMany: mockDeleteMany },
    whatsappMonthlyUsage: { count: mockCount, deleteMany: mockDeleteMany },
    userProfile: { count: mockCount, deleteMany: mockDeleteMany },
    user: { findUnique: vi.fn().mockResolvedValue({ id: 'test-user-1' }) },
    sharedAccountMember: {
      findFirst: vi.fn().mockResolvedValue({ sharedAccountId: 'shared-1', userId: 'test-user-1' }),
      findMany: vi.fn().mockResolvedValue([{ userId: 'test-user-1' }]),
    },
    $transaction: mockTransaction,
  },
}));

vi.mock('@vercel/blob', () => ({
  del: vi.fn().mockResolvedValue(undefined),
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
  RATE_LIMITS: { api: { maxRequests: 100, windowSeconds: 60 }, auth: { maxRequests: 5, windowSeconds: 60 } },
}));

vi.mock('@/lib/config', () => ({
  config: {
    encryptionKey: 'a'.repeat(64),
    nodeEnv: 'test',
  },
}));

vi.mock('@/lib/auditLog', () => ({
  logAuditEvent: vi.fn(),
  AuditAction: { BULK_DELETE: 'BULK_DELETE' },
  getRequestInfo: vi.fn().mockReturnValue({ ipAddress: '127.0.0.1', userAgent: 'test' }),
}));

import { dataDeletionSchema, DATA_DOMAINS } from '@/lib/userDataDeletion';

// ---------------------------------------------------------------------------
// Zod Schema Tests
// ---------------------------------------------------------------------------

describe('dataDeletionSchema', () => {
  it('accepts valid domain selections', () => {
    const result = dataDeletionSchema.safeParse({
      domains: ['transactions', 'holdings'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty domains array', () => {
    const result = dataDeletionSchema.safeParse({ domains: [] });
    expect(result.success).toBe(false);
  });

  it('rejects unknown domain keys', () => {
    const result = dataDeletionSchema.safeParse({
      domains: ['transactions', 'unknownTable'],
    });
    expect(result.success).toBe(false);
  });

  it('accepts all valid domain keys', () => {
    const result = dataDeletionSchema.safeParse({
      domains: [...DATA_DOMAINS],
    });
    expect(result.success).toBe(true);
  });

  it('rejects when domains field is missing', () => {
    const result = dataDeletionSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects non-array domains', () => {
    const result = dataDeletionSchema.safeParse({ domains: 'transactions' });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Preview API Tests
// ---------------------------------------------------------------------------

describe('GET /api/user/data-deletion-preview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns counts for all domains', async () => {
    const { GET } = await import('@/app/api/user/data-deletion-preview/route');
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.counts).toBeDefined();
    expect(data.domains).toEqual(expect.arrayContaining(['transactions', 'holdings']));
    expect(data.domains).not.toContain('merchantMappings');
    expect(data.domains).not.toContain('netWorthHistory');
    expect(data.domains).not.toContain('ivrAndWhatsapp');
    expect(data.meta).toBeDefined();
    expect(data.meta.transactions.label).toBe('עסקאות');
    expect(data.dependencies).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Delete API Tests
// ---------------------------------------------------------------------------

describe('POST /api/user/delete-selected-data', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes selected domains and returns counts', async () => {
    const { POST } = await import('@/app/api/user/delete-selected-data/route');

    const request = new Request('http://localhost/api/user/delete-selected-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ domains: ['transactions', 'holdings'] }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.deleted).toBeDefined();
  });

  it('rejects invalid domain keys', async () => {
    const { POST } = await import('@/app/api/user/delete-selected-data/route');

    const request = new Request('http://localhost/api/user/delete-selected-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domains: ['transactions', 'fakeTable'] }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('rejects removed domains (merchantMappings)', async () => {
    const { POST } = await import('@/app/api/user/delete-selected-data/route');

    const request = new Request('http://localhost/api/user/delete-selected-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domains: ['transactions', 'merchantMappings'] }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('rejects empty domains', async () => {
    const { POST } = await import('@/app/api/user/delete-selected-data/route');

    const request = new Request('http://localhost/api/user/delete-selected-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domains: [] }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('enforces dependency rules (customCategories requires transactions)', async () => {
    const { POST } = await import('@/app/api/user/delete-selected-data/route');

    const request = new Request('http://localhost/api/user/delete-selected-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domains: ['customCategories'] }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.missingDependencies).toBeDefined();
    expect(data.missingDependencies).toContain('transactions');
  });

  it('accepts customCategories when dependencies are included', async () => {
    const { POST } = await import('@/app/api/user/delete-selected-data/route');

    const request = new Request('http://localhost/api/user/delete-selected-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        domains: ['customCategories', 'transactions', 'recurringAndGoals', 'budgets'],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
