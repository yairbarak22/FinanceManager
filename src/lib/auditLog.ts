/**
 * Audit Logging Utility
 * Logs security-relevant actions for compliance and debugging
 */

import { prisma } from './prisma';
import { AuditAction } from '@prisma/client';

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
 * Create an audit log entry
 * This is async but doesn't need to be awaited - fire and forget
 */
export async function logAuditEvent(params: AuditLogParams): Promise<void> {
  try {
    // Sanitize metadata - remove any potential PII
    const sanitizedMetadata = params.metadata
      ? sanitizeMetadata(params.metadata)
      : null;

    await prisma.auditLog.create({
      data: {
        userId: params.userId ?? null,
        action: params.action,
        entityType: params.entityType ?? null,
        entityId: params.entityId ?? null,
        metadata: sanitizedMetadata,
        ipAddress: params.ipAddress ?? null,
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

