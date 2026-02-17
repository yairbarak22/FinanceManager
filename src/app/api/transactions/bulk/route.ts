import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, checkPermission, getSharedUserIds } from '@/lib/authHelpers';
import { logAuditEvent, AuditAction, getRequestInfo } from '@/lib/auditLog';

export async function PUT(request: NextRequest) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    // Check edit permission for shared accounts
    const editPermission = await checkPermission(userId, 'canEdit');
    if (!editPermission.allowed) return editPermission.error!;

    const body = await request.json();

    // Validate request body
    const { transactionIds, category } = body;

    if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
      return NextResponse.json(
        { error: 'transactionIds must be a non-empty array' },
        { status: 400 }
      );
    }

    if (transactionIds.length > 500) {
      return NextResponse.json(
        { error: 'Cannot update more than 500 transactions at once' },
        { status: 400 }
      );
    }

    if (typeof category !== 'string' || category.trim().length === 0) {
      return NextResponse.json(
        { error: 'Category must be a non-empty string' },
        { status: 400 }
      );
    }

    if (category.length > 50) {
      return NextResponse.json(
        { error: 'Category too long (max 50 characters)' },
        { status: 400 }
      );
    }

    // Get shared user IDs for shared account support
    const userIds = await getSharedUserIds(userId);

    // Update all selected transactions
    const result = await prisma.transaction.updateMany({
      where: {
        id: { in: transactionIds },
        userId: { in: userIds },
      },
      data: {
        category: category.trim(),
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestInfo(request.headers);
    void logAuditEvent({
      userId,
      action: AuditAction.UPDATE,
      entityType: 'Transaction',
      entityId: `bulk-${transactionIds.length}`,
      metadata: {
        transactionIds,
        newCategory: category.trim(),
        updatedCount: result.count,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      updatedCount: result.count,
    });
  } catch (error) {
    console.error('Error bulk updating transactions:', error);
    return NextResponse.json(
      { error: 'Failed to bulk update transactions' },
      { status: 500 }
    );
  }
}

