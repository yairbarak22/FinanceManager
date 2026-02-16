import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, withSharedAccountId, checkPermission } from '@/lib/authHelpers';

export async function PATCH(
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

    if (typeof body.isActiveInCashFlow !== 'boolean') {
      return NextResponse.json(
        { error: 'isActiveInCashFlow must be a boolean' },
        { status: 400 }
      );
    }

    // Use shared account to allow editing records from all members
    const sharedWhere = await withSharedAccountId(id, userId);

    const result = await prisma.liability.updateMany({
      where: sharedWhere,
      data: { isActiveInCashFlow: body.isActiveInCashFlow },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: 'Liability not found' }, { status: 404 });
    }

    const liability = await prisma.liability.findFirst({
      where: sharedWhere,
    });

    return NextResponse.json(liability);
  } catch (error) {
    console.error('Error toggling liability cash flow status:', error);
    return NextResponse.json(
      { error: 'Failed to update liability' },
      { status: 500 }
    );
  }
}

