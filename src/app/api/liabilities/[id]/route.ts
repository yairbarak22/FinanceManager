import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, withSharedAccountId, checkPermission } from '@/lib/authHelpers';
import { saveCurrentMonthNetWorth } from '@/lib/netWorthHistory';
import { logAuditEvent, AuditAction, getRequestInfo } from '@/lib/auditLog';

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
    const body = await request.json();

    // Use shared account to allow editing records from all members
    const sharedWhere = await withSharedAccountId(id, userId);

    // Get current liability to check if totalAmount changed
    const currentLiability = await prisma.liability.findFirst({
      where: sharedWhere,
    });

    if (!currentLiability) {
      return NextResponse.json({ error: 'Liability not found' }, { status: 404 });
    }

    // Build update data object with validation
    // SECURITY: Validate each field before updating
    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim().length === 0) {
        return NextResponse.json({ error: 'Name must be a non-empty string' }, { status: 400 });
      }
      if (body.name.length > 100) {
        return NextResponse.json({ error: 'Name too long (max 100 characters)' }, { status: 400 });
      }
      updateData.name = body.name.trim();
    }

    if (body.type !== undefined) {
      if (typeof body.type !== 'string' || body.type.trim().length === 0) {
        return NextResponse.json({ error: 'Type must be a non-empty string' }, { status: 400 });
      }
      updateData.type = body.type.trim();
    }

    if (body.totalAmount !== undefined) {
      if (typeof body.totalAmount !== 'number' || body.totalAmount <= 0) {
        return NextResponse.json({ error: 'Total amount must be a positive number' }, { status: 400 });
      }
      updateData.totalAmount = body.totalAmount;
    }

    if (body.monthlyPayment !== undefined) {
      if (typeof body.monthlyPayment !== 'number' || body.monthlyPayment < 0) {
        return NextResponse.json({ error: 'Monthly payment must be a non-negative number' }, { status: 400 });
      }
      updateData.monthlyPayment = body.monthlyPayment;
    }

    if (body.interestRate !== undefined) {
      const rate = body.interestRate || 0;
      if (typeof rate !== 'number' || rate < 0 || rate > 100) {
        return NextResponse.json({ error: 'Interest rate must be between 0 and 100' }, { status: 400 });
      }
      updateData.interestRate = rate;
    }

    if (body.loanTermMonths !== undefined) {
      const term = body.loanTermMonths || 0;
      if (typeof term !== 'number' || term < 0 || !Number.isInteger(term)) {
        return NextResponse.json({ error: 'Loan term must be a non-negative integer' }, { status: 400 });
      }
      updateData.loanTermMonths = term;
    }

    if (body.loanMethod !== undefined) {
      const validMethods = ['spitzer', 'equal_principal'];
      const method = body.loanMethod || 'spitzer';
      if (!validMethods.includes(method)) {
        return NextResponse.json({ error: 'Invalid loan method' }, { status: 400 });
      }
      updateData.loanMethod = method;
    }

    if (body.linkage !== undefined) {
      const validLinkage = ['none', 'index', 'foreign'];
      if (body.linkage && !validLinkage.includes(body.linkage)) {
        return NextResponse.json({ error: 'Invalid linkage type' }, { status: 400 });
      }
      updateData.linkage = body.linkage || 'none';
    }

    if (body.startDate !== undefined) {
      updateData.startDate = body.startDate ? new Date(body.startDate) : undefined;
    }

    if (body.hasInterestRebate !== undefined) {
      updateData.hasInterestRebate = Boolean(body.hasInterestRebate);
    }

    if (body.isActiveInCashFlow !== undefined) {
      updateData.isActiveInCashFlow = Boolean(body.isActiveInCashFlow);
    }

    // Calculate new remainingAmount with validation
    let remainingAmount = body.remainingAmount;
    if (remainingAmount !== undefined) {
      if (typeof remainingAmount !== 'number' || remainingAmount < 0) {
        return NextResponse.json({ error: 'Remaining amount must be a non-negative number' }, { status: 400 });
      }
    } else {
      if (body.totalAmount !== undefined && body.totalAmount !== currentLiability.totalAmount) {
        // Loan amount changed - reset remaining to new total
        remainingAmount = body.totalAmount;
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

    const result = await prisma.liability.deleteMany({
      where: sharedWhere,
    });
    
    if (result.count === 0) {
      return NextResponse.json({ error: 'Liability not found' }, { status: 404 });
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
