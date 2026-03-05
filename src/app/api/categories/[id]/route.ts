import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, withSharedAccountId } from '@/lib/authHelpers';
import { logAuditEvent, AuditAction, getRequestInfo } from '@/lib/auditLog';

// PUT - Update a custom category (isMaaserEligible)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  try {
    const { id } = await params;
    const body = await request.json();
    const { isMaaserEligible } = body;

    if (typeof isMaaserEligible !== 'boolean') {
      return NextResponse.json(
        { error: 'isMaaserEligible must be a boolean' },
        { status: 400 }
      );
    }

    // Find and verify ownership (allows shared account members to edit)
    const existing = await prisma.customCategory.findFirst({
      where: await withSharedAccountId(id, userId),
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Category not found or access denied' },
        { status: 404 }
      );
    }

    // Only income/expense categories support isMaaserEligible
    if (existing.type !== 'income' && existing.type !== 'expense') {
      return NextResponse.json(
        { error: 'Only income and expense categories support isMaaserEligible' },
        { status: 400 }
      );
    }

    const updated = await prisma.customCategory.update({
      where: { id },
      data: { isMaaserEligible },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestInfo(request.headers);
    void logAuditEvent({
      userId,
      action: AuditAction.UPDATE,
      entityType: 'CustomCategory',
      entityId: id,
      ipAddress,
      userAgent,
      metadata: { isMaaserEligible },
    });

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      type: updated.type,
      icon: updated.icon,
      color: updated.color,
      isMaaserEligible: updated.isMaaserEligible,
      isCustom: true,
    });
  } catch (error) {
    console.error('Error updating custom category:', error);
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a custom category
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  try {
    const { id } = await params;

    // Delete only if it belongs to the shared account (IDOR prevention)
    const result = await prisma.customCategory.deleteMany({
      where: await withSharedAccountId(id, userId),
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: 'Category not found or access denied' },
        { status: 404 }
      );
    }

    // Audit log: category deleted
    const { ipAddress, userAgent } = getRequestInfo(request.headers);
    void logAuditEvent({
      userId,
      action: AuditAction.DELETE,
      entityType: 'CustomCategory',
      entityId: id,
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting custom category:', error);
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}

