import { prisma } from '@/lib/prisma';
import { getSharedUserIds } from '@/lib/authHelpers';
import { getMonthKey } from '@/lib/utils';
import {
  getRemainingBalance,
  getEffectiveMonthlyExpense,
  isLiabilityActiveInCashFlow,
} from '@/lib/loanCalculations';
import { getCategoryInfo } from '@/lib/categories';
import type { Transaction, Liability, Asset } from '@/lib/types';

export interface CategoryBreakdownItem {
  category: string;
  categoryName: string;
  amount: number;
  percentage: number;
  changeFromPrev: number | null; // null = first month
}

export interface GoalProgressItem {
  goalId: string;
  name: string;
  target: number;
  current: number;
  percentage: number;
}

export interface MonthlyReportData {
  monthKey: string;
  totalIncome: number;
  totalExpenses: number;
  netCashflow: number;
  categoryBreakdown: CategoryBreakdownItem[];
  goalsProgress: GoalProgressItem[];
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  transactions: Transaction[];
  isFirstMonth: boolean;
}

function getPreviousMonthKey(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  const prevDate = new Date(year, month - 2, 1);
  return `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
}

export async function calculateMonthlyReport(
  userId: string,
  monthKey: string
): Promise<MonthlyReportData> {
  const userIds = await getSharedUserIds(userId);
  const prevMonthKey = getPreviousMonthKey(monthKey);
  const monthDate = new Date(
    parseInt(monthKey.split('-')[0]),
    parseInt(monthKey.split('-')[1]) - 1,
    1
  );

  // Parallel data fetches
  const [
    transactions,
    recurringTransactions,
    liabilities,
    assets,
    goals,
    customCategories,
    prevReport,
    existingReportsCount,
  ] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId: { in: userIds } },
      orderBy: { date: 'desc' },
    }),
    prisma.recurringTransaction.findMany({
      where: { userId: { in: userIds }, isActive: true },
    }),
    prisma.liability.findMany({
      where: { userId: { in: userIds } },
      include: { tracks: true },
    }),
    prisma.asset.findMany({
      where: { userId: { in: userIds } },
    }),
    prisma.financialGoal.findMany({
      where: { userId: { in: userIds } },
      include: { recurringTransaction: true },
    }),
    prisma.customCategory.findMany({
      where: { userId: { in: userIds } },
    }),
    prisma.monthlyReport.findFirst({
      where: { userId, monthKey: prevMonthKey },
      select: { categoryBreakdown: true },
    }),
    prisma.monthlyReport.count({
      where: { userId },
    }),
  ]);

  const isFirstMonth = existingReportsCount === 0;

  // Filter transactions for this month
  const monthTransactions = transactions.filter(
    (tx) => getMonthKey(tx.date) === monthKey
  );

  // Map custom categories to CategoryInfo format
  const customCategoryInfos = customCategories.map((cc) => ({
    id: cc.id,
    name: cc.name,
    nameHe: cc.name,
    icon: undefined as unknown as import('lucide-react').LucideIcon,
    color: cc.color || '#BDBDCB',
    bgColor: 'bg-slate-100',
    textColor: 'text-slate-600',
    isCustom: true,
  }));

  // Helper to check if recurring is active in month
  const isActiveInMonth = (r: typeof recurringTransactions[number]) => {
    if (!r.isActive) return false;
    const activeMonths = r.activeMonths as string[] | null;
    if (!activeMonths || activeMonths.length === 0) return true;
    return activeMonths.includes(monthKey);
  };

  // Calculate income
  const txIncome = monthTransactions
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const fixedIncome = recurringTransactions
    .filter((r) => r.type === 'income' && isActiveInMonth(r))
    .reduce((sum, r) => sum + r.amount, 0);

  // Calculate expenses
  const txExpenses = monthTransactions
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const fixedExpenses = recurringTransactions
    .filter((r) => r.type === 'expense' && isActiveInMonth(r))
    .reduce((sum, r) => sum + r.amount, 0);

  const typedLiabilities = liabilities as unknown as Liability[];
  const monthlyLiabilityPayments = typedLiabilities
    .filter((l) => isLiabilityActiveInCashFlow(l, monthDate))
    .reduce((sum, l) => sum + getEffectiveMonthlyExpense(l, monthDate), 0);

  const totalIncome = txIncome + fixedIncome;
  const totalExpenses = txExpenses + fixedExpenses + monthlyLiabilityPayments;
  const netCashflow = totalIncome - totalExpenses;

  // Category breakdown
  const expensesByCategory: Record<string, number> = {};

  monthTransactions
    .filter((tx) => tx.type === 'expense')
    .forEach((tx) => {
      expensesByCategory[tx.category] =
        (expensesByCategory[tx.category] || 0) + tx.amount;
    });

  recurringTransactions
    .filter((r) => r.type === 'expense' && isActiveInMonth(r))
    .forEach((r) => {
      expensesByCategory[r.category] =
        (expensesByCategory[r.category] || 0) + r.amount;
    });

  // Build previous month category map for comparison
  const prevCategoryMap: Record<string, number> = {};
  if (prevReport?.categoryBreakdown && Array.isArray(prevReport.categoryBreakdown)) {
    (prevReport.categoryBreakdown as unknown as CategoryBreakdownItem[]).forEach((item) => {
      prevCategoryMap[item.category] = item.amount;
    });
  }

  const categoryBreakdown: CategoryBreakdownItem[] = Object.entries(
    expensesByCategory
  )
    .map(([category, amount]) => {
      const catInfo = getCategoryInfo(category, 'expense', customCategoryInfos);
      const prevAmount = prevCategoryMap[category];
      let changeFromPrev: number | null = null;

      if (!isFirstMonth && prevAmount !== undefined && prevAmount > 0) {
        changeFromPrev = ((amount - prevAmount) / prevAmount) * 100;
      }

      return {
        category,
        categoryName: catInfo?.nameHe || category,
        amount,
        percentage:
          totalExpenses > 0
            ? Math.round((amount / totalExpenses) * 100)
            : 0,
        changeFromPrev:
          changeFromPrev !== null ? Math.round(changeFromPrev) : null,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  // Goals progress
  const goalsProgress: GoalProgressItem[] = goals.map((goal) => {
    const percentage =
      goal.targetAmount > 0
        ? Math.round((goal.currentAmount / goal.targetAmount) * 100)
        : 0;

    return {
      goalId: goal.id,
      name: goal.name,
      target: goal.targetAmount,
      current: goal.currentAmount,
      percentage,
    };
  });

  // Net worth
  const totalAssets = (assets as unknown as Asset[]).reduce(
    (sum, a) => sum + a.value,
    0
  );
  const totalLiabilitiesVal = typedLiabilities.reduce(
    (sum, l) => sum + getRemainingBalance(l, monthDate),
    0
  );
  const netWorth = totalAssets - totalLiabilitiesVal;

  // Format transactions for response
  const formattedTransactions: Transaction[] = monthTransactions.map((tx) => ({
    id: tx.id,
    type: tx.type as 'income' | 'expense',
    amount: tx.amount,
    category: tx.category,
    description: tx.description,
    date: tx.date.toISOString(),
  }));

  return {
    monthKey,
    totalIncome,
    totalExpenses,
    netCashflow,
    categoryBreakdown,
    goalsProgress,
    netWorth,
    totalAssets,
    totalLiabilities: totalLiabilitiesVal,
    transactions: formattedTransactions,
    isFirstMonth,
  };
}

export interface UpcomingObligation {
  name: string;
  type: string; // 'loan' | 'mortgage' | 'gemach'
  monthlyPayment: number;
  remainingBalance: number;
  endDate: string | null;
  isEndingSoon: boolean;
}

/**
 * Calculate upcoming obligations (active liabilities with future payments)
 */
export async function calculateUpcomingObligations(
  userId: string,
  monthKey: string
): Promise<UpcomingObligation[]> {
  const userIds = await getSharedUserIds(userId);
  const monthDate = new Date(
    parseInt(monthKey.split('-')[0]),
    parseInt(monthKey.split('-')[1]) - 1,
    1
  );

  const liabilities = await prisma.liability.findMany({
    where: { userId: { in: userIds } },
    include: { tracks: true },
  });

  const typedLiabilities = liabilities as unknown as Liability[];

  return typedLiabilities
    .filter((l) => isLiabilityActiveInCashFlow(l, monthDate))
    .map((l) => {
      const monthlyPayment = getEffectiveMonthlyExpense(l, monthDate);
      const remainingBalance = getRemainingBalance(l, monthDate);

      let endDate: string | null = null;
      let isEndingSoon = false;

      if (l.loanTermMonths && l.startDate) {
        const start = new Date(l.startDate);
        const end = new Date(start);
        end.setMonth(end.getMonth() + l.loanTermMonths);
        endDate = end.toISOString();

        const monthsLeft =
          (end.getFullYear() - monthDate.getFullYear()) * 12 +
          (end.getMonth() - monthDate.getMonth());
        isEndingSoon = monthsLeft > 0 && monthsLeft <= 6;
      }

      let type = 'loan';
      if (l.isMortgage) type = 'mortgage';
      else if (l.gemachId) type = 'gemach';

      return {
        name: l.name,
        type,
        monthlyPayment,
        remainingBalance,
        endDate,
        isEndingSoon,
      };
    })
    .filter((o) => o.monthlyPayment > 0);
}

/**
 * Fetch category history from the last N reports for comparison
 */
export async function fetchCategoryHistory(
  userId: string,
  monthKey: string,
  count = 3
): Promise<{ monthKey: string; categories: CategoryBreakdownItem[] }[]> {
  const reports = await prisma.monthlyReport.findMany({
    where: {
      userId,
      monthKey: { lte: monthKey },
    },
    select: {
      monthKey: true,
      categoryBreakdown: true,
    },
    orderBy: { monthKey: 'desc' },
    take: count,
  });

  return reports.reverse().map((r) => ({
    monthKey: r.monthKey,
    categories: r.categoryBreakdown as unknown as CategoryBreakdownItem[],
  }));
}

/**
 * Fetch net worth timeline from existing reports (real-time query, not stored in DB)
 */
export async function fetchNetWorthTimeline(
  userId: string,
  monthKey: string,
  count = 6
): Promise<{ monthKey: string; netWorth: number }[]> {
  const reports = await prisma.monthlyReport.findMany({
    where: {
      userId,
      monthKey: { lte: monthKey },
    },
    select: {
      monthKey: true,
      netWorth: true,
    },
    orderBy: { monthKey: 'desc' },
    take: count,
  });

  return reports.reverse();
}
