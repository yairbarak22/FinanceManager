import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks ──

vi.mock('../prisma', () => ({
  prisma: {
    holding: { count: vi.fn(), findMany: vi.fn() },
    asset: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    userProfile: { findUnique: vi.fn() },
  },
}));

vi.mock('@/lib/cache', () => ({
  cacheGet: vi.fn().mockResolvedValue(null),
  cacheSet: vi.fn().mockResolvedValue(true),
  cacheDelete: vi.fn().mockResolvedValue(true),
}));

vi.mock('../authHelpers', () => ({
  withSharedAccount: vi.fn().mockResolvedValue({ userId: 'user-1' }),
}));

vi.mock('../assetHistory', () => ({
  saveAssetHistory: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../netWorthHistory', () => ({
  saveCurrentMonthNetWorth: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/finance/providers/eod', () => ({
  eodProvider: {
    getQuote: vi.fn().mockResolvedValue({ price: 150, currency: 'USD', priceILS: 555 }),
    getUsdIlsRate: vi.fn().mockResolvedValue(3.7),
  },
  normalizeSymbol: vi.fn((s: string) => `${s}.US`),
  detectAssetType: vi.fn(() => ({ provider: 'EOD', isIsraeli: false, isCrypto: false, isUS: true })),
}));

vi.mock('@/lib/finance/marketService', () => ({
  detectAssetType: vi.fn(() => ({ provider: 'EOD', isIsraeli: false, isCrypto: false, isUS: true })),
}));

vi.mock('@/lib/finance/portfolioCache', async () => {
  const actual = await vi.importActual<typeof import('@/lib/finance/portfolioCache')>('@/lib/finance/portfolioCache');
  return {
    ...actual,
    getCachedPortfolioValue: vi.fn().mockResolvedValue(null),
    setCachedPortfolioValue: vi.fn().mockResolvedValue(undefined),
    invalidatePortfolioCache: vi.fn().mockResolvedValue(undefined),
  };
});

import { prisma } from '../prisma';
import { saveAssetHistory } from '../assetHistory';
import { saveCurrentMonthNetWorth } from '../netWorthHistory';
import { eodProvider } from '@/lib/finance/providers/eod';
import {
  getCachedPortfolioValue,
  setCachedPortfolioValue,
  invalidatePortfolioCache,
} from '@/lib/finance/portfolioCache';
import { syncPortfolioAsset } from '../portfolioAssetSync';

const mockPrisma = vi.mocked(prisma);
const mockGetCache = vi.mocked(getCachedPortfolioValue);
const mockSetCache = vi.mocked(setCachedPortfolioValue);
const mockInvalidate = vi.mocked(invalidatePortfolioCache);
const mockGetQuote = vi.mocked(eodProvider.getQuote);

beforeEach(() => {
  vi.clearAllMocks();
});

// ============================================================================
// syncPortfolioAsset
// ============================================================================

