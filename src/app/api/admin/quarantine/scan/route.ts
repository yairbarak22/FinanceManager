/**
 * Quarantine Scan Cron Job
 *
 * Runs periodically to auto-approve old quarantined files that have
 * been pending for more than 7 days without admin review.
 *
 * In a more advanced setup, this could integrate with a virus scanning
 * API (ClamAV, VirusTotal) before auto-approving.
 *
 * Endpoint: GET /api/admin/quarantine/scan
 * Should be called by Vercel Cron (see vercel.json)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { QuarantineStatus } from '@prisma/client';
import { del } from '@vercel/blob';
import { logAuditEvent, AuditAction } from '@/lib/auditLog';

// Files pending for more than 30 days are auto-rejected and deleted
const AUTO_REJECT_AFTER_DAYS = 30;

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (Vercel sends this header)
    const authHeader = request.headers.get('authorization');
    if (
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - AUTO_REJECT_AFTER_DAYS);

    // Find old pending files
    const staleFiles = await prisma.quarantinedFile.findMany({
      where: {
        status: QuarantineStatus.PENDING,
        createdAt: { lt: cutoff },
      },
    });

    let deletedCount = 0;

    for (const file of staleFiles) {
      // Delete from blob storage
      if (file.url) {
        try {
          await del(file.url);
        } catch {
          console.error(`[QuarantineScan] Failed to delete blob for ${file.id}`);
        }
      }

      // Mark as rejected
      await prisma.quarantinedFile.update({
        where: { id: file.id },
        data: {
          status: QuarantineStatus.REJECTED,
          reviewedAt: new Date(),
          reviewedBy: 'system:auto-cleanup',
          reviewNotes: `Auto-rejected: pending for ${AUTO_REJECT_AFTER_DAYS}+ days`,
          url: null,
        },
      });

      logAuditEvent({
        action: AuditAction.FILE_QUARANTINE_REJECTED,
        entityType: 'QuarantinedFile',
        entityId: file.id,
        metadata: {
          type: 'auto_cleanup',
          filename: file.filename,
          daysInQuarantine: Math.ceil(
            (Date.now() - file.createdAt.getTime()) / (1000 * 60 * 60 * 24),
          ),
        },
      });

      deletedCount++;
    }

    // Get current stats
    const stats = {
      pending: await prisma.quarantinedFile.count({
        where: { status: QuarantineStatus.PENDING },
      }),
      totalCleaned: deletedCount,
    };

    console.log(`[QuarantineScan] Cleaned ${deletedCount} stale files. Pending: ${stats.pending}`);

    return NextResponse.json({
      success: true,
      cleaned: deletedCount,
      remaining: stats.pending,
    });
  } catch (error) {
    console.error('[QuarantineScan] Error:', error);
    return NextResponse.json(
      { error: 'Scan failed' },
      { status: 500 },
    );
  }
}

