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

    if (body.description !== undefined) {
      if (typeof body.description !== 'string' || body.description.trim().length === 0) {
        return NextResponse.json({ error: 'Description must be a non-empty string' }, { status: 400 });
      }
      if (body.description.length > 500) {
        return NextResponse.json({ error: 'Description too long (max 500 characters)' }, { status: 400 });
      }
      updateData.description = body.description.trim();
    }

    if (body.date !== undefined) {
      updateData.date = new Date(body.date);
    }

    const result = await prisma.transaction.updateMany({
      where: sharedWhere,
      data: updateData,
    });

    if (result.count === 0) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Handle updating existing transactions from same merchant if requested
    let updatedTransactionsCount = 0;
    if (body.updateExistingTransactions === true && body.category !== undefined && body.merchantName) {
      // Normalize the merchant name for matching (consistent with merchant category mapping)
      const normalizedMerchantName = String(body.merchantName).toLowerCase().trim();
      
      // Update all transactions with matching normalized description (excluding current transaction)
      const updateResult = await prisma.transaction.updateMany({
        where: {
          userId,
          id: { not: id }, // Exclude current transaction (already updated)
          description: {
            mode: 'insensitive',
            equals: normalizedMerchantName,
          },
        },
        data: {
          category: body.category.trim(),
        },
      });
      
      updatedTransactionsCount = updateResult.count;
    }

    // Fetch the updated transaction
    const transaction = await prisma.transaction.findFirst({
      where: sharedWhere,
    });

    return NextResponse.json({
      ...transaction,
      updatedTransactionsCount,
    });
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
