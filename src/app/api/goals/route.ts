import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, withSharedAccount } from '@/lib/authHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { calculateMonthlyContribution, calculateMonthlyContributionWithInterest } from '@/lib/goalCalculations';
import { validateRequest } from '@/lib/validateRequest';
import { createGoalSchema } from '@/lib/validationSchemas';

// Goal category color
const GOAL_CATEGORY_COLOR = '#0DBACC';

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
      // 1. Create RecurringTransaction with goal name
      const recurringTransaction = await tx.recurringTransaction.create({
        data: {
          userId,
          name: `חיסכון: ${goalName}`,
          type: 'expense',
          category: goalName, // Use goal name as category
          amount: monthlyContributionAmount,
          isActive: true,
        },
      });

      // 2. Create CustomCategory for the goal (if doesn't exist)
      // Use upsert to avoid duplicates
      await tx.customCategory.upsert({
        where: {
          userId_name_type: {
            userId,
            name: goalName,
            type: 'expense',
          },
        },
        update: {
          // Update color/icon if needed
          color: GOAL_CATEGORY_COLOR,
          icon: data.icon || 'Target',
        },
        create: {
          userId,
          name: goalName,
          type: 'expense',
          color: GOAL_CATEGORY_COLOR,
          icon: data.icon || 'Target',
        },
      });

      // 3. Create the FinancialGoal linked to the RecurringTransaction
      const goal = await tx.financialGoal.create({
        data: {
          userId,
          name: goalName,
          targetAmount: data.targetAmount,
          currentAmount,
          deadline,
          category: goalName, // Use goal name as category for matching transactions
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

