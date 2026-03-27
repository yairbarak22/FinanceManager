// ---------------------------------------------------------------------------
// Data Aggregation for Tips System
// ---------------------------------------------------------------------------
//
// This is the ONLY function in the tips system that touches the database.
// It extends UserFinancialData with budget compliance data and net worth trend.
// After this function returns, all tip conditions and generators operate
// on a frozen in-memory snapshot.
// ---------------------------------------------------------------------------

import { prisma } from '@/lib/prisma';
import { getSharedUserIds } from '@/lib/authHelpers';
import { aggregateFinancialDataForInsights } from '@/lib/insights/aggregateFinancialData';
import { getAllCategories } from '@/lib/categories';
import type { DateRange } from '@/lib/periodicReport/types';
import type { TipEvaluationData, BudgetStatus } from '../types';

interface ExistingReportData {
  totalIncome: number;
  totalExpenses: number;
  netCashflow: number;
  fixedExpenses: number;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
}

/**
 * Aggregate all data needed for the tips and scoring engines.
 *
 * Reuses `aggregateFinancialDataForInsights()` for the base UserFinancialData,
 * then fetches additional budget and net worth data.
 */
export async function aggregateForTips(
  userId: string,
  dateRange: DateRange,
  existing: ExistingReportData
): Promise<TipEvaluationData> {
  // 1. Get base UserFinancialData (reuses existing heavy aggregation)
  const baseData = await aggregateFinancialDataForInsights(userId, dateRange, {
    totalIncome: existing.totalIncome,
    totalExpenses: existing.totalExpenses,
    netCashflow: existing.netCashflow,
    fixedExpenses: existing.fixedExpenses,
    totalAssets: existing.totalAssets,
    totalLiabilities: existing.totalLiabilities,
  });

  const userIds = await getSharedUserIds(userId);

  // 2. Fetch additional data in parallel: budgets + previous net worth
  const month = dateRange.startDate.getMonth() + 1;
  const year = dateRange.startDate.getFullYear();

  const prevMonthKey = `${month === 1 ? year - 1 : year}-${String(month === 1 ? 12 : month - 1).padStart(2, '0')}`;

  const [budgets, transactions, prevReport, customCategories] =
    await Promise.all([
      prisma.budget.findMany({
        where: { userId: { in: userIds }, month, year },
      }),
      prisma.transaction.findMany({
        where: {
          userId: { in: userIds },
          date: { gte: dateRange.startDate, lte: dateRange.endDate },
          type: 'expense',
        },
        select: { category: true, amount: true },
      }),
      prisma.monthlyReport.findFirst({
        where: { userId: { in: userIds }, monthKey: prevMonthKey },
        select: { netWorth: true },
      }),
      prisma.customCategory.findMany({
        where: { userId: { in: userIds }, type: 'expense' },
        select: { id: true, name: true },
      }),
    ]);

  // 3. Build budget statuses
  const allExpenseCategories = getAllCategories('expense');
  const categoryNameMap = new Map<string, string>();

  for (const cat of allExpenseCategories) {
    categoryNameMap.set(cat.id, cat.nameHe);
  }
  for (const cc of customCategories) {
    categoryNameMap.set(cc.id, cc.name);
  }

  // Sum actual spending per category
  const actualByCategory = new Map<string, number>();
  for (const tx of transactions) {
    actualByCategory.set(
      tx.category,
      (actualByCategory.get(tx.category) ?? 0) + tx.amount
    );
  }

  const budgetStatuses: BudgetStatus[] = budgets.map((b) => {
    const actual = actualByCategory.get(b.categoryId) ?? 0;
    const overBudgetAmount = Math.max(0, actual - b.amount);
    const utilizationRatio = b.amount > 0 ? actual / b.amount : 0;
    return {
      categoryId: b.categoryId,
      categoryName: categoryNameMap.get(b.categoryId) ?? b.categoryId,
      budgeted: b.amount,
      actual,
      overBudgetAmount,
      utilizationRatio,
    };
  });

  // 4. Compute derived fields
  const categoriesOverBudget = budgetStatuses.filter(
    (b) => b.utilizationRatio > 1.0
  ).length;

  const totalBudgeted = budgetStatuses.reduce((s, b) => s + b.budgeted, 0);
  const totalActual = budgetStatuses.reduce((s, b) => s + b.actual, 0);
  const totalBudgetUtilization =
    totalBudgeted > 0 ? totalActual / totalBudgeted : 0;

  const savingsRate =
    existing.totalIncome > 0
      ? (existing.totalIncome - existing.totalExpenses) / existing.totalIncome
      : 0;

  return {
    ...baseData,
    budgetStatuses,
    savingsRate,
    previousNetWorth: prevReport?.netWorth ?? null,
    currentNetWorth: existing.netWorth,
    categoriesOverBudget,
    totalBudgetUtilization,
  };
}
