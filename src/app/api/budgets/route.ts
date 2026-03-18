import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, withSharedAccount } from '@/lib/authHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { validateRequest } from '@/lib/validateRequest';
import { createBudgetSchema } from '@/lib/validationSchemas';
import { getFinancialMonthBounds, isRecurringActiveInMonth, getAmountInILS } from '@/lib/utils';
import { getUsdIlsRate } from '@/lib/finance/marketService';

export async function GET(request: NextRequest) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const rateLimitResult = await checkRateLimit(`api:${userId}`, RATE_LIMITS.api);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'יותר מדי בקשות. אנא המתן ונסה שוב.' }, { status: 429 });
    }

    const searchParams = request.nextUrl.searchParams;
    const monthParam = searchParams.get('month');
    const yearParam = searchParams.get('year');

    if (!monthParam || !yearParam) {
      return NextResponse.json({ error: 'month and year are required' }, { status: 400 });
    }

    const month = parseInt(monthParam, 10);
    const year = parseInt(yearParam, 10);

    if (month < 1 || month > 12 || year < 2020 || year > 2100) {
      return NextResponse.json({ error: 'Invalid month or year' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { monthStartDay: true },
    });
    const monthStartDay = user?.monthStartDay ?? 1;

    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    const { startDate, endDate } = getFinancialMonthBounds(monthKey, monthStartDay);

    const budgetWhere = await withSharedAccount(userId, { month, year });
    const expenseWhere = await withSharedAccount(userId, {
      type: 'expense',
      date: { gte: startDate, lte: endDate },
    });

    const recurringWhere = await withSharedAccount(userId, {
      type: 'expense',
      isActive: true,
    });

    const [budgets, expenseAggregation, recurringExpenses, exchangeRate] = await Promise.all([
      prisma.budget.findMany({ where: budgetWhere }),
      prisma.transaction.groupBy({
        by: ['category'],
        where: expenseWhere,
        _sum: { amount: true },
      }),
      prisma.recurringTransaction.findMany({
        where: recurringWhere,
        select: { amount: true, currency: true, category: true, isActive: true, activeMonths: true },
      }),
      getUsdIlsRate(),
    ]);

    const spendingMap = new Map<string, number>();
    for (const row of expenseAggregation) {
      spendingMap.set(row.category, row._sum.amount || 0);
    }

    for (const r of recurringExpenses) {
      const activeMonths = Array.isArray(r.activeMonths) ? r.activeMonths as string[] : null;
      if (!isRecurringActiveInMonth({ isActive: r.isActive, activeMonths }, monthKey)) continue;
      const amountILS = getAmountInILS(r.amount, (r.currency as string) || 'ILS', exchangeRate);
      spendingMap.set(r.category, (spendingMap.get(r.category) || 0) + amountILS);
    }

    const budgetedCategoryIds = new Set(budgets.map(b => b.categoryId));

    const budgetsWithSpending = budgets.map(budget => {
      const spent = spendingMap.get(budget.categoryId) || 0;
      const remaining = budget.amount - spent;
      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
      return {
        ...budget,
        spent,
        remaining,
        percentage: Math.round(percentage * 10) / 10,
      };
    });

    const unbudgetedExpenses: Array<{ categoryId: string; totalSpent: number }> = [];
    for (const [categoryId, totalSpent] of spendingMap) {
      if (!budgetedCategoryIds.has(categoryId)) {
        unbudgetedExpenses.push({ categoryId, totalSpent });
      }
    }

    const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
    const totalSpent = budgetsWithSpending.reduce((sum, b) => sum + b.spent, 0);
    const totalRemaining = totalBudget - totalSpent;
    const overallPercentage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 1000) / 10 : 0;

    const response = NextResponse.json({
      totalBudget,
      totalSpent,
      totalRemaining,
      overallPercentage,
      budgets: budgetsWithSpending,
      unbudgetedExpenses,
    });

    response.headers.set('Cache-Control', 'private, no-store');
    return response;
  } catch (error) {
    console.error('Error fetching budgets:', error);
    return NextResponse.json({ error: 'Failed to fetch budgets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const rateLimitResult = await checkRateLimit(`api:${userId}`, RATE_LIMITS.api);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'יותר מדי בקשות. אנא המתן ונסה שוב.' }, { status: 429 });
    }

    const { data, errorResponse } = await validateRequest(request, createBudgetSchema);
    if (errorResponse) return errorResponse;

    const budget = await prisma.budget.upsert({
      where: {
        userId_categoryId_month_year: {
          userId,
          categoryId: data.categoryId,
          month: data.month,
          year: data.year,
        },
      },
      update: { amount: data.amount },
      create: {
        userId,
        categoryId: data.categoryId,
        amount: data.amount,
        month: data.month,
        year: data.year,
      },
    });

    return NextResponse.json(budget);
  } catch (error) {
    console.error('Error creating/updating budget:', error);
    return NextResponse.json({ error: 'Failed to save budget' }, { status: 500 });
  }
}
