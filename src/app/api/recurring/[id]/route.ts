import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, withSharedAccountId, checkPermission, getSharedUserIds } from '@/lib/authHelpers';
import { logAuditEvent, AuditAction, getRequestInfo } from '@/lib/auditLog';
import { recalculateDeadline } from '@/lib/goalCalculations';
import { validateActiveMonths } from '@/lib/utils';

/**
 * Auto-link a goal to a recurring transaction if:
 * 1. Goal has the same category as the recurring transaction
 * 2. Goal doesn't have a linked recurring transaction
 * 3. The recurring transaction is not already linked to another goal
 */
export async function autoLinkGoalToRecurring(
  userId: string,
  recurringCategory: string,
  recurringId: string
): Promise<void> {
  // Get all user IDs in the shared account
  const userIds = await getSharedUserIds(userId);
  
  // Find goal with matching category that has no linked recurring transaction
  const goal = await prisma.financialGoal.findFirst({
    where: {
      userId: { in: userIds },
      category: recurringCategory,
      recurringTransactionId: null,
    },
  });

  if (!goal) return;

  // Check if this recurring transaction is already linked to another goal
  const existingLink = await prisma.financialGoal.findUnique({
    where: { recurringTransactionId: recurringId },
  });

  if (existingLink) return;

  // Get the recurring transaction details
  const recurring = await prisma.recurringTransaction.findUnique({
    where: { id: recurringId },
  });

  if (!recurring || !recurring.isActive) return;

  // Recalculate deadline based on the new recurring amount
  const newDeadline = recalculateDeadline(
    goal.targetAmount,
    goal.currentAmount,
    recurring.amount
  );

  // Link the goal to this recurring transaction
  await prisma.financialGoal.update({
    where: { id: goal.id },
    data: {
      recurringTransactionId: recurringId,
      ...(newDeadline ? { deadline: newDeadline } : {}),
    },
  });
}

// Helper function to update linked goal when recurring transaction changes
async function updateLinkedGoalDeadline(recurringTransactionId: string, newAmount: number, isActive: boolean) {
  // Find goal linked to this recurring transaction
  const goal = await prisma.financialGoal.findUnique({
    where: { recurringTransactionId },
  });

  if (!goal) return null;

  // If recurring is deactivated, we don't recalculate deadline
  if (!isActive) return goal;

  // Recalculate deadline based on new monthly contribution
  const newDeadline = recalculateDeadline(
    goal.targetAmount,
    goal.currentAmount,
    newAmount
  );

  if (!newDeadline) return goal;

  // Update the goal with new deadline
  const updatedGoal = await prisma.financialGoal.update({
    where: { id: goal.id },
    data: { deadline: newDeadline },
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

    if (body.activeMonths !== undefined) {
      const activeMonthsError = validateActiveMonths(body.activeMonths);
      if (activeMonthsError) {
        return NextResponse.json({ error: activeMonthsError }, { status: 400 });
      }
      updateData.activeMonths = body.activeMonths;
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

    // If amount or isActive changed, update linked goal deadline
    if (recurring && (body.amount !== undefined || body.isActive !== undefined)) {
      try {
        await updateLinkedGoalDeadline(
          id,
          recurring.amount,
          recurring.isActive
        );
      } catch (goalError) {
        console.error('Error updating linked goal:', goalError);
      }
    }

    // If category changed, try to auto-link to a goal with matching category
    if (recurring && body.category !== undefined && recurring.type === 'expense' && recurring.isActive) {
      try {
        await autoLinkGoalToRecurring(userId, recurring.category, id);
      } catch (linkError) {
        console.error('Error auto-linking goal after category change:', linkError);
      }
    }

    // Audit log: recurring transaction updated
    const { ipAddress, userAgent } = getRequestInfo(request.headers);
    void logAuditEvent({
      userId,
      action: AuditAction.UPDATE,
      entityType: 'RecurringTransaction',
      entityId: id,
      metadata: { fieldsUpdated: Object.keys(updateData) },
      ipAddress,
      userAgent,
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

    // Check edit permission for shared accounts
    const editPermission = await checkPermission(userId, 'canEdit');
    if (!editPermission.allowed) return editPermission.error!;

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

    // Update linked goal deadline when isActive changes
    if (recurring) {
      try {
        await updateLinkedGoalDeadline(
          id,
          recurring.amount,
          recurring.isActive
        );
      } catch (goalError) {
        console.error('Error updating linked goal after toggle:', goalError);
      }
    }

    // Audit log: recurring transaction toggled
    const { ipAddress, userAgent } = getRequestInfo(request.headers);
    void logAuditEvent({
      userId,
      action: AuditAction.UPDATE,
      entityType: 'RecurringTransaction',
      entityId: id,
      metadata: { toggled: 'isActive', newValue: body.isActive },
      ipAddress,
      userAgent,
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
  const { id } = await params;
  let userId: string | undefined;
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    userId = auth.userId;

    // Check delete permission for shared accounts
    const deletePermission = await checkPermission(userId, 'canDelete');
    if (!deletePermission.allowed) return deletePermission.error!;

    // Use shared account to allow deleting records from all members
    const sharedWhere = await withSharedAccountId(id, userId);

    // Before deleting, check if there's a linked goal and try to find an alternative
    const linkedGoal = await prisma.financialGoal.findUnique({
      where: { recurringTransactionId: id },
    });

    if (linkedGoal) {
      // Get the recurring transaction being deleted to find its category
      const recurringToDelete = await prisma.recurringTransaction.findFirst({
        where: sharedWhere,
      });

      if (recurringToDelete) {
        // Try to find another active recurring transaction with the same category
        const sharedUserIds = await getSharedUserIds(userId);
        const alternativeRecurring = await prisma.recurringTransaction.findFirst({
          where: {
            userId: { in: sharedUserIds },
            category: linkedGoal.category,
            type: 'expense',
            isActive: true,
            id: { not: id },
          },
        });

        if (alternativeRecurring) {
          const existingLink = await prisma.financialGoal.findUnique({
            where: { recurringTransactionId: alternativeRecurring.id },
          });

          if (!existingLink) {
            const newDeadline = recalculateDeadline(
              linkedGoal.targetAmount,
              linkedGoal.currentAmount,
              alternativeRecurring.amount
            );

            await prisma.financialGoal.update({
              where: { id: linkedGoal.id },
              data: {
                recurringTransactionId: alternativeRecurring.id,
                ...(newDeadline ? { deadline: newDeadline } : {}),
              },
            });
          }
        }
        // If no alternative found, goal.recurringTransactionId will be set to null by onDelete: SetNull
      }
    }

    const result = await prisma.recurringTransaction.deleteMany({
      where: sharedWhere,
    });
    
    if (result.count === 0) {
      return NextResponse.json({ error: 'Recurring transaction not found' }, { status: 404 });
    }

    // Audit log: recurring transaction deleted
    const { ipAddress, userAgent } = getRequestInfo(request.headers);
    void logAuditEvent({
      userId,
      action: AuditAction.DELETE,
      entityType: 'RecurringTransaction',
      entityId: id,
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = (error as Record<string, unknown>)?.code;
    console.error('Error deleting recurring transaction:', {
      error: errorMessage,
      code: errorCode,
      recurringTransactionId: id,
      userId,
    });
    return NextResponse.json({ error: 'Failed to delete recurring transaction' }, { status: 500 });
  }
}
