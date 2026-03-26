import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, withSharedAccount } from '@/lib/authHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { calculateMonthlyContribution, calculateMonthlyContributionWithInterest } from '@/lib/goalCalculations';
import { validateRequest } from '@/lib/validateRequest';
import { createGoalSchema } from '@/lib/validationSchemas';
import { resolveExpenseCategoryForGoalName } from '@/lib/resolveGoalExpenseCategory';

// GET - Fetch all financial goals
export async function GET() {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    // Rate limiting
    const rateLimitResult = await checkRateLimit(`api:${userId}`, RATE_LIMITS.api);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'יותר מדי בקשות' }, { status: 429 });
    }

    // Use shared account to get goals from all members
    const sharedWhere = await withSharedAccount(userId);
    
    const goals = await prisma.financialGoal.findMany({
      where: sharedWhere,
      include: {
        recurringTransaction: true,
      },
      orderBy: { deadline: 'asc' },
    });
    
    return NextResponse.json(goals);
  } catch (error) {
    console.error('Error fetching financial goals:', error);
    return NextResponse.json({ error: 'Failed to fetch financial goals' }, { status: 500 });
  }
}

// POST - Create a new financial goal
export async function POST(request: NextRequest) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    // Rate limiting
    const rateLimitResult = await checkRateLimit(`api:${userId}`, RATE_LIMITS.api);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'יותר מדי בקשות' }, { status: 429 });
    }

    const { data, errorResponse } = await validateRequest(request, createGoalSchema);
    if (errorResponse) return errorResponse;

    const deadline = new Date(data.deadline);
    const currentAmount = data.currentAmount;
    const category = data.category;
    const goalName = data.name;

    // Calculate monthly contribution for the recurring transaction
    // If investInPortfolio is true, use interest-adjusted calculation (compound interest)
    let monthlyContributionAmount: number;
    if (data.investInPortfolio && data.expectedInterestRate && data.expectedInterestRate > 0) {
      const monthsRemaining = Math.max(1, Math.round(
        (deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30.44)
      ));
      monthlyContributionAmount = calculateMonthlyContributionWithInterest(
        data.targetAmount,
        currentAmount,
        data.expectedInterestRate,
        monthsRemaining
      );
    } else {
      monthlyContributionAmount = calculateMonthlyContribution(
        data.targetAmount,
        currentAmount,
        deadline
      );
    }

    // Use Prisma transaction to create everything atomically
    const result = await prisma.$transaction(async (tx) => {
      // Resolve expense category from the goal's name:
      // matches a default category (by id or Hebrew name), an existing custom
      // category, or creates a new one.
      const expenseCategoryId = await resolveExpenseCategoryForGoalName(
        goalName, userId, data.icon, tx,
      );

      // 1. Create RecurringTransaction with the resolved expense category
      const recurringTransaction = await tx.recurringTransaction.create({
        data: {
          userId,
          name: `חיסכון ליעד - ${goalName}`,
          type: 'expense',
          category: expenseCategoryId,
          amount: monthlyContributionAmount,
          isActive: true,
        },
      });

      // 2. Create the FinancialGoal linked to the RecurringTransaction
      const goal = await tx.financialGoal.create({
        data: {
          userId,
          name: goalName,
          targetAmount: data.targetAmount,
          currentAmount,
          deadline,
          category,
          icon: data.icon || null,
          recurringTransactionId: recurringTransaction.id,
        },
        include: {
          recurringTransaction: true,
        },
      });

      return goal;
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating financial goal:', error);
    return NextResponse.json({ error: 'Failed to create financial goal' }, { status: 500 });
  }
}

