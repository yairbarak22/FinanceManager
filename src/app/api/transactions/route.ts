import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, withSharedAccount } from '@/lib/authHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { recalculateDeadline } from '@/lib/goalCalculations';
import { validateRequest } from '@/lib/validateRequest';
import { createTransactionSchema } from '@/lib/validationSchemas';

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
    
    let whereClause: Record<string, unknown> = {};
    
    if (month && month !== 'all') {
      const [year, monthNum] = month.split('-').map(Number);
      const startDate = new Date(year, monthNum - 1, 1);
      const endDate = new Date(year, monthNum, 0, 23, 59, 59);
      
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
