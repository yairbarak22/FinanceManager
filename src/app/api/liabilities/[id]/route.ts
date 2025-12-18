import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, withSharedAccountId } from '@/lib/authHelpers';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

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

    // Calculate new remainingAmount:
    // - If explicitly provided, use it
    // - If totalAmount changed, reset to new totalAmount (loan restructured)
    // - Otherwise keep existing
    let remainingAmount = body.remainingAmount;
    if (remainingAmount === undefined) {
      if (body.totalAmount !== currentLiability.totalAmount) {
        // Loan amount changed - reset remaining to new total
        remainingAmount = body.totalAmount;
      } else {
        remainingAmount = currentLiability.remainingAmount ?? body.totalAmount;
      }
    }

    const result = await prisma.liability.updateMany({
      where: sharedWhere,
      data: {
        name: body.name,
        type: body.type,
        totalAmount: body.totalAmount,
        monthlyPayment: body.monthlyPayment,
        interestRate: body.interestRate || 0,
        loanTermMonths: body.loanTermMonths || 0,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        remainingAmount,
        loanMethod: body.loanMethod || 'spitzer',
        hasInterestRebate: body.hasInterestRebate || false,
      },
    });
    
    if (result.count === 0) {
      return NextResponse.json({ error: 'Liability not found' }, { status: 404 });
    }
    
    const liability = await prisma.liability.findFirst({
      where: sharedWhere,
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

    const { id } = await params;
    
    // Use shared account to allow deleting records from all members
    const sharedWhere = await withSharedAccountId(id, userId);
    
    const result = await prisma.liability.deleteMany({
      where: sharedWhere,
    });
    
    if (result.count === 0) {
      return NextResponse.json({ error: 'Liability not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting liability:', error);
    return NextResponse.json({ error: 'Failed to delete liability' }, { status: 500 });
  }
}