describe('syncPortfolioAsset', () => {
  // ── No holdings ──

  it('deletes existing asset and returns null when no holdings', async () => {
    mockPrisma.holding.count.mockResolvedValue(0 as never);
    mockPrisma.asset.findFirst.mockResolvedValue({
      id: 'asset-1', name: 'תיק מסחר עצמאי', value: 50000, updatedAt: new Date(),
    } as never);

    const result = await syncPortfolioAsset('user-1');

    expect(result).toBeNull();
    expect(mockPrisma.asset.delete).toHaveBeenCalledWith({ where: { id: 'asset-1' } });
    expect(saveCurrentMonthNetWorth).toHaveBeenCalledWith('user-1');
  });

  it('returns null when no holdings and no existing asset', async () => {
    mockPrisma.holding.count.mockResolvedValue(0 as never);
    mockPrisma.asset.findFirst.mockResolvedValue(null as never);

    const result = await syncPortfolioAsset('user-1');

    expect(result).toBeNull();
    expect(mockPrisma.asset.delete).not.toHaveBeenCalled();
  });

  // ── Cache hit ──

  it('uses cache value when cache hit exists and updates existing asset', async () => {
    mockPrisma.holding.count.mockResolvedValue(5 as never);
    mockPrisma.asset.findFirst.mockResolvedValue({
      id: 'asset-1', name: 'תיק מסחר עצמאי', value: 40000,
      updatedAt: new Date(Date.now() - 10 * 60 * 60 * 1000),
    } as never);
    mockGetCache.mockResolvedValue(55000);
    mockPrisma.asset.update.mockResolvedValue({
      id: 'asset-1', value: 55000,
    } as never);

    const result = await syncPortfolioAsset('user-1', true);

    expect(result).toEqual({ id: 'asset-1', value: 55000 });
    expect(mockGetQuote).not.toHaveBeenCalled();
    expect(eodProvider.getUsdIlsRate).not.toHaveBeenCalled();
  });

  it('creates new asset from cache value when no existing asset', async () => {
    mockPrisma.holding.count.mockResolvedValue(3 as never);
    mockPrisma.asset.findFirst.mockResolvedValue(null as never);
    mockGetCache.mockResolvedValue(70000);
    mockPrisma.asset.create.mockResolvedValue({ id: 'new-asset', value: 70000 } as never);

    const result = await syncPortfolioAsset('user-1', true);

    expect(result).toEqual({ id: 'new-asset', value: 70000 });
    expect(mockPrisma.asset.create).toHaveBeenCalled();
    expect(saveAssetHistory).toHaveBeenCalled();
  });

  // ── Not stale, no force update ──

  it('returns existing asset without recalculating when not stale and no forceUpdate', async () => {
    const recentDate = new Date(Date.now() - 1 * 60 * 60 * 1000); // 1 hour ago
    mockPrisma.holding.count.mockResolvedValue(5 as never);
    mockPrisma.asset.findFirst.mockResolvedValue({
      id: 'asset-1', name: 'תיק מסחר עצמאי', value: 40000, updatedAt: recentDate,
    } as never);

    const result = await syncPortfolioAsset('user-1', false);

    expect(result).toEqual({ id: 'asset-1', value: 40000 });
    expect(mockGetCache).not.toHaveBeenCalled();
    expect(mockGetQuote).not.toHaveBeenCalled();
  });

  // ── Cache miss, recalculation ──

  it('recalculates when cache miss and stale asset', async () => {
    const staleDate = new Date(Date.now() - 6 * 60 * 60 * 1000); // 6 hours ago
    mockPrisma.holding.count.mockResolvedValue(2 as never);
    mockPrisma.asset.findFirst.mockResolvedValue({
      id: 'asset-1', name: 'תיק מסחר עצמאי', value: 30000, updatedAt: staleDate,
    } as never);
    mockGetCache.mockResolvedValue(null);

    // calculatePortfolioValueLightweight dependencies
    mockPrisma.holding.findMany.mockResolvedValue([
      { id: 'h1', symbol: 'AAPL', currentValue: 10, currency: 'USD', priceDisplayUnit: 'ILS' },
    ] as never);
    mockPrisma.userProfile.findUnique.mockResolvedValue({ cashBalance: 1000 } as never);
    mockGetQuote.mockResolvedValue({ price: 200, currency: 'USD', priceILS: 740 } as never);

    mockPrisma.asset.update.mockResolvedValue({ id: 'asset-1', value: 8400 } as never);

    const result = await syncPortfolioAsset('user-1', false);

    expect(result).not.toBeNull();
    expect(mockSetCache).toHaveBeenCalled();
    expect(mockPrisma.asset.update).toHaveBeenCalled();
  });

  // ── EOD failure ──

  it('returns existing asset when EOD getQuote fails', async () => {
    mockPrisma.holding.count.mockResolvedValue(1 as never);
    mockPrisma.asset.findFirst.mockResolvedValue({
      id: 'asset-1', name: 'תיק מסחר עצמאי', value: 20000,
      updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    } as never);
    mockGetCache.mockResolvedValue(null);

    mockPrisma.holding.findMany.mockResolvedValue([
      { id: 'h1', symbol: 'FAIL', currentValue: 10, currency: 'USD', priceDisplayUnit: 'ILS' },
    ] as never);
    mockPrisma.userProfile.findUnique.mockResolvedValue({ cashBalance: 0 } as never);
    mockGetQuote.mockResolvedValue(null);

    const result = await syncPortfolioAsset('user-1', true);

    // Value should be cashBalance + 0 (failed quote contributes 0)
    expect(result).not.toBeNull();
  });

  // ── invalidatePortfolioCache is NOT called ──

  it('does NOT call invalidatePortfolioCache during sync', async () => {
    mockPrisma.holding.count.mockResolvedValue(1 as never);
    mockPrisma.asset.findFirst.mockResolvedValue(null as never);
    mockGetCache.mockResolvedValue(50000);
    mockPrisma.asset.create.mockResolvedValue({ id: 'new', value: 50000 } as never);

    await syncPortfolioAsset('user-1', true);

    expect(mockInvalidate).not.toHaveBeenCalled();
  });

  // ── setCachedPortfolioValue is called after recalculation ──

  it('sets cache after successful recalculation', async () => {
    mockPrisma.holding.count.mockResolvedValue(1 as never);
    mockPrisma.asset.findFirst.mockResolvedValue(null as never);
    mockGetCache.mockResolvedValue(null);

    mockPrisma.holding.findMany.mockResolvedValue([
      { id: 'h1', symbol: 'AAPL', currentValue: 5, currency: 'USD', priceDisplayUnit: 'ILS' },
    ] as never);
    mockPrisma.userProfile.findUnique.mockResolvedValue({ cashBalance: 500 } as never);
    mockGetQuote.mockResolvedValue({ price: 100, currency: 'USD', priceILS: 370 } as never);
    mockPrisma.asset.create.mockResolvedValue({ id: 'new', value: 2350 } as never);

    await syncPortfolioAsset('user-1', true);

    expect(mockSetCache).toHaveBeenCalledWith('user-1', expect.any(Number));
  });
});
