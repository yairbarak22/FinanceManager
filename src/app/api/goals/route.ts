import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, withSharedAccount } from '@/lib/authHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { calculateMonthlyContribution, calculateMonthlyContributionWithInterest } from '@/lib/goalCalculations';

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

    const body = await request.json();
    
    // Validate required fields
    if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
      return NextResponse.json({ error: 'שם היעד הוא שדה חובה' }, { status: 400 });
    }
    
    if (body.name.length > 100) {
      return NextResponse.json({ error: 'שם היעד ארוך מדי (מקסימום 100 תווים)' }, { status: 400 });
    }
    
    if (typeof body.targetAmount !== 'number' || body.targetAmount <= 0) {
      return NextResponse.json({ error: 'סכום היעד חייב להיות מספר חיובי' }, { status: 400 });
    }
    
    if (body.targetAmount > 100000000) { // 100 million limit
      return NextResponse.json({ error: 'סכום היעד גבוה מדי' }, { status: 400 });
    }
    
    if (!body.deadline) {
      return NextResponse.json({ error: 'תאריך יעד הוא שדה חובה' }, { status: 400 });
    }
    
    const deadline = new Date(body.deadline);
    if (isNaN(deadline.getTime())) {
      return NextResponse.json({ error: 'תאריך יעד לא תקין' }, { status: 400 });
    }
    
    // Optional fields validation
    const currentAmount = body.currentAmount ?? 0;
    if (typeof currentAmount !== 'number' || currentAmount < 0) {
      return NextResponse.json({ error: 'סכום נוכחי חייב להיות מספר חיובי או אפס' }, { status: 400 });
    }
    
    const category = body.category || 'saving';
    if (category.length > 50) {
      return NextResponse.json({ error: 'קטגוריה ארוכה מדי' }, { status: 400 });
    }

    const goalName = body.name.trim();

    // Calculate monthly contribution for the recurring transaction
    // If investInPortfolio is true, use interest-adjusted calculation (compound interest)
    let monthlyContributionAmount: number;
    if (body.investInPortfolio && body.expectedInterestRate > 0) {
      const monthsRemaining = Math.max(1, Math.round(
        (deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30.44)
      ));
      monthlyContributionAmount = calculateMonthlyContributionWithInterest(
        body.targetAmount,
        currentAmount,
        body.expectedInterestRate,
        monthsRemaining
      );
    } else {
      monthlyContributionAmount = calculateMonthlyContribution(
        body.targetAmount,
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
          icon: body.icon || 'Target',
        },
        create: {
          userId,
          name: goalName,
          type: 'expense',
          color: GOAL_CATEGORY_COLOR,
          icon: body.icon || 'Target',
        },
      });

      // 3. Create the FinancialGoal linked to the RecurringTransaction
      const goal = await tx.financialGoal.create({
        data: {
          userId,
          name: goalName,
          targetAmount: body.targetAmount,
          currentAmount,
          deadline,
          category: goalName, // Use goal name as category for matching transactions
          icon: body.icon || null,
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

