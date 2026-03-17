/**
 * Portfolio Cache - Redis-backed (L2) with in-memory (L1) cache for portfolio values
 * Prevents excessive EOD API calls by caching portfolio value for 5 hours
 * Redis ensures cache survives across serverless invocations
 */

import { cacheGet, cacheSet, cacheDelete } from '@/lib/cache';

export const PORTFOLIO_SYNC_ASSET_NAME = 'תיק מסחר עצמאי';
export const PORTFOLIO_ASSET_CATEGORY = 'stocks';
export const PORTFOLIO_CACHE_DURATION_MS = 5 * 60 * 60 * 1000; // 5 hours
export const PORTFOLIO_ASSET_UPDATE_THRESHOLD_MS = 5 * 60 * 60 * 1000; // 5 hours
const PORTFOLIO_CACHE_TTL_SECONDS = 5 * 60 * 60; // 5 hours in seconds

interface PortfolioCacheEntry {
  value: number;
  timestamp: number;
}

const portfolioL1 = new Map<string, PortfolioCacheEntry>();

function redisKey(userId: string): string {
  return `portfolio:value:${userId}`;
}

/**
 * Get cached portfolio value - checks L1 (in-memory) then L2 (Redis)
 */
export async function getCachedPortfolioValue(userId: string): Promise<number | null> {
  const now = Date.now();

  const l1 = portfolioL1.get(userId);
  if (l1 && now - l1.timestamp < PORTFOLIO_CACHE_DURATION_MS) {
    return l1.value;
  }
  if (l1) portfolioL1.delete(userId);

  const l2 = await cacheGet<PortfolioCacheEntry>(redisKey(userId));
  if (l2 && now - l2.timestamp < PORTFOLIO_CACHE_DURATION_MS) {
    portfolioL1.set(userId, l2);
    return l2.value;
  }

  return null;
}

/**
 * Set cached portfolio value in both L1 and L2
 */
export async function setCachedPortfolioValue(userId: string, value: number): Promise<void> {
  const entry: PortfolioCacheEntry = { value, timestamp: Date.now() };
  portfolioL1.set(userId, entry);
  await cacheSet(redisKey(userId), entry, PORTFOLIO_CACHE_TTL_SECONDS);
}

/**
 * Invalidate (clear) cached portfolio value for a user.
 * Should ONLY be called when holdings actually change (add/delete holding).
 */
export async function invalidatePortfolioCache(userId: string): Promise<void> {
  portfolioL1.delete(userId);
  await cacheDelete(redisKey(userId));
}

export function shouldUpdatePortfolioAsset(assetUpdatedAt: Date): boolean {
  return Date.now() - assetUpdatedAt.getTime() >= PORTFOLIO_ASSET_UPDATE_THRESHOLD_MS;
}

export function isPortfolioSyncAsset(assetName: string): boolean {
  return assetName === PORTFOLIO_SYNC_ASSET_NAME;
}
