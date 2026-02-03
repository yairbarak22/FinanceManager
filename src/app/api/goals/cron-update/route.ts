import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { recalculateDeadline } from '@/lib/goalCalculations';

/**
 * GET /api/goals/cron-update
 * Updates all goals based on their linked recurring transactions
 * Should be called monthly by a cron job
 * 
 * Security: Protected by CRON_SECRET environment variable
 */
export async function GET(request: NextRequest) {
  try {
    // Check for cron secret (security measure)
    const { searchParams } = new URL(request.url);
    const cronSecret = searchParams.get('secret');
    const expectedSecret = process.env.CRON_SECRET;

    // If CRON_SECRET is set, require it
    if (expectedSecret && cronSecret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find all goals with active linked recurring transactions
    const goalsWithRecurring = await prisma.financialGoal.findMany({
      where: {
        recurringTransactionId: { not: null },
        recurringTransaction: {
          isActive: true,
        },
      },
      include: {
        recurringTransaction: true,
      },
    });

    // Filter goals that haven't reached their target (can't do column comparison in Prisma)
    const activeGoals = goalsWithRecurring.filter(
      goal => goal.currentAmount < goal.targetAmount
    );

    let updatedCount = 0;
    const updates = [];

    for (const goal of activeGoals) {
      if (!goal.recurringTransaction) continue;

      const monthlyContribution = goal.recurringTransaction.amount;
      
      // Calculate new current amount (cap at target amount)
      const newCurrentAmount = Math.min(
        goal.currentAmount + monthlyContribution,
        goal.targetAmount
      );

      // Recalculate deadline
      const newDeadline = recalculateDeadline(
        goal.targetAmount,
        newCurrentAmount,
        monthlyContribution
      );

      updates.push(
        prisma.financialGoal.update({
          where: { id: goal.id },
          data: {
            currentAmount: newCurrentAmount,
            ...(newDeadline ? { deadline: newDeadline } : {}),
          },
        })
      );

      updatedCount++;
    }

    // Execute all updates in a transaction
    if (updates.length > 0) {
      await prisma.$transaction(updates);
    }

    return NextResponse.json({
      success: true,
      updatedCount,
      message: `Updated ${updatedCount} goals from recurring transactions`,
    });
  } catch (error) {
    console.error('Error in cron goal update:', error);
    return NextResponse.json(
      { error: 'Failed to update goals' },
      { status: 500 }
    );
  }
}

