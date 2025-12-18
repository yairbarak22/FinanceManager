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
    
    const result = await prisma.recurringTransaction.updateMany({
      where: sharedWhere,
      data: {
        type: body.type,
        amount: body.amount,
        category: body.category,
        name: body.name,
        isActive: body.isActive,
      },
    });
    
    if (result.count === 0) {
      return NextResponse.json({ error: 'Recurring transaction not found' }, { status: 404 });
    }
    
    const recurring = await prisma.recurringTransaction.findFirst({
      where: sharedWhere,
    });
    
    return NextResponse.json(recurring);
  } catch (error) {
    console.error('Error updating recurring transaction:', error);
    return NextResponse.json({ error: 'Failed to update recurring transaction' }, { status: 500 });
  }
}

export async function PATCH(
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
    
    const result = await prisma.recurringTransaction.updateMany({
      where: sharedWhere,
      data: {
        isActive: body.isActive,
      },
    });
    
    if (result.count === 0) {
      return NextResponse.json({ error: 'Recurring transaction not found' }, { status: 404 });
    }
    
    const recurring = await prisma.recurringTransaction.findFirst({
      where: sharedWhere,
    });
    
    return NextResponse.json(recurring);
  } catch (error) {
    console.error('Error toggling recurring transaction:', error);
    return NextResponse.json({ error: 'Failed to toggle recurring transaction' }, { status: 500 });
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
    
    const result = await prisma.recurringTransaction.deleteMany({
      where: sharedWhere,
    });
    
    if (result.count === 0) {
      return NextResponse.json({ error: 'Recurring transaction not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting recurring transaction:', error);
    return NextResponse.json({ error: 'Failed to delete recurring transaction' }, { status: 500 });
  }
}
