import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/cache', () => ({
  cacheGet: vi.fn().mockResolvedValue(null),
  cacheSet: vi.fn().mockResolvedValue(true),
  cacheDelete: vi.fn().mockResolvedValue(true),
}));

import { cacheGet, cacheSet, cacheDelete } from '@/lib/cache';
import {
  getCachedPortfolioValue,
  setCachedPortfolioValue,
  invalidatePortfolioCache,
  shouldUpdatePortfolioAsset,
  isPortfolioSyncAsset,
  PORTFOLIO_CACHE_DURATION_MS,
} from '../portfolioCache';

const mockCacheGet = vi.mocked(cacheGet);
const mockCacheSet = vi.mocked(cacheSet);
const mockCacheDelete = vi.mocked(cacheDelete);

beforeEach(() => {
  vi.clearAllMocks();
  // Clear L1 between tests by invalidating
  invalidatePortfolioCache('test-user');
  vi.clearAllMocks();
});

// ============================================================================
// Pure functions
// ============================================================================

describe('shouldUpdatePortfolioAsset', () => {
  it('returns true when asset is older than 5 hours', () => {
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    expect(shouldUpdatePortfolioAsset(sixHoursAgo)).toBe(true);
  });

  it('returns false when asset is newer than 5 hours', () => {
    const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000);
    expect(shouldUpdatePortfolioAsset(oneHourAgo)).toBe(false);
  });

  it('returns true at exactly 5 hours', () => {
    const fiveHoursAgo = new Date(Date.now() - PORTFOLIO_CACHE_DURATION_MS);
    expect(shouldUpdatePortfolioAsset(fiveHoursAgo)).toBe(true);
  });

  it('returns false for a fresh asset', () => {
    expect(shouldUpdatePortfolioAsset(new Date())).toBe(false);
  });
});

describe('isPortfolioSyncAsset', () => {
  it('returns true for the sync asset name', () => {
    expect(isPortfolioSyncAsset('תיק מסחר עצמאי')).toBe(true);
  });

  it('returns false for any other string', () => {
    expect(isPortfolioSyncAsset('דירה')).toBe(false);
    expect(isPortfolioSyncAsset('')).toBe(false);
    expect(isPortfolioSyncAsset('Portfolio')).toBe(false);
  });
});

// ============================================================================
// L1 / L2 cache logic
// ============================================================================

describe('getCachedPortfolioValue', () => {
  it('returns null when both L1 and L2 are empty', async () => {
    mockCacheGet.mockResolvedValue(null);
    const result = await getCachedPortfolioValue('user-1');
    expect(result).toBeNull();
    expect(mockCacheGet).toHaveBeenCalledWith('portfolio:value:user-1');
  });

  it('returns value from L1 without hitting L2', async () => {
    // Prime L1 by setting
    await setCachedPortfolioValue('user-2', 50000);
    vi.clearAllMocks();

    const result = await getCachedPortfolioValue('user-2');
    expect(result).toBe(50000);
    expect(mockCacheGet).not.toHaveBeenCalled();
  });

  it('returns value from L2 and populates L1', async () => {
    mockCacheGet.mockResolvedValue({ value: 75000, timestamp: Date.now() });

    const result = await getCachedPortfolioValue('user-3');
    expect(result).toBe(75000);

    // Second call should hit L1 — no L2 call
    vi.clearAllMocks();
    const result2 = await getCachedPortfolioValue('user-3');
    expect(result2).toBe(75000);
    expect(mockCacheGet).not.toHaveBeenCalled();
  });

  it('returns null when L2 has expired entry', async () => {
    const expired = Date.now() - PORTFOLIO_CACHE_DURATION_MS - 1000;
    mockCacheGet.mockResolvedValue({ value: 10000, timestamp: expired });

    const result = await getCachedPortfolioValue('user-4');
    expect(result).toBeNull();
  });

  it('evicts expired L1 entry and falls through to L2', async () => {
    // Prime L1 with a valid value, then simulate expiration
    await setCachedPortfolioValue('user-5', 30000);
    vi.clearAllMocks();

    // Fast-forward time past expiration
    const originalNow = Date.now;
    Date.now = () => originalNow() + PORTFOLIO_CACHE_DURATION_MS + 1000;

    mockCacheGet.mockResolvedValue(null);
    const result = await getCachedPortfolioValue('user-5');
    expect(result).toBeNull();
    expect(mockCacheGet).toHaveBeenCalled();

    Date.now = originalNow;
  });

  it('returns null when Redis is unavailable (L2 returns null)', async () => {
    mockCacheGet.mockResolvedValue(null);
    const result = await getCachedPortfolioValue('user-6');
    expect(result).toBeNull();
  });
});

describe('setCachedPortfolioValue', () => {
  it('calls cacheSet with correct key and TTL', async () => {
    await setCachedPortfolioValue('user-7', 42000);

    expect(mockCacheSet).toHaveBeenCalledWith(
      'portfolio:value:user-7',
      expect.objectContaining({ value: 42000 }),
      5 * 60 * 60, // 5 hours in seconds
    );
  });

  it('stores value retrievable from L1', async () => {
    await setCachedPortfolioValue('user-8', 99000);
    vi.clearAllMocks();

    const result = await getCachedPortfolioValue('user-8');
    expect(result).toBe(99000);
    expect(mockCacheGet).not.toHaveBeenCalled();
  });
});

describe('invalidatePortfolioCache', () => {
  it('calls cacheDelete with correct key', async () => {
    await invalidatePortfolioCache('user-9');
    expect(mockCacheDelete).toHaveBeenCalledWith('portfolio:value:user-9');
  });

  it('clears L1 so subsequent get returns null', async () => {
    await setCachedPortfolioValue('user-10', 12345);
    await invalidatePortfolioCache('user-10');
    vi.clearAllMocks();

    mockCacheGet.mockResolvedValue(null);
    const result = await getCachedPortfolioValue('user-10');
    expect(result).toBeNull();
  });
});
