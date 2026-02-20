import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, withSharedAccountId, checkPermission } from '@/lib/authHelpers';
import { logAuditEvent, AuditAction, getRequestInfo } from '@/lib/auditLog';
import { recalculateDeadline } from '@/lib/goalCalculations';
import { validateRequest } from '@/lib/validateRequest';
import { updateTransactionSchema } from '@/lib/validationSchemas';

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

    const { data, errorResponse } = await validateRequest(request, updateTransactionSchema);
    if (errorResponse) return errorResponse;

    // Use shared account to allow editing records from all members
    const sharedWhere = await withSharedAccountId(id, userId);

    // Build update data object with only provided fields (partial update support)
    const updateData: Record<string, unknown> = {};

    if (data.type !== undefined) updateData.type = data.type;
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.date !== undefined) updateData.date = new Date(data.date);

    const result = await prisma.transaction.updateMany({
      where: sharedWhere,
      data: updateData,
    });

    if (result.count === 0) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Handle updating existing transactions from same merchant if requested
    let updatedTransactionsCount = 0;
    if (data.updateExistingTransactions === true && data.category !== undefined && data.merchantName) {
      // Normalize the merchant name for matching (consistent with merchant category mapping)
      const normalizedMerchantName = String(data.merchantName).toLowerCase().trim();
      
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
          category: data.category,
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
        if (data.category !== undefined && data.originalCategory && data.category !== data.originalCategory) {
          // Remove from old goal
          await adjustGoalAmount(userId, data.originalCategory, -(data.originalAmount || transaction.amount));
          // Add to new goal
          await adjustGoalAmount(userId, data.category, transaction.amount);
        }
        // If only amount changed (same category), adjust the difference
        else if (data.amount !== undefined && data.originalAmount !== undefined && data.amount !== data.originalAmount) {
          const amountDelta = data.amount - data.originalAmount;
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
