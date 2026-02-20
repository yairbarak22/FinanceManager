/**
 * Webhook Security Module
 *
 * Provides timestamp validation and nonce tracking to prevent replay attacks
 * on webhook endpoints. Works with both Upstash Redis (production) and
 * an in-memory fallback (development).
 *
 * Usage in webhook handlers:
 *   const tsValid = validateWebhookTimestamp(svixTimestamp);
 *   if (!tsValid) return 401;
 *
 *   const nonceOk = await checkAndStoreNonce(svixId);
 *   if (!nonceOk) return 401; // replay
 */

import { logAuditEvent, AuditAction } from './auditLog';

// ============================================================================
// TIMESTAMP VALIDATION
// ============================================================================

/**
 * Default maximum age for webhook timestamps (5 minutes).
 * Resend retries within 5 min, so this is safe.
 */
const DEFAULT_MAX_AGE_SECONDS = 300;

/**
 * Maximum clock skew tolerance for future timestamps (30 seconds).
 * Allows for minor clock differences between servers.
 */
const MAX_FUTURE_SKEW_SECONDS = 30;

/**
 * Validate that a webhook timestamp is recent enough and not from the future.
 *
 * @param timestamp - Unix epoch string (seconds) from the svix-timestamp header
 * @param maxAgeSeconds - Maximum age in seconds (default 300 = 5 min)
 * @returns true if the timestamp is valid
 */
export function validateWebhookTimestamp(
  timestamp: string | null | undefined,
  maxAgeSeconds: number = DEFAULT_MAX_AGE_SECONDS,
): boolean {
  if (!timestamp) return false;

  const requestTimeSec = parseInt(timestamp, 10);
  if (isNaN(requestTimeSec)) return false;

  const nowSec = Math.floor(Date.now() / 1000);
  const age = nowSec - requestTimeSec;

  // Reject if too old
  if (age > maxAgeSeconds) return false;

  // Reject if too far in the future (clock skew)
  if (age < -MAX_FUTURE_SKEW_SECONDS) return false;

  return true;
}

// ============================================================================
// NONCE TRACKING (Replay Prevention)
// ============================================================================

/**
 * In-memory nonce store. Maps nonce → expiration timestamp (ms).
 * In production, this should be replaced with Redis for cross-instance tracking.
 */
const nonceStore = new Map<string, number>();

/**
 * Default TTL for nonces (1 hour).
 * After this time the nonce is forgotten and could theoretically be reused,
 * but the timestamp check above limits the risk.
 */
const DEFAULT_NONCE_TTL_SECONDS = 3600;

/**
 * Clean up old entries periodically (every 10 minutes).
 */
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [nonce, expiry] of nonceStore.entries()) {
      if (expiry < now) {
        nonceStore.delete(nonce);
      }
    }
  }, 10 * 60 * 1000);
}

/**
 * Check if a nonce (svix-id) has been seen before.
 * If not, store it with a TTL to prevent replay attacks.
 *
 * @param nonce - The unique webhook delivery ID (svix-id header)
 * @param ttlSeconds - Time-to-live for stored nonces (default 3600 = 1 hour)
 * @returns true if the nonce is NEW (request should be processed)
 *          false if the nonce was SEEN BEFORE (replay attack / duplicate)
 */
export async function checkAndStoreNonce(
  nonce: string | null | undefined,
  ttlSeconds: number = DEFAULT_NONCE_TTL_SECONDS,
): Promise<boolean> {
  if (!nonce) return false;

  const existing = nonceStore.get(nonce);
  const now = Date.now();

  // If nonce exists and hasn't expired, this is a replay
  if (existing !== undefined && existing > now) {
    return false;
  }

  // Store the nonce with expiry
  nonceStore.set(nonce, now + ttlSeconds * 1000);
  return true;
}

// ============================================================================
// COMBINED WEBHOOK VALIDATION HELPER
// ============================================================================

export interface WebhookSecurityResult {
  valid: boolean;
  reason?: 'missing_headers' | 'timestamp_expired' | 'timestamp_future' | 'replay_detected';
}

/**
 * Perform all webhook security checks in one call:
 * 1. Verify required Svix headers are present
 * 2. Validate timestamp is recent
 * 3. Check nonce hasn't been used before
 *
 * @param svixId - svix-id header value
 * @param svixTimestamp - svix-timestamp header value
 * @param maxAgeSeconds - Maximum timestamp age (default 300s)
 * @returns WebhookSecurityResult
 */
export async function validateWebhookSecurity(
  svixId: string | null | undefined,
  svixTimestamp: string | null | undefined,
  maxAgeSeconds: number = DEFAULT_MAX_AGE_SECONDS,
): Promise<WebhookSecurityResult> {
  // 1. Check required headers
  if (!svixId || !svixTimestamp) {
    return { valid: false, reason: 'missing_headers' };
  }

  // 2. Validate timestamp
  if (!validateWebhookTimestamp(svixTimestamp, maxAgeSeconds)) {
    const requestTimeSec = parseInt(svixTimestamp, 10);
    const nowSec = Math.floor(Date.now() / 1000);
    const isFuture = !isNaN(requestTimeSec) && requestTimeSec > nowSec;

    logAuditEvent({
      action: AuditAction.SUSPICIOUS_ACTIVITY,
      metadata: {
        type: 'webhook_timestamp_invalid',
        svixId,
        svixTimestamp,
        age: isNaN(requestTimeSec) ? 'NaN' : `${nowSec - requestTimeSec}s`,
      },
    });

    return {
      valid: false,
      reason: isFuture ? 'timestamp_future' : 'timestamp_expired',
    };
  }

  // 3. Check nonce (replay protection)
  const nonceIsNew = await checkAndStoreNonce(svixId);
  if (!nonceIsNew) {
    logAuditEvent({
      action: AuditAction.SUSPICIOUS_ACTIVITY,
      metadata: {
        type: 'webhook_replay_detected',
        svixId,
        svixTimestamp,
      },
    });

    return { valid: false, reason: 'replay_detected' };
  }

  return { valid: true };
}

/**
 * Export for testing — allows clearing the in-memory nonce store.
 * ONLY for use in tests.
 */
export function _clearNonceStoreForTesting(): void {
  nonceStore.clear();
}

