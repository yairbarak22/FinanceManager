/**
 * Holdings API Integration Tests
 *
 * Verifies that portfolio cache invalidation is called on mutations.
 * Guards against accidentally removing the invalidation logic.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks ──

vi.mock('@/lib/prisma', () => ({
  prisma: {
    holding: {
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
      findFirst: vi.fn(),
    },
    user: { findUnique: vi.fn().mockResolvedValue({ id: 'user-1' }) },
    sharedAccountMember: {
      findFirst: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([{ userId: 'user-1' }]),
    },
  },
}));

vi.mock('@/lib/cache', () => ({
  cacheGet: vi.fn().mockResolvedValue({ id: 'user-1' }),
  cacheSet: vi.fn(),
  cacheDelete: vi.fn().mockResolvedValue(true),
  CacheKeys: {
    authUser: (id: string) => `auth:user:${id}`,
    sharedMembers: (id: string) => `shared:members:${id}`,
  },
  CacheTTL: { AUTH_USER: 3600, SHARED_MEMBERS: 300 },
}));

vi.mock('next-auth', () => ({
  getServerSession: vi.fn().mockResolvedValue({
    user: { id: 'user-1', email: 'test@example.com', name: 'Test' },
  }),
}));

vi.mock('@/lib/auth', () => ({ authOptions: {} }));

vi.mock('@/lib/config', () => ({
  config: { encryptionKey: 'a'.repeat(64), nodeEnv: 'test' },
}));

vi.mock('@/lib/auditLog', () => ({
  logAuditEvent: vi.fn(),
  AuditAction: { CREATE: 'CREATE', UPDATE: 'UPDATE', DELETE: 'DELETE' },
  getRequestInfo: vi.fn().mockReturnValue({ ipAddress: '127.0.0.1', userAgent: 'test' }),
}));

vi.mock('@/lib/finance/portfolioCache', () => ({
  invalidatePortfolioCache: vi.fn().mockResolvedValue(undefined),
  PORTFOLIO_SYNC_ASSET_NAME: 'תיק מסחר עצמאי',
  PORTFOLIO_ASSET_CATEGORY: 'stocks',
}));

vi.mock('@/lib/portfolioAssetSync', () => ({
  syncPortfolioAsset: vi.fn().mockResolvedValue({ id: 'asset-1', value: 50000 }),
  isPortfolioSyncAsset: vi.fn().mockReturnValue(false),
  PORTFOLIO_SYNC_ASSET_NAME: 'תיק מסחר עצמאי',
}));

import { prisma } from '@/lib/prisma';
import { invalidatePortfolioCache } from '@/lib/finance/portfolioCache';
import { syncPortfolioAsset } from '@/lib/portfolioAssetSync';

const mockPrisma = vi.mocked(prisma);
const mockInvalidate = vi.mocked(invalidatePortfolioCache);
const mockSync = vi.mocked(syncPortfolioAsset);

beforeEach(() => {
  vi.clearAllMocks();
});

// ============================================================================
// POST /api/holdings
// ============================================================================

describe('POST /api/holdings', () => {
  it('calls invalidatePortfolioCache then syncPortfolioAsset on create', async () => {
    mockPrisma.holding.create.mockResolvedValue({
      id: 'h-new', userId: 'user-1', name: 'VOO', currentValue: 100, targetAllocation: 50,
    } as never);

    const { POST } = await import('@/app/api/holdings/route');

    const request = new Request('http://localhost/api/holdings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-csrf-token': '1' },
      body: JSON.stringify({ name: 'VOO', currentValue: 100, targetAllocation: 50, symbol: 'VOO' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(201);

    expect(mockInvalidate).toHaveBeenCalledWith('user-1');
    expect(mockSync).toHaveBeenCalledWith('user-1', true);

    // Invalidate must be called BEFORE sync
    const invOrder = mockInvalidate.mock.invocationCallOrder[0];
    const syncOrder = mockSync.mock.invocationCallOrder[0];
    expect(invOrder).toBeLessThan(syncOrder);
  });
});

// ============================================================================
// PUT /api/holdings/[id]
// ============================================================================

describe('PUT /api/holdings/[id]', () => {
  it('calls invalidatePortfolioCache then syncPortfolioAsset on update', async () => {
    mockPrisma.holding.updateMany.mockResolvedValue({ count: 1 } as never);
    mockPrisma.holding.findFirst.mockResolvedValue({
      id: 'h-1', userId: 'user-1', name: 'VOO', currentValue: 200,
    } as never);

    const routeModule = await import('@/app/api/holdings/[id]/route');

    const request = new Request('http://localhost/api/holdings/h-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-csrf-token': '1' },
      body: JSON.stringify({ currentValue: 200 }),
    });

    const response = await routeModule.PUT(request, { params: Promise.resolve({ id: 'h-1' }) });
    expect(response.status).toBe(200);

    expect(mockInvalidate).toHaveBeenCalledWith('user-1');
    expect(mockSync).toHaveBeenCalledWith('user-1', true);
  });
});

// ============================================================================
// DELETE /api/holdings/[id]
// ============================================================================

describe('DELETE /api/holdings/[id]', () => {
  it('calls invalidatePortfolioCache then syncPortfolioAsset on delete', async () => {
    mockPrisma.holding.deleteMany.mockResolvedValue({ count: 1 } as never);

    const routeModule = await import('@/app/api/holdings/[id]/route');

    const request = new Request('http://localhost/api/holdings/h-1', {
      method: 'DELETE',
      headers: { 'x-csrf-token': '1' },
    });

    const response = await routeModule.DELETE(request, { params: Promise.resolve({ id: 'h-1' }) });
    expect(response.status).toBe(200);

    expect(mockInvalidate).toHaveBeenCalledWith('user-1');
    expect(mockSync).toHaveBeenCalledWith('user-1', true);

    const invOrder = mockInvalidate.mock.invocationCallOrder[0];
    const syncOrder = mockSync.mock.invocationCallOrder[0];
    expect(invOrder).toBeLessThan(syncOrder);
  });
});
