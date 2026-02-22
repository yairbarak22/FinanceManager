/**
 * Webhook Security Tests
 *
 * Tests for timestamp validation, nonce tracking, and combined validation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock audit log to avoid Prisma dependency
vi.mock('../auditLog', () => ({
  logAuditEvent: vi.fn(),
  AuditAction: {
    SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
    WEBHOOK_REJECTED: 'WEBHOOK_REJECTED',
  },
}));

// Mock prisma
vi.mock('../prisma', () => ({
  prisma: {},
}));

// Mock config
vi.mock('../config', () => ({
  config: {
    upstashRedisRestUrl: undefined,
    upstashRedisRestToken: undefined,
    encryptionKey: 'a'.repeat(64),
  },
}));

import {
  validateWebhookTimestamp,
  checkAndStoreNonce,
  validateWebhookSecurity,
  _clearNonceStoreForTesting,
} from '../webhookSecurity';
import { logAuditEvent } from '../auditLog';

beforeEach(() => {
  _clearNonceStoreForTesting();
  vi.mocked(logAuditEvent).mockClear();
});

// ============================================================================
// Timestamp Validation
// ============================================================================

describe('validateWebhookTimestamp', () => {
  it('should accept a current timestamp', () => {
    const now = Math.floor(Date.now() / 1000).toString();
    expect(validateWebhookTimestamp(now)).toBe(true);
  });

  it('should accept a timestamp 1 minute old', () => {
    const oneMinAgo = (Math.floor(Date.now() / 1000) - 60).toString();
    expect(validateWebhookTimestamp(oneMinAgo)).toBe(true);
  });

  it('should accept a timestamp 4 minutes old (within 5 min window)', () => {
    const fourMinAgo = (Math.floor(Date.now() / 1000) - 240).toString();
    expect(validateWebhookTimestamp(fourMinAgo)).toBe(true);
  });

  it('should reject a timestamp 6 minutes old (>5 min)', () => {
    const sixMinAgo = (Math.floor(Date.now() / 1000) - 360).toString();
    expect(validateWebhookTimestamp(sixMinAgo)).toBe(false);
  });

  it('should reject a timestamp 1 hour old', () => {
    const oneHourAgo = (Math.floor(Date.now() / 1000) - 3600).toString();
    expect(validateWebhookTimestamp(oneHourAgo)).toBe(false);
  });

  it('should reject a timestamp 1 minute in the future (>30s skew)', () => {
    const oneMinFuture = (Math.floor(Date.now() / 1000) + 60).toString();
    expect(validateWebhookTimestamp(oneMinFuture)).toBe(false);
  });

  it('should accept a timestamp 10 seconds in the future (within skew)', () => {
    const tenSecFuture = (Math.floor(Date.now() / 1000) + 10).toString();
    expect(validateWebhookTimestamp(tenSecFuture)).toBe(true);
  });

  it('should reject null timestamp', () => {
    expect(validateWebhookTimestamp(null)).toBe(false);
  });

  it('should reject undefined timestamp', () => {
    expect(validateWebhookTimestamp(undefined)).toBe(false);
  });

  it('should reject non-numeric timestamp', () => {
    expect(validateWebhookTimestamp('not-a-number')).toBe(false);
  });

  it('should reject empty string', () => {
    expect(validateWebhookTimestamp('')).toBe(false);
  });

  it('should accept custom maxAgeSeconds', () => {
    // 2 minutes old, with 60s max age → rejected
    const twoMinAgo = (Math.floor(Date.now() / 1000) - 120).toString();
    expect(validateWebhookTimestamp(twoMinAgo, 60)).toBe(false);

    // 30 seconds old, with 60s max age → accepted
    const thirtySecAgo = (Math.floor(Date.now() / 1000) - 30).toString();
    expect(validateWebhookTimestamp(thirtySecAgo, 60)).toBe(true);
  });
});

// ============================================================================
// Nonce Tracking
// ============================================================================

describe('checkAndStoreNonce', () => {
  it('should accept a new nonce', async () => {
    const result = await checkAndStoreNonce('unique-nonce-1');
    expect(result).toBe(true);
  });

  it('should reject a repeated nonce (replay)', async () => {
    await checkAndStoreNonce('repeated-nonce');
    const result = await checkAndStoreNonce('repeated-nonce');
    expect(result).toBe(false);
  });

  it('should accept different nonces', async () => {
    const r1 = await checkAndStoreNonce('nonce-a');
    const r2 = await checkAndStoreNonce('nonce-b');
    const r3 = await checkAndStoreNonce('nonce-c');
    expect(r1).toBe(true);
    expect(r2).toBe(true);
    expect(r3).toBe(true);
  });

  it('should reject null nonce', async () => {
    const result = await checkAndStoreNonce(null);
    expect(result).toBe(false);
  });

  it('should reject undefined nonce', async () => {
    const result = await checkAndStoreNonce(undefined);
    expect(result).toBe(false);
  });

  it('should reject empty string nonce', async () => {
    const result = await checkAndStoreNonce('');
    expect(result).toBe(false);
  });
});

// ============================================================================
// Combined Webhook Security Validation
// ============================================================================

describe('validateWebhookSecurity', () => {
  it('should accept valid svix-id and current timestamp', async () => {
    const now = Math.floor(Date.now() / 1000).toString();
    const result = await validateWebhookSecurity('msg_unique_1', now);
    expect(result.valid).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it('should reject missing svix-id', async () => {
    const now = Math.floor(Date.now() / 1000).toString();
    const result = await validateWebhookSecurity(null, now);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('missing_headers');
  });

  it('should reject missing timestamp', async () => {
    const result = await validateWebhookSecurity('msg_123', null);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('missing_headers');
  });

  it('should reject expired timestamp', async () => {
    const tenMinAgo = (Math.floor(Date.now() / 1000) - 600).toString();
    const result = await validateWebhookSecurity('msg_expired', tenMinAgo);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('timestamp_expired');
  });

  it('should reject future timestamp (beyond skew)', async () => {
    const fiveMinFuture = (Math.floor(Date.now() / 1000) + 300).toString();
    const result = await validateWebhookSecurity('msg_future', fiveMinFuture);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('timestamp_future');
  });

  it('should reject replayed webhook (same svix-id)', async () => {
    const now = Math.floor(Date.now() / 1000).toString();

    const first = await validateWebhookSecurity('msg_replay_test', now);
    expect(first.valid).toBe(true);

    const second = await validateWebhookSecurity('msg_replay_test', now);
    expect(second.valid).toBe(false);
    expect(second.reason).toBe('replay_detected');
  });

  it('should log audit event for expired timestamp', async () => {
    const tenMinAgo = (Math.floor(Date.now() / 1000) - 600).toString();
    await validateWebhookSecurity('msg_audit_ts', tenMinAgo);
    expect(logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'SUSPICIOUS_ACTIVITY',
        metadata: expect.objectContaining({
          type: 'webhook_timestamp_invalid',
        }),
      }),
    );
  });

  it('should log audit event for replay attack', async () => {
    const now = Math.floor(Date.now() / 1000).toString();
    await validateWebhookSecurity('msg_audit_replay', now);

    vi.mocked(logAuditEvent).mockClear();
    await validateWebhookSecurity('msg_audit_replay', now);
    expect(logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'SUSPICIOUS_ACTIVITY',
        metadata: expect.objectContaining({
          type: 'webhook_replay_detected',
        }),
      }),
    );
  });

  it('should accept retries with different svix-id but same timestamp', async () => {
    const now = Math.floor(Date.now() / 1000).toString();

    const r1 = await validateWebhookSecurity('msg_retry_1', now);
    const r2 = await validateWebhookSecurity('msg_retry_2', now);
    expect(r1.valid).toBe(true);
    expect(r2.valid).toBe(true);
  });
});

