/**
 * Audit Logging Utility
 * Logs security-relevant actions for compliance and debugging
 */

import { prisma } from './prisma';
import { AuditAction, Prisma } from '@prisma/client';
import { config } from './config';

export { AuditAction };

export interface AuditLogParams {
  userId?: string | null;
  action: AuditAction;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Hash IP address for privacy (GDPR compliance)
 * Uses Web Crypto API (works in both Node.js and Edge Runtime)
 * Returns first 16 characters of hash for storage efficiency
 */
async function hashIp(ip: string): Promise<string> {
  if (!ip || ip === 'unknown') return 'unknown';

  // Use Web Crypto API (available in Edge Runtime)
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + config.encryptionKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex.substring(0, 16); // Shortened for storage
}

/**
 * Create an audit log entry
 * This is async but doesn't need to be awaited - fire and forget
 */
export async function logAuditEvent(params: AuditLogParams): Promise<void> {
  try {
    // Sanitize metadata - remove any potential PII
    const sanitizedMetadata = params.metadata
      ? sanitizeMetadata(params.metadata)
      : undefined;

    await prisma.auditLog.create({
      data: {
        userId: params.userId ?? null,
        action: params.action,
        entityType: params.entityType ?? null,
        entityId: params.entityId ?? null,
        metadata: sanitizedMetadata as Prisma.InputJsonValue | undefined,
        ipAddress: params.ipAddress ? await hashIp(params.ipAddress) : null, // Hash IP for privacy
        userAgent: params.userAgent?.substring(0, 500) ?? null, // Limit length
      },
    });
  } catch (error) {
    // Don't throw - audit logging should never break the main flow
    console.error('Failed to create audit log:', error);
  }
}

/**
 * Sanitize metadata to remove sensitive information
 */
function sanitizeMetadata(
  metadata: Record<string, unknown>
): Record<string, unknown> {
  const sensitiveKeys = [
    'password',
    'token',
    'secret',
    'apiKey',
    'creditCard',
    'ssn',
    'email',
    'phone',
    'address',
    'amount', // Consider if you want to log amounts
  ];

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(metadata)) {
    const lowerKey = key.toLowerCase();

    // Skip sensitive keys
    if (sensitiveKeys.some((sk) => lowerKey.includes(sk))) {
      sanitized[key] = '[REDACTED]';
      continue;
    }

    // Recursively sanitize nested objects
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeMetadata(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Helper to get IP and User-Agent from request headers
 */
export function getRequestInfo(headers: Headers): {
  ipAddress: string;
  userAgent: string;
} {
  return {
    ipAddress:
      headers.get('x-real-ip') ||
      headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      headers.get('cf-connecting-ip') ||
      'unknown',
    userAgent: headers.get('user-agent') || 'unknown',
  };
}

/**
 * Clean up old audit logs based on retention policy
 * Default retention: 90 days (GDPR data minimization)
 * Returns the number of deleted records
 */
export async function cleanupOldAuditLogs(retentionDays = 90): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await prisma.auditLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    if (result.count > 0) {
      console.log(`Cleaned up ${result.count} audit logs older than ${retentionDays} days`);
    }

    return result.count;
  } catch (error) {
    // Don't throw - cleanup should never break the main flow
    console.error('Failed to cleanup audit logs:', error);
    return 0;
  }
}

