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

    // Build update data object with validation
    // SECURITY: Validate each field before updating
    const updateData: Record<string, unknown> = {};

    if (body.type !== undefined) {
      if (!['income', 'expense'].includes(body.type)) {
        return NextResponse.json({ error: 'Invalid type. Must be "income" or "expense"' }, { status: 400 });
      }
      updateData.type = body.type;
    }

    if (body.amount !== undefined) {
      if (typeof body.amount !== 'number' || body.amount <= 0) {
        return NextResponse.json({ error: 'Amount must be a positive number' }, { status: 400 });
      }
      updateData.amount = body.amount;
    }

    if (body.category !== undefined) {
      if (typeof body.category !== 'string' || body.category.trim().length === 0) {
        return NextResponse.json({ error: 'Category must be a non-empty string' }, { status: 400 });
      }
      if (body.category.length > 50) {
        return NextResponse.json({ error: 'Category too long (max 50 characters)' }, { status: 400 });
      }
      updateData.category = body.category.trim();
    }

    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim().length === 0) {
        return NextResponse.json({ error: 'Name must be a non-empty string' }, { status: 400 });
      }
      if (body.name.length > 100) {
        return NextResponse.json({ error: 'Name too long (max 100 characters)' }, { status: 400 });
      }
      updateData.name = body.name.trim();
    }

    if (body.isActive !== undefined) {
      updateData.isActive = Boolean(body.isActive);
    }

    const result = await prisma.recurringTransaction.updateMany({
      where: sharedWhere,
      data: updateData,
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
