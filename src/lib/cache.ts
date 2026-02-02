/**
 * Redis Cache Layer with Upstash
 * Provides caching for auth, transactions, and other frequently accessed data
 * Falls back gracefully if Redis is not configured
 */

import { Redis } from '@upstash/redis';
import { config } from './config';

// ============================================================================
// REDIS CLIENT INITIALIZATION
// ============================================================================

let redis: Redis | null = null;
let isRedisAvailable = false;

function initializeRedis(): boolean {
  if (!config.upstashRedisRestUrl || !config.upstashRedisRestToken) {
    console.warn('⚠️  Redis cache not configured - caching disabled');
    return false;
  }

  try {
    redis = new Redis({
      url: config.upstashRedisRestUrl,
      token: config.upstashRedisRestToken,
    });
    console.log('✅ Redis cache initialized');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Redis cache:', error);
    return false;
  }
}

// Initialize on module load
isRedisAvailable = initializeRedis();

// ============================================================================
// CACHE OPERATIONS
// ============================================================================

/**
 * Get a value from cache
 * @returns The cached value or null if not found/error
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!isRedisAvailable || !redis) return null;

  try {
    const value = await redis.get<T>(key);
    return value;
  } catch (error) {
    console.error(`[Cache] Error getting key ${key}:`, error);
    return null;
  }
}

/**
 * Set a value in cache with TTL
 * @param key - Cache key
 * @param value - Value to cache (will be JSON serialized)
 * @param ttlSeconds - Time to live in seconds
 */
export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds: number
): Promise<boolean> {
  if (!isRedisAvailable || !redis) return false;

  try {
    await redis.set(key, value, { ex: ttlSeconds });
    return true;
  } catch (error) {
    console.error(`[Cache] Error setting key ${key}:`, error);
    return false;
  }
}

/**
 * Delete a value from cache
 */
export async function cacheDelete(key: string): Promise<boolean> {
  if (!isRedisAvailable || !redis) return false;

  try {
    await redis.del(key);
    return true;
  } catch (error) {
    console.error(`[Cache] Error deleting key ${key}:`, error);
    return false;
  }
}

/**
 * Delete multiple keys matching a pattern
 * Use with caution - pattern matching can be slow on large datasets
 */
export async function cacheDeletePattern(pattern: string): Promise<boolean> {
  if (!isRedisAvailable || !redis) return false;

  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    return true;
  } catch (error) {
    console.error(`[Cache] Error deleting pattern ${pattern}:`, error);
    return false;
  }
}

// ============================================================================
// CACHE KEY BUILDERS
// ============================================================================

export const CacheKeys = {
  // Auth cache - user existence check
  authUser: (userId: string) => `auth:user:${userId}`,

  // Transactions list cache
  transactions: (userId: string, month?: string) =>
    month ? `transactions:${userId}:${month}` : `transactions:${userId}:all`,

  // Market data cache
  marketQuote: (symbol: string) => `market:quote:${symbol}`,
  marketBatch: (symbols: string) => `market:batch:${symbols}`,

  // User's shared account members
  sharedMembers: (userId: string) => `shared:members:${userId}`,
};

// ============================================================================
// CACHE TTL CONSTANTS (in seconds)
// ============================================================================

export const CacheTTL = {
  // Auth - 1 hour (user won't be deleted frequently)
  AUTH_USER: 60 * 60,

  // Transactions - 60 seconds (balance between freshness and performance)
  TRANSACTIONS: 60,

  // Market data - 5 minutes for US markets, longer for others
  MARKET_QUOTE_US: 5 * 60,
  MARKET_QUOTE_IL: 15 * 60, // TASE has less frequent updates

  // Shared account members - 5 minutes
  SHARED_MEMBERS: 5 * 60,
};

// ============================================================================
// HELPER: GET OR SET PATTERN
// ============================================================================

/**
 * Get from cache or compute and cache the value
 * @param key - Cache key
 * @param ttlSeconds - TTL for cached value
 * @param computeFn - Function to compute value if not cached
 */
export async function cacheGetOrSet<T>(
  key: string,
  ttlSeconds: number,
  computeFn: () => Promise<T>
): Promise<T> {
  // Try to get from cache
  const cached = await cacheGet<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Compute the value
  const value = await computeFn();

  // Cache it (fire and forget)
  void cacheSet(key, value, ttlSeconds);

  return value;
}

/**
 * Check if Redis cache is available
 */
export function isCacheAvailable(): boolean {
  return isRedisAvailable;
}
