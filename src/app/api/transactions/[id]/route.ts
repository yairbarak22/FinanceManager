import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, withSharedAccountId, checkPermission } from '@/lib/authHelpers';
import { logAuditEvent, AuditAction, getRequestInfo } from '@/lib/auditLog';
import { recalculateDeadline } from '@/lib/goalCalculations';

// Helper function to find a goal by category ID (handles both default and custom categories)
async function findGoalByCategory(userId: string, categoryId: string) {
  // First, try to find goal with category matching the ID directly (for default categories)
  let goal = await prisma.financialGoal.findFirst({
    where: {
      userId,
      category: categoryId,
    },
    include: {
      recurringTransaction: true,
    },
  });

  // If not found, it might be a custom category - find by name
  if (!goal) {
    const customCategory = await prisma.customCategory.findFirst({
      where: {
        id: categoryId,
        userId,
        type: 'expense',
      },
    });

    if (customCategory) {
      // Find goal with category matching the custom category name
      goal = await prisma.financialGoal.findFirst({
        where: {
          userId,
          category: customCategory.name, // Goal category = custom category name
        },
        include: {
          recurringTransaction: true,
        },
      });
    }
  }

  return goal;
}

// Helper function to update goal when a transaction is modified
async function adjustGoalAmount(
  userId: string,
  categoryId: string,
  amountDelta: number // Positive = add, Negative = subtract
) {
  // Find goal with matching category (handles both default and custom categories)
  const goal = await findGoalByCategory(userId, categoryId);

  if (!goal) return null;

  // Calculate new current amount (ensure it doesn't go negative or exceed target)
  const newCurrentAmount = Math.max(
    0,
    Math.min(goal.currentAmount + amountDelta, goal.targetAmount)
  );

  // Get monthly contribution from linked recurring transaction
  const monthlyContribution = goal.recurringTransaction?.amount || 0;

  // Recalculate deadline if we have a monthly contribution
  const newDeadline = monthlyContribution > 0
    ? recalculateDeadline(goal.targetAmount, newCurrentAmount, monthlyContribution)
    : null;

  // Update the goal
  const updatedGoal = await prisma.financialGoal.update({
    where: { id: goal.id },
    data: {
      currentAmount: newCurrentAmount,
      ...(newDeadline ? { deadline: newDeadline } : {}),
    },
  });

  return updatedGoal;
}

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

    // Get the original transaction to check for goal-related changes
    // Note: We need the original values to properly adjust goals
    // For now, we'll handle category and amount changes if they were provided
    if (transaction && transaction.type === 'expense') {
      try {
        // If category changed, remove amount from old goal and add to new goal
        if (body.category !== undefined && body.originalCategory && body.category !== body.originalCategory) {
          // Remove from old goal
          await adjustGoalAmount(userId, body.originalCategory, -(body.originalAmount || transaction.amount));
          // Add to new goal
          await adjustGoalAmount(userId, body.category.trim(), transaction.amount);
        }
        // If only amount changed (same category), adjust the difference
        else if (body.amount !== undefined && body.originalAmount !== undefined && body.amount !== body.originalAmount) {
          const amountDelta = body.amount - body.originalAmount;
          await adjustGoalAmount(userId, transaction.category, amountDelta);
        }
      } catch (goalError) {
        console.error('Error updating goal from transaction update:', goalError);
      }
    }

    // Audit log: transaction updated
    const { ipAddress, userAgent } = getRequestInfo(request.headers);
    void logAuditEvent({
      userId,
      action: AuditAction.UPDATE,
      entityType: 'Transaction',
      entityId: id,
      metadata: { fieldsUpdated: Object.keys(updateData), updatedTransactionsCount },
      ipAddress,
      userAgent,
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

    // Check delete permission for shared accounts
    const deletePermission = await checkPermission(userId, 'canDelete');
    if (!deletePermission.allowed) return deletePermission.error!;

    const { id } = await params;

    // Use shared account to allow deleting records from all members
    const sharedWhere = await withSharedAccountId(id, userId);

    // First, fetch the transaction to get its details for goal adjustment
    const transactionToDelete = await prisma.transaction.findFirst({
      where: sharedWhere,
    });

    const result = await prisma.transaction.deleteMany({
      where: sharedWhere,
    });
    
    if (result.count === 0) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // If transaction was an expense, adjust the goal by removing the amount
    if (transactionToDelete && transactionToDelete.type === 'expense') {
      try {
        await adjustGoalAmount(userId, transactionToDelete.category, -transactionToDelete.amount);
      } catch (goalError) {
        console.error('Error adjusting goal after transaction deletion:', goalError);
      }
    }

    // Audit log: transaction deleted
    const { ipAddress, userAgent } = getRequestInfo(request.headers);
    void logAuditEvent({
      userId,
      action: AuditAction.DELETE,
      entityType: 'Transaction',
      entityId: id,
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
  }
}
