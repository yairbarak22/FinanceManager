/**
 * Rate Limiter with Upstash Redis
 * Falls back to in-memory for development if Upstash is not configured
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { config } from './config';
import { logAuditEvent, AuditAction } from './auditLog';

export interface RateLimitConfig {
  // Maximum number of requests allowed in the window
  maxRequests: number;
  // Time window in seconds
  windowSeconds: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
}

// Preset configurations for different endpoint types
export const RATE_LIMITS = {
  // Authentication endpoints - strict limits
  auth: { maxRequests: 5, windowSeconds: 60 } as RateLimitConfig,

  // API endpoints - moderate limits
  api: { maxRequests: 100, windowSeconds: 60 } as RateLimitConfig,

  // File upload - very strict
  upload: { maxRequests: 10, windowSeconds: 60 } as RateLimitConfig,

  // Import operations - strict (heavy processing)
  import: { maxRequests: 5, windowSeconds: 60 } as RateLimitConfig,

  // AI/expensive operations - strict
  ai: { maxRequests: 20, windowSeconds: 60 } as RateLimitConfig,

  // Contact form - strict limits to prevent spam/abuse
  contact: { maxRequests: 5, windowSeconds: 60 } as RateLimitConfig,

  // Contact form per user - additional limit
  contactUser: { maxRequests: 10, windowSeconds: 300 } as RateLimitConfig,

  // Admin endpoints - strict limits to prevent abuse if credentials compromised
  admin: { maxRequests: 30, windowSeconds: 60 } as RateLimitConfig,
};

// ============================================================================
// UPSTASH REDIS RATE LIMITER (Production)
// ============================================================================

let redisClient: Redis | null = null;
let rateLimiters: Map<string, Ratelimit> | null = null;

/**
 * Initialize Upstash Redis client and rate limiters
 */
function initializeUpstash(): boolean {
  if (!config.upstashRedisRestUrl || !config.upstashRedisRestToken) {
    return false;
  }

  try {
    // Initialize Redis client
    redisClient = new Redis({
      url: config.upstashRedisRestUrl,
      token: config.upstashRedisRestToken,
    });

    // Create rate limiters for each preset type
    rateLimiters = new Map();

    for (const [type, rateConfig] of Object.entries(RATE_LIMITS)) {
      rateLimiters.set(
        type,
        new Ratelimit({
          redis: redisClient,
          limiter: Ratelimit.slidingWindow(
            rateConfig.maxRequests,
            `${rateConfig.windowSeconds} s`
          ),
          analytics: true,
          prefix: `ratelimit:${type}`,
        })
      );
    }

    console.log('✅ Upstash Redis rate limiting initialized');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Upstash Redis:', error);
    return false;
  }
}

/**
 * Check rate limit using Upstash Redis
 */
async function checkRateLimitUpstash(
  identifier: string,
  rateLimitConfig: RateLimitConfig
): Promise<RateLimitResult> {
  // Find matching preset type
  const presetType = Object.entries(RATE_LIMITS).find(
    ([_, cfg]) => cfg.maxRequests === rateLimitConfig.maxRequests &&
                  cfg.windowSeconds === rateLimitConfig.windowSeconds
  )?.[0];

  if (!presetType || !rateLimiters) {
    throw new Error('Rate limiter not initialized or invalid config');
  }

  const limiter = rateLimiters.get(presetType);
  if (!limiter) {
    throw new Error(`No rate limiter found for type: ${presetType}`);
  }

  const result = await limiter.limit(identifier);

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    resetTime: result.reset,
  };
}

// ============================================================================
// IN-MEMORY FALLBACK (Development)
// ============================================================================

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (cleared on server restart)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries periodically (every 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

/**
 * Check rate limit using in-memory store (fallback)
 */
function checkRateLimitInMemory(
  identifier: string,
  rateLimitConfig: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const windowMs = rateLimitConfig.windowSeconds * 1000;
  const key = identifier;

  let entry = rateLimitStore.get(key);

  // If no entry or window expired, create new entry
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 1,
      resetTime: now + windowMs,
    };
    rateLimitStore.set(key, entry);

    return {
      success: true,
      limit: rateLimitConfig.maxRequests,
      remaining: rateLimitConfig.maxRequests - 1,
      resetTime: entry.resetTime,
    };
  }

  // Increment count
  entry.count++;

  // Check if over limit
  if (entry.count > rateLimitConfig.maxRequests) {
    return {
      success: false,
      limit: rateLimitConfig.maxRequests,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  return {
    success: true,
    limit: rateLimitConfig.maxRequests,
    remaining: rateLimitConfig.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

// ============================================================================
// MAIN RATE LIMIT FUNCTION
// ============================================================================

// Initialize on module load
const isUpstashAvailable = initializeUpstash();

if (!isUpstashAvailable) {
  console.warn(
    '⚠️  Upstash Redis not configured - using in-memory rate limiting\n' +
    '   This will NOT work properly in serverless/production!\n' +
    '   Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to enable proper rate limiting.'
  );
}

/**
 * Check if a request should be rate limited
 * Uses Upstash Redis if available, falls back to in-memory for development
 *
 * @param identifier - Unique identifier for the client (e.g., "api:userId" or "download:userId")
 * @param rateLimitConfig - Rate limit configuration
 * @returns RateLimitResult indicating if request is allowed
 */
export async function checkRateLimit(
  identifier: string,
  rateLimitConfig: RateLimitConfig
): Promise<RateLimitResult> {
  let result: RateLimitResult;

  if (isUpstashAvailable && rateLimiters) {
    // Use Upstash Redis (production)
    result = await checkRateLimitUpstash(identifier, rateLimitConfig);
  } else {
    // Fallback to in-memory (development only)
    result = checkRateLimitInMemory(identifier, rateLimitConfig);
  }

  // Audit log when rate limit is exceeded
  if (!result.success) {
    // Extract userId from identifier (format: "type:userId")
    const userId = identifier.includes(':') ? identifier.split(':')[1] : null;

    logAuditEvent({
      userId,
      action: AuditAction.RATE_LIMITED,
      metadata: {
        identifier,
        limit: result.limit,
        resetTime: new Date(result.resetTime).toISOString(),
      },
    });
  }

  return result;
}

/**
 * Get client IP from request headers
 * Works with Vercel/Cloudflare/proxies
 */
export function getClientIp(headers: Headers): string {
  return (
    headers.get('x-real-ip') ||
    headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    headers.get('cf-connecting-ip') ||
    'unknown'
  );
}
