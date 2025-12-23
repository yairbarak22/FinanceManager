/**
 * Simple in-memory rate limiter for API protection
 * For production with Vercel serverless, consider upgrading to @upstash/ratelimit with Redis
 */

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// In-memory store for rate limit records
const requests = new Map<string, RateLimitRecord>();

// Cleanup old records periodically (every 5 minutes)
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

function cleanupOldRecords() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  
  lastCleanup = now;
  for (const [key, record] of requests.entries()) {
    if (now > record.resetTime) {
      requests.delete(key);
    }
  }
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier for the requester (e.g., IP address, user ID)
 * @param limit - Maximum number of requests allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns Object with allowed status and remaining requests
 */
export function checkRateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 60000 // 1 minute default
): { allowed: boolean; remaining: number; resetIn: number } {
  cleanupOldRecords();
  
  const now = Date.now();
  const record = requests.get(identifier);
  
  // No existing record or window expired - create new
  if (!record || now > record.resetTime) {
    requests.set(identifier, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetIn: windowMs };
  }
  
  // Check if limit exceeded
  if (record.count >= limit) {
    return { 
      allowed: false, 
      remaining: 0, 
      resetIn: record.resetTime - now 
    };
  }
  
  // Increment count
  record.count++;
  return { 
    allowed: true, 
    remaining: limit - record.count, 
    resetIn: record.resetTime - now 
  };
}

/**
 * Rate limit configuration for different endpoints
 */
export const RATE_LIMITS = {
  // General API endpoints
  api: { limit: 100, windowMs: 60000 }, // 100 requests per minute
  
  // AI endpoints (more expensive)
  ai: { limit: 20, windowMs: 60000 }, // 20 requests per minute
  
  // Import endpoint (heavy operation)
  import: { limit: 10, windowMs: 60000 }, // 10 requests per minute
  
  // Auth endpoints (prevent brute force)
  auth: { limit: 10, windowMs: 60000 }, // 10 requests per minute
};

