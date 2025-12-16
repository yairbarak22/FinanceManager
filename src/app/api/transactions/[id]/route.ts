import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, withIdAndUserId } from '@/lib/authHelpers';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const { id } = await params;
    const body = await request.json();
    
    // Use updateMany with userId to prevent IDOR attacks
    const result = await prisma.transaction.updateMany({
      where: withIdAndUserId(id, userId),
      data: {
        type: body.type,
        amount: body.amount,
        category: body.category,
        description: body.description,
        date: new Date(body.date),
      },
    });
    
    if (result.count === 0) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }
    
    // Fetch the updated transaction
    const transaction = await prisma.transaction.findFirst({
      where: withIdAndUserId(id, userId),
    });
    
    return NextResponse.json(transaction);
  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
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
    
    // Use deleteMany with userId to prevent IDOR attacks
    const result = await prisma.transaction.deleteMany({
      where: withIdAndUserId(id, userId),
    });
    
    if (result.count === 0) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
  }
}
