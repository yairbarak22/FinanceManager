/**
 * Simple in-memory rate limiter
 * For production, consider using @upstash/ratelimit with Redis
 */

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

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier for the client (e.g., IP or userId)
 * @param config - Rate limit configuration
 * @returns RateLimitResult indicating if request is allowed
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
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
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      resetTime: entry.resetTime,
    };
  }

  // Increment count
  entry.count++;

  // Check if over limit
  if (entry.count > config.maxRequests) {
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  return {
    success: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

// Preset configurations for different endpoint types
export const RATE_LIMITS = {
  // Authentication endpoints - strict limits
  auth: { maxRequests: 5, windowSeconds: 60 } as RateLimitConfig,
  
  // API endpoints - moderate limits
  api: { maxRequests: 100, windowSeconds: 60 } as RateLimitConfig,
  
  // File upload - very strict
  upload: { maxRequests: 10, windowSeconds: 60 } as RateLimitConfig,
  
  // AI/expensive operations - strict
  ai: { maxRequests: 20, windowSeconds: 60 } as RateLimitConfig,
};

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
