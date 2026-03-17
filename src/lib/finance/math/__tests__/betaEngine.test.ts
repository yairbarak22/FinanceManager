import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/cache', () => ({
  cacheGet: vi.fn().mockResolvedValue(null),
  cacheSet: vi.fn().mockResolvedValue(true),
  CacheKeys: {
    marketBeta: (s: string) => `market:beta:${s}`,
  },
  CacheTTL: {
    MARKET_BETA: 7 * 24 * 60 * 60,
  },
}));

// Mock global fetch for EOD API calls
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { cacheGet, cacheSet } from '@/lib/cache';
import { calculateBeta, clearBetaCache } from '../betaEngine';

const mockCacheGet = vi.mocked(cacheGet);
const mockCacheSet = vi.mocked(cacheSet);

function makePrices(months: number, basePrice = 100): Array<{ date: string; close: number; adjusted_close: number }> {
  const prices = [];
  const now = new Date();
  for (let i = months; i >= 0; i--) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - i);
    prices.push({
      date: d.toISOString().split('T')[0],
      close: basePrice + Math.sin(i) * 10,
      adjusted_close: basePrice + Math.sin(i) * 10,
    });
  }
  return prices;
}

beforeEach(() => {
  vi.clearAllMocks();
  clearBetaCache();

  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => makePrices(36, 100),
  });
});

// ============================================================================
// calculateBeta
// ============================================================================

describe('calculateBeta', () => {
  it('returns default crypto beta for crypto symbols', async () => {
    const result = await calculateBeta('BTC-USD');

    expect(result.beta).toBe(1.5);
    expect(result.source).toBe('default_crypto');
    expect(result.dataPoints).toBe(0);
  });

  it('returns beta from L1 cache without API calls', async () => {
    // First call to populate L1
    const first = await calculateBeta('AAPL');
    expect(first.source).toBe('calculated');

    vi.clearAllMocks();

    // Second call should hit L1
    const second = await calculateBeta('AAPL');
    expect(second.source).toBe('cache');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns beta from L2 (Redis) when L1 is empty', async () => {
    mockCacheGet.mockResolvedValue({
      beta: 1.15,
      dataPoints: 30,
      timestamp: Date.now(),
    });

    const result = await calculateBeta('MSFT');

    expect(result.beta).toBe(1.15);
    expect(result.source).toBe('cache_redis');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('calculates beta and stores in both L1 and Redis', async () => {
    mockCacheGet.mockResolvedValue(null);

    const result = await calculateBeta('VOO');

    expect(result.source).toBe('calculated');
    expect(result.beta).toBeGreaterThanOrEqual(-1);
    expect(result.beta).toBeLessThanOrEqual(4);
    expect(mockCacheSet).toHaveBeenCalled();
  });

  it('returns default beta for Israeli stock with insufficient data', async () => {
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('GSPC.INDX')) {
        return { ok: true, json: async () => makePrices(36) };
      }
      // Return only 10 months for the Israeli asset
      return { ok: true, json: async () => makePrices(10) };
    });

    const result = await calculateBeta('1159250');

    expect(result.beta).toBe(0.9);
    expect(result.source).toBe('insufficient_data');
  });

  it('returns default beta for US stock with insufficient data', async () => {
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('GSPC.INDX')) {
        return { ok: true, json: async () => makePrices(36) };
      }
      return { ok: true, json: async () => makePrices(10) };
    });

    const result = await calculateBeta('RARE');

    expect(result.beta).toBe(1.0);
    expect(result.source).toBe('insufficient_data');
  });

  it('returns default beta when fetch throws', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const result = await calculateBeta('FAIL');

    expect(result.beta).toBe(1.0);
    expect(result.source).toBe('error_default');
    expect(result.dataPoints).toBe(0);
  });

  it('returns default beta when no benchmark data', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    const result = await calculateBeta('NBNCH');

    expect(result.beta).toBe(1.0);
    expect(result.source).toBe('no_benchmark');
  });

  it('clamps beta to [-1, 4] range', async () => {
    const result = await calculateBeta('NORM');
    expect(result.beta).toBeGreaterThanOrEqual(-1);
    expect(result.beta).toBeLessThanOrEqual(4);
  });

  it('ignores expired Redis entry', async () => {
    const expired = Date.now() - 8 * 24 * 60 * 60 * 1000; // 8 days ago
    mockCacheGet.mockResolvedValue({
      beta: 0.5,
      dataPoints: 20,
      timestamp: expired,
    });

    const result = await calculateBeta('EXPRD');

    expect(result.source).not.toBe('cache_redis');
  });
});
