import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, withSharedAccount } from '@/lib/authHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { recalculateDeadline } from '@/lib/goalCalculations';
import { validateRequest } from '@/lib/validateRequest';
import { createTransactionSchema } from '@/lib/validationSchemas';
import { getFinancialMonthBounds } from '@/lib/utils';
import { expenseIdToGoalCategories } from '@/lib/goalCategoryMapping';

// Helper function to find a goal by category ID (handles both default and custom categories)
async function findGoalByCategory(userId: string, categoryId: string) {
  // 1. Direct match: goal.category === categoryId (works for preset goal keys
  //    stored as-is, e.g. "home", "saving", and for legacy rows where
  //    category was stored as the goal name)
  let goal = await prisma.financialGoal.findFirst({
    where: {
      userId,
      category: categoryId,
    },
    include: {
      recurringTransaction: true,
    },
  });

  if (goal) return goal;

  // 2. Reverse-map: the transaction's expense category ID may map to one or
  //    more goal category keys (e.g. expense "savings" → goal keys "saving", "emergency")
  const goalKeys = expenseIdToGoalCategories(categoryId);
  if (goalKeys.length > 0) {
    goal = await prisma.financialGoal.findFirst({
      where: {
        userId,
        category: { in: goalKeys },
      },
      include: {
        recurringTransaction: true,
      },
    });
    if (goal) return goal;
  }

  // 3. Custom category fallback: categoryId is a cuid — look up its name
  //    and find a goal whose name matches the custom category name
  //    (goal name drives the CustomCategory that the recurring expense uses)
  const customCategory = await prisma.customCategory.findFirst({
    where: {
      id: categoryId,
      userId,
      type: 'expense',
    },
  });

  if (customCategory) {
    goal = await prisma.financialGoal.findFirst({
      where: {
        userId,
        OR: [
          { category: customCategory.name },
          { name: customCategory.name },
        ],
      },
      include: {
        recurringTransaction: true,
      },
    });
  }

  return goal ?? null;
}

// Helper function to update goal when a transaction with matching category is created
async function updateGoalFromTransaction(
  userId: string,
  categoryId: string,
  amount: number
) {
  // Find goal with matching category (handles both default and custom categories)
  const goal = await findGoalByCategory(userId, categoryId);

  if (!goal) return null;

  // Calculate new current amount (cap at target amount)
  const newCurrentAmount = Math.min(
    goal.currentAmount + amount,
    goal.targetAmount
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

export async function GET(request: NextRequest) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    // Rate limiting
    const rateLimitResult = await checkRateLimit(`api:${userId}`, RATE_LIMITS.api);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'יותר מדי בקשות. אנא המתן ונסה שוב.' }, { status: 429 });
    }

    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get('month');
    
    // Pagination parameters (optional - backwards compatible)
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');
    const usePagination = pageParam !== null || limitParam !== null;
    
    const page = Math.max(1, parseInt(pageParam || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(limitParam || '50', 10))); // Max 100, default 50
    const skip = (page - 1) * limit;
    
    // Fetch user's custom financial month start day
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { monthStartDay: true },
    });
    const monthStartDay = user?.monthStartDay ?? 1;

    let whereClause: Record<string, unknown> = {};
    
    if (month && month !== 'all') {
      const { startDate, endDate } = getFinancialMonthBounds(month, monthStartDay);
      
      whereClause = {
        date: {
          gte: startDate,
          lte: endDate,
        },
      };
    }
    
    // Use shared account to get transactions from all members
    const sharedWhere = await withSharedAccount(userId, whereClause);
    
    // If pagination is requested, return paginated response
    if (usePagination) {
      const [transactions, total] = await Promise.all([
        prisma.transaction.findMany({
          where: sharedWhere,
          orderBy: { date: 'desc' },
          skip,
          take: limit,
        }),
        prisma.transaction.count({ where: sharedWhere }),
      ]);
      
      return NextResponse.json({
        transactions,
        pagination: {
          page,
          limit,
          total,
          hasMore: skip + transactions.length < total,
        },
      });
    }
    
    // Backwards compatible: return array directly if no pagination params
    const transactions = await prisma.transaction.findMany({
      where: sharedWhere,
      orderBy: { date: 'desc' },
    });
    
    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    // Rate limiting
    const rateLimitResult = await checkRateLimit(`api:${userId}`, RATE_LIMITS.api);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'יותר מדי בקשות. אנא המתן ונסה שוב.' }, { status: 429 });
    }

    const { data, errorResponse } = await validateRequest(request, createTransactionSchema);
    if (errorResponse) return errorResponse;

    const transaction = await prisma.transaction.create({
      data: {
        userId,
        type: data.type,
        amount: data.amount,
        currency: data.currency,
        category: data.category,
        description: data.description,
        date: new Date(data.date),
      },
    });

    // If this is an expense with a category matching a goal, update the goal
    if (data.type === 'expense') {
      try {
        await updateGoalFromTransaction(userId, data.category, data.amount);
      } catch (goalError) {
        // Log but don't fail the transaction creation
        console.error('Error updating goal from transaction:', goalError);
      }
    }
    
    return NextResponse.json(transaction);
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}
