import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, withSharedAccountId, checkPermission } from '@/lib/authHelpers';
import { saveCurrentMonthNetWorth } from '@/lib/netWorthHistory';
import { logAuditEvent, AuditAction, getRequestInfo } from '@/lib/auditLog';
import { validateRequest } from '@/lib/validateRequest';
import { updateLiabilitySchema } from '@/lib/validationSchemas';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    // Check edit permission for shared accounts
    const editPermission = await checkPermission(userId, 'canEdit');
    if (!editPermission.allowed) return editPermission.error!;

    const { id } = await params;

    const { data, errorResponse } = await validateRequest(request, updateLiabilitySchema);
    if (errorResponse) return errorResponse;

    // Use shared account to allow editing records from all members
    const sharedWhere = await withSharedAccountId(id, userId);

    // Get current liability to check if totalAmount changed
    const currentLiability = await prisma.liability.findFirst({
      where: sharedWhere,
    });

    if (!currentLiability) {
      return NextResponse.json({ error: 'Liability not found' }, { status: 404 });
    }

    // Block editing Gemach-linked liabilities
    if (currentLiability.gemachId) {
      return NextResponse.json(
        { error: 'לא ניתן לערוך תוכנית גמ"ח ישירות. יש למחוק וליצור מחדש.' },
        { status: 400 }
      );
    }

    // Build update data object from validated fields
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.totalAmount !== undefined) updateData.totalAmount = data.totalAmount;
    if (data.monthlyPayment !== undefined) updateData.monthlyPayment = data.monthlyPayment;
    if (data.interestRate !== undefined) updateData.interestRate = data.interestRate;
    if (data.loanTermMonths !== undefined) updateData.loanTermMonths = data.loanTermMonths;
    if (data.loanMethod !== undefined) updateData.loanMethod = data.loanMethod;
    if (data.linkage !== undefined) updateData.linkage = data.linkage;
    if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
    if (data.hasInterestRebate !== undefined) updateData.hasInterestRebate = data.hasInterestRebate;
    if (data.isActiveInCashFlow !== undefined) updateData.isActiveInCashFlow = data.isActiveInCashFlow;

    // Calculate new remainingAmount
    let remainingAmount = data.remainingAmount;
    if (remainingAmount === undefined) {
      if (data.totalAmount !== undefined && data.totalAmount !== currentLiability.totalAmount) {
        // Loan amount changed - reset remaining to new total
        remainingAmount = data.totalAmount;
      } else {
        remainingAmount = currentLiability.remainingAmount ?? currentLiability.totalAmount;
      }
    }
    updateData.remainingAmount = remainingAmount;

    const result = await prisma.liability.updateMany({
      where: sharedWhere,
      data: updateData,
    });

    if (result.count === 0) {
      return NextResponse.json({ error: 'Liability not found' }, { status: 404 });
    }

    const liability = await prisma.liability.findFirst({
      where: sharedWhere,
    });

    // Update net worth history for current month
    await saveCurrentMonthNetWorth(userId);

    // Audit log: liability updated
    const { ipAddress, userAgent } = getRequestInfo(request.headers);
    void logAuditEvent({
      userId,
      action: AuditAction.UPDATE,
      entityType: 'Liability',
      entityId: id,
      metadata: { fieldsUpdated: Object.keys(updateData) },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(liability);
  } catch (error) {
    console.error('Error updating liability:', error);
    return NextResponse.json({ error: 'Failed to update liability' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    // Check delete permission for shared accounts
    const deletePermission = await checkPermission(userId, 'canDelete');
    if (!deletePermission.allowed) return deletePermission.error!;

    const { id } = await params;

    // Use shared account to allow deleting records from all members
    const sharedWhere = await withSharedAccountId(id, userId);

    // Fetch the liability to check if it has a gemachId
    const liabilityToDelete = await prisma.liability.findFirst({
      where: sharedWhere,
    });

    if (!liabilityToDelete) {
      return NextResponse.json({ error: 'Liability not found' }, { status: 404 });
    }

    // If this is a Gemach-linked liability, delete both asset and liability atomically
    if (liabilityToDelete.gemachId) {
      await prisma.$transaction([
        prisma.asset.deleteMany({ where: { gemachId: liabilityToDelete.gemachId } }),
        prisma.liability.deleteMany({ where: { gemachId: liabilityToDelete.gemachId } }),
      ]);
    } else {
      const result = await prisma.liability.deleteMany({
        where: sharedWhere,
      });
      
      if (result.count === 0) {
        return NextResponse.json({ error: 'Liability not found' }, { status: 404 });
      }
    }
    
    // Update net worth history for current month
    await saveCurrentMonthNetWorth(userId);

    // Audit log: liability deleted
    const { ipAddress, userAgent } = getRequestInfo(request.headers);
    void logAuditEvent({
      userId,
      action: AuditAction.DELETE,
      entityType: 'Liability',
      entityId: id,
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting liability:', error);
    return NextResponse.json({ error: 'Failed to delete liability' }, { status: 500 });
  }
}
