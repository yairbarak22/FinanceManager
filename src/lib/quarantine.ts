/**
 * Quarantine Module
 *
 * Handles quarantining suspicious files that fail secondary validation checks.
 * Files are stored in a separate "quarantine/" prefix in Vercel Blob and tracked
 * in the database for admin review.
 *
 * Flow:
 * 1. File fails validation → quarantineFile() stores it in quarantine blob + DB record
 * 2. Admin reviews via /admin/quarantine
 * 3. Admin approves (file moves to normal storage) or rejects (file deleted)
 */

import { put, del } from '@vercel/blob';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from './prisma';
import { QuarantineStatus } from '@prisma/client';
import { logAuditEvent, AuditAction } from './auditLog';

// ============================================================================
// TYPES
// ============================================================================

export interface QuarantineResult {
  quarantineId: string;
  reason: string;
  reasonCode: string;
}

export interface QuarantineListItem {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  userId: string;
  reason: string;
  reasonCode: string | null;
  status: QuarantineStatus;
  createdAt: Date;
  reviewedAt: Date | null;
  reviewedBy: string | null;
}

// ============================================================================
// QUARANTINE OPERATIONS
// ============================================================================

/**
 * Quarantine a suspicious file.
 *
 * @param buffer - The file content
 * @param filename - Original filename (sanitized before storage)
 * @param mimeType - MIME type of the file
 * @param userId - ID of the user who uploaded it
 * @param reason - Human-readable reason for quarantine
 * @param reasonCode - Machine-readable code (e.g., "PDF_JAVASCRIPT", "MACRO_DETECTED")
 * @param entityType - Optional: the entity type the file was being attached to
 * @param entityId - Optional: the entity ID the file was being attached to
 */
export async function quarantineFile(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  userId: string,
  reason: string,
  reasonCode: string,
  entityType?: string,
  entityId?: string,
): Promise<QuarantineResult> {
  // Sanitize filename for storage
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 200);
  const storedName = `quarantine/${uuidv4()}-${safeFilename}`;

  // Store file in quarantine prefix on Vercel Blob
  let blobUrl: string | undefined;
  try {
    const blob = await put(storedName, buffer, {
      access: 'public', // Only accessible via direct URL; actual access is controlled by DB status
      contentType: mimeType,
    });
    blobUrl = blob.url;
  } catch (error) {
    console.error('[Quarantine] Failed to store file in blob:', error);
    // Even if blob storage fails, create the DB record for tracking
  }

  // Create database record
  const record = await prisma.quarantinedFile.create({
    data: {
      filename: safeFilename,
      storedName,
      url: blobUrl || null,
      mimeType,
      size: buffer.length,
      userId,
      reason,
      reasonCode,
      entityType: entityType || null,
      entityId: entityId || null,
    },
  });

  // Audit log
  logAuditEvent({
    userId,
    action: AuditAction.FILE_QUARANTINED,
    entityType: 'QuarantinedFile',
    entityId: record.id,
    metadata: {
      filename: safeFilename,
      mimeType,
      size: buffer.length,
      reason,
      reasonCode,
    },
  });

  console.warn('[Quarantine] File quarantined:', {
    quarantineId: record.id,
    filename: safeFilename,
    mimeType,
    size: buffer.length,
    reason,
    reasonCode,
    userId,
  });

  return {
    quarantineId: record.id,
    reason,
    reasonCode,
  };
}

/**
 * List quarantined files for admin review.
 */
export async function listQuarantinedFiles(
  status?: QuarantineStatus,
  page: number = 1,
  limit: number = 20,
): Promise<{ items: QuarantineListItem[]; total: number }> {
  const where = status ? { status } : {};

  const [items, total] = await Promise.all([
    prisma.quarantinedFile.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        filename: true,
        mimeType: true,
        size: true,
        userId: true,
        reason: true,
        reasonCode: true,
        status: true,
        createdAt: true,
        reviewedAt: true,
        reviewedBy: true,
      },
    }),
    prisma.quarantinedFile.count({ where }),
  ]);

  return { items, total };
}

/**
 * Get a single quarantined file by ID.
 */
export async function getQuarantinedFile(id: string) {
  return prisma.quarantinedFile.findUnique({ where: { id } });
}

/**
 * Approve a quarantined file (admin action).
 * The file remains in quarantine storage but is marked as approved.
 * The original upload flow should be re-triggered by the admin.
 */
export async function approveQuarantinedFile(
  id: string,
  adminUserId: string,
  notes?: string,
): Promise<boolean> {
  const record = await prisma.quarantinedFile.findUnique({ where: { id } });
  if (!record || record.status !== QuarantineStatus.PENDING) {
    return false;
  }

  await prisma.quarantinedFile.update({
    where: { id },
    data: {
      status: QuarantineStatus.APPROVED,
      reviewedAt: new Date(),
      reviewedBy: adminUserId,
      reviewNotes: notes || null,
    },
  });

  logAuditEvent({
    userId: adminUserId,
    action: AuditAction.FILE_QUARANTINE_APPROVED,
    entityType: 'QuarantinedFile',
    entityId: id,
    metadata: {
      originalUploader: record.userId,
      filename: record.filename,
      reasonCode: record.reasonCode,
      notes,
    },
  });

  return true;
}

/**
 * Reject a quarantined file (admin action).
 * The file is deleted from blob storage and marked as rejected.
 */
export async function rejectQuarantinedFile(
  id: string,
  adminUserId: string,
  notes?: string,
): Promise<boolean> {
  const record = await prisma.quarantinedFile.findUnique({ where: { id } });
  if (!record || record.status !== QuarantineStatus.PENDING) {
    return false;
  }

  // Delete from blob storage
  if (record.url) {
    try {
      await del(record.url);
    } catch (error) {
      console.error('[Quarantine] Failed to delete blob:', error);
    }
  }

  await prisma.quarantinedFile.update({
    where: { id },
    data: {
      status: QuarantineStatus.REJECTED,
      reviewedAt: new Date(),
      reviewedBy: adminUserId,
      reviewNotes: notes || null,
      url: null, // Clear URL after deletion
    },
  });

  logAuditEvent({
    userId: adminUserId,
    action: AuditAction.FILE_QUARANTINE_REJECTED,
    entityType: 'QuarantinedFile',
    entityId: id,
    metadata: {
      originalUploader: record.userId,
      filename: record.filename,
      reasonCode: record.reasonCode,
      notes,
    },
  });

  return true;
}

/**
 * Get counts for quarantine dashboard.
 */
export async function getQuarantineStats() {
  const [pending, approved, rejected, total] = await Promise.all([
    prisma.quarantinedFile.count({ where: { status: QuarantineStatus.PENDING } }),
    prisma.quarantinedFile.count({ where: { status: QuarantineStatus.APPROVED } }),
    prisma.quarantinedFile.count({ where: { status: QuarantineStatus.REJECTED } }),
    prisma.quarantinedFile.count(),
  ]);

  return { pending, approved, rejected, total };
}

