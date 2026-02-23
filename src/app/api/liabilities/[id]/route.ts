import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, withSharedAccountId, checkPermission } from '@/lib/authHelpers';
import { saveCurrentMonthNetWorth } from '@/lib/netWorthHistory';
import { logAuditEvent, AuditAction, getRequestInfo } from '@/lib/auditLog';
import { validateRequest } from '@/lib/validateRequest';
import { updateLiabilitySchema, updateMortgageSchema } from '@/lib/validationSchemas';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const editPermission = await checkPermission(userId, 'canEdit');
    if (!editPermission.allowed) return editPermission.error!;

    const { id } = await params;

    const sharedWhere = await withSharedAccountId(id, userId);

    const currentLiability = await prisma.liability.findFirst({
      where: sharedWhere,
      include: { tracks: true },
    });

    if (!currentLiability) {
      return NextResponse.json({ error: 'Liability not found' }, { status: 404 });
    }

    if (currentLiability.gemachId) {
      return NextResponse.json(
        { error: 'לא ניתן לערוך תוכנית גמ"ח ישירות. יש למחוק וליצור מחדש.' },
        { status: 400 }
      );
    }

    // Route to mortgage update if this is a mortgage
    if (currentLiability.isMortgage) {
      return handleMortgageUpdate(request, userId, id, currentLiability, sharedWhere);
    }

    const { data, errorResponse } = await validateRequest(request, updateLiabilitySchema);
    if (errorResponse) return errorResponse;

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

    let remainingAmount = data.remainingAmount;
    if (remainingAmount === undefined) {
      if (data.totalAmount !== undefined && data.totalAmount !== currentLiability.totalAmount) {
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

    await saveCurrentMonthNetWorth(userId);

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

async function handleMortgageUpdate(
  request: NextRequest,
  userId: string,
  id: string,
  currentLiability: { id: string; totalAmount: number },
  sharedWhere: Record<string, unknown>,
) {
  const body = await request.json();
  const parsed = updateMortgageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid mortgage data', details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const totalAmount = data.tracks.reduce((s, t) => s + t.amount, 0);
  const totalMonthly = data.tracks.reduce((s, t) => s + t.monthlyPayment, 0);
  const maxTerm = Math.max(...data.tracks.map(t => t.termMonths));
  const weightedRate = totalAmount > 0
    ? data.tracks.reduce((s, t) => s + t.interestRate * (t.amount / totalAmount), 0)
    : 0;

  await prisma.$transaction([
    prisma.mortgageTrack.deleteMany({ where: { liabilityId: id } }),
    prisma.liability.updateMany({
      where: sharedWhere,
      data: {
        name: data.name,
        totalAmount,
        monthlyPayment: totalMonthly,
        interestRate: Math.round(weightedRate * 100) / 100,
        loanTermMonths: maxTerm,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        remainingAmount: totalAmount,
      },
    }),
    ...data.tracks.map(t =>
      prisma.mortgageTrack.create({
        data: {
          liabilityId: id,
          trackType: t.trackType,
          amount: t.amount,
          termMonths: t.termMonths,
          termYears: t.termYears,
          interestRate: t.interestRate,
          loanMethod: t.loanMethod,
          monthlyPayment: t.monthlyPayment,
          order: t.order,
        },
      })
    ),
  ]);

  const updated = await prisma.liability.findFirst({
    where: sharedWhere,
    include: { tracks: { orderBy: { order: 'asc' } } },
  });

  await saveCurrentMonthNetWorth(userId);

  const { ipAddress, userAgent } = getRequestInfo(request.headers);
  void logAuditEvent({
    userId,
    action: AuditAction.UPDATE,
    entityType: 'Liability',
    entityId: id,
    metadata: { type: 'mortgage', tracksCount: data.tracks.length },
    ipAddress,
    userAgent,
  });

  return NextResponse.json(updated);
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
