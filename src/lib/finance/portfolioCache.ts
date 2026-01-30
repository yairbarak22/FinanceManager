/**
 * Portfolio Cache - In-memory cache for portfolio values
 * Prevents excessive EOD API calls by caching portfolio value for 5 hours
 */

// Constants
export const PORTFOLIO_SYNC_ASSET_NAME = 'תיק מסחר עצמאי';
export const PORTFOLIO_ASSET_CATEGORY = 'stocks';
export const PORTFOLIO_CACHE_DURATION_MS = 5 * 60 * 60 * 1000; // 5 hours
export const PORTFOLIO_ASSET_UPDATE_THRESHOLD_MS = 5 * 60 * 60 * 1000; // 5 hours

// Cache structure
interface PortfolioCacheEntry {
  value: number; // equityILS + cashBalance
  timestamp: number;
}

// In-memory cache map (userId -> cache entry)
const portfolioCache = new Map<string, PortfolioCacheEntry>();

/**
 * Get cached portfolio value if still valid (less than 5 hours old)
 * @param userId - The user ID
 * @returns The cached value or null if expired/not found
 */
export function getCachedPortfolioValue(userId: string): number | null {
  const cached = portfolioCache.get(userId);
  
  if (!cached) {
    return null;
  }
  
  const now = Date.now();
  if (now - cached.timestamp >= PORTFOLIO_CACHE_DURATION_MS) {
    // Cache expired, remove it
    portfolioCache.delete(userId);
    return null;
  }
  
  return cached.value;
}

/**
 * Set cached portfolio value
 * @param userId - The user ID
 * @param value - The portfolio value to cache
 */
export function setCachedPortfolioValue(userId: string, value: number): void {
  portfolioCache.set(userId, {
    value,
    timestamp: Date.now(),
  });
}

/**
 * Invalidate (clear) cached portfolio value for a user
 * Should be called when holdings change
 * @param userId - The user ID
 */
export function invalidatePortfolioCache(userId: string): void {
  portfolioCache.delete(userId);
}

/**
 * Check if a portfolio sync asset should be updated
 * Returns true if the asset was last updated more than 5 hours ago
 * @param assetUpdatedAt - The asset's updatedAt timestamp
 * @returns True if the asset should be updated
 */
export function shouldUpdatePortfolioAsset(assetUpdatedAt: Date): boolean {
  const now = Date.now();
  const lastUpdate = assetUpdatedAt.getTime();
  return now - lastUpdate >= PORTFOLIO_ASSET_UPDATE_THRESHOLD_MS;
}

/**
 * Check if an asset is a portfolio sync asset by name
 * @param assetName - The asset name to check
 * @returns True if this is the portfolio sync asset
 */
export function isPortfolioSyncAsset(assetName: string): boolean {
  return assetName === PORTFOLIO_SYNC_ASSET_NAME;
}

