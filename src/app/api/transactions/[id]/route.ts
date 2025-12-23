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
    
    // Build update data object with only provided fields (partial update support)
    const updateData: Record<string, unknown> = {};
    if (body.type !== undefined) updateData.type = body.type;
    if (body.amount !== undefined) updateData.amount = body.amount;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.date !== undefined) updateData.date = new Date(body.date);
    
    const result = await prisma.transaction.updateMany({
      where: sharedWhere,
      data: updateData,
    });
    
    if (result.count === 0) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }
    
    // Fetch the updated transaction
    const transaction = await prisma.transaction.findFirst({
      where: sharedWhere,
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
    
    // Use shared account to allow deleting records from all members
    const sharedWhere = await withSharedAccountId(id, userId);
    
    const result = await prisma.transaction.deleteMany({
      where: sharedWhere,
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
