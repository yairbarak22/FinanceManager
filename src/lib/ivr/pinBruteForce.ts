/**
 * IVR PIN brute-force protection.
 *
 * Uses Upstash Redis in production to track consecutive failures per phone
 * and lock the phone after MAX_FAILURES. In development only, falls back to
 * an in-memory Map (not safe for serverless / multi-instance production).
 */

import { getUpstashRedis } from '@/lib/rateLimit';

const MAX_FAILURES = 5;
const LOCK_TTL_SECONDS = 24 * 60 * 60; // 24 hours
const FAIL_COUNTER_TTL_SECONDS = 15 * 60; // 15 minutes

function failKey(phone: string) { return `ivr:pin_fail:${phone}`; }
function lockKey(phone: string) { return `ivr:pin_lock:${phone}`; }

// ── In-memory fallback (development only) ────────────────────────

const memFail = new Map<string, { count: number; expiresAt: number }>();
const memLock = new Map<string, number>();

function memIsLocked(phone: string): boolean {
  const exp = memLock.get(phone);
  if (!exp) return false;
  if (Date.now() > exp) { memLock.delete(phone); return false; }
  return true;
}

function memRecordFailure(phone: string): void {
  const now = Date.now();
  const entry = memFail.get(phone);
  if (!entry || now > entry.expiresAt) {
    memFail.set(phone, { count: 1, expiresAt: now + FAIL_COUNTER_TTL_SECONDS * 1000 });
  } else {
    entry.count++;
    if (entry.count >= MAX_FAILURES) {
      memLock.set(phone, now + LOCK_TTL_SECONDS * 1000);
      memFail.delete(phone);
    }
  }
}

function memClearFailures(phone: string): void {
  memFail.delete(phone);
}

// ── Public API ───────────────────────────────────────────────────

export async function isPhoneLocked(phone: string): Promise<boolean> {
  const redis = getUpstashRedis();
  if (redis) {
    const locked = await redis.get<string>(lockKey(phone));
    return locked === '1';
  }
  if (process.env.NODE_ENV === 'production') return false;
  return memIsLocked(phone);
}

export async function recordPinFailure(phone: string): Promise<void> {
  const redis = getUpstashRedis();
  if (redis) {
    const count = await redis.incr(failKey(phone));
    if (count === 1) {
      await redis.expire(failKey(phone), FAIL_COUNTER_TTL_SECONDS);
    }
    if (count >= MAX_FAILURES) {
      await redis.set(lockKey(phone), '1', { ex: LOCK_TTL_SECONDS });
      await redis.del(failKey(phone));
    }
    return;
  }
  if (process.env.NODE_ENV !== 'production') {
    memRecordFailure(phone);
  }
}

export async function clearPinFailures(phone: string): Promise<void> {
  const redis = getUpstashRedis();
  if (redis) {
    await redis.del(failKey(phone));
    return;
  }
  if (process.env.NODE_ENV !== 'production') {
    memClearFailures(phone);
  }
}
