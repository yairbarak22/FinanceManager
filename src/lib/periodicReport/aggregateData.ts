import { prisma } from '@/lib/prisma';
import { getSharedUserIds } from '@/lib/authHelpers';
import {
  getRemainingBalance,
  getEffectiveMonthlyExpense,
  isLiabilityActiveInCashFlow,
} from '@/lib/loanCalculations';
import { getCategoryInfo, type CategoryInfo } from '@/lib/categories';
import {
  calculateGoalStatus,
  calculateMonthlyContribution,
  getMonthsUntilDeadline,
} from '@/lib/goalCalculations';
import { getMonthKey } from '@/lib/utils';
import { getCurrentMonthKey } from '@/lib/assetHistory';
import type { Liability } from '@/lib/types';
import type {
  DateRange,
  CashFlowData,
  TopExpenseItem,
  TopIncomeItem,
  FixedIncomeItem,
  VariableIncomeItem,
  FixedExpenseItem,
  VariableExpenseItem,
  CashFlowComparison,
  MonthOverMonthComparison,
  PeriodicReportData,
  PeriodInfo,
  AssetBreakdownItem,
  LiabilityBreakdownItem,
  GoalStatus,
  ProjectionData,
  TradingPortfolioData,
} from './types';

// ---------------------------------------------------------------------------
// Asset category → logical group mapping
// ---------------------------------------------------------------------------

const ASSET_GROUP_MAP: Record<string, string> = {
  cash: 'liquid',
  savings_account: 'liquid',
  stocks: 'capital_market',
  crypto: 'capital_market',
  investments: 'capital_market',
  pension_fund: 'pension',
  education_fund: 'pension',
  real_estate: 'real_estate',
  vehicle: 'other',
  gemach: 'other',
};

const ASSET_GROUP_NAMES: Record<string, string> = {
  liquid: 'עו"ש ונזילים',
  capital_market: 'שוק ההון',
  pension: 'קופות גמל והשתלמות',
  real_estate: 'נדל"ן',
  other: 'אחר',
};

const LIABILITY_GROUP_MAP: Record<string, string> = {
  mortgage: 'mortgage',
  loan: 'loans',
  car_loan: 'loans',
  student_loan: 'loans',
  gemach: 'loans',
  credit_card: 'credit_card',
};

const LIABILITY_GROUP_NAMES: Record<string, string> = {
  mortgage: 'משכנתא',
  loans: 'הלוואות',
  credit_card: 'כרטיס אשראי',
  other: 'אחר',
};

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function aggregatePeriodicReportData(
  userId: string,
  dateRange: DateRange,
  periodInfo: PeriodInfo
): Promise<PeriodicReportData> {
  const userIds = await getSharedUserIds(userId);
  const { startDate, endDate } = dateRange;

  const [
    transactions,
    recurringTransactions,
    liabilities,
    assets,
    customCategories,
    holdings,
    goals,
  ] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        userId: { in: userIds },
        date: { gte: startDate, lte: endDate },
      },
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
    prisma.customCategory.findMany({
      where: { userId: { in: userIds } },
    }),
    prisma.holding.findMany({
      where: { userId: { in: userIds } },
    }),
    prisma.financialGoal.findMany({
      where: { userId: { in: userIds } },
      include: { recurringTransaction: true },
    }),
  ]);

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

  const monthKeysInRange = getMonthKeysInDateRange(startDate, endDate);
  const monthDate = new Date(endDate);

  const isActiveInRange = (r: typeof recurringTransactions[number]) => {
    if (!r.isActive) return false;
    const activeMonths = r.activeMonths as string[] | null;
    if (!activeMonths || activeMonths.length === 0) return true;
    return monthKeysInRange.some((mk) => activeMonths.includes(mk));
  };

  // --- Cash Flow ---
  const transactionIncome = transactions
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const fixedIncome = recurringTransactions
    .filter((r) => r.type === 'income' && isActiveInRange(r))
    .reduce((sum, r) => sum + r.amount, 0);

  const transactionExpenses = transactions
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const fixedExpenses = recurringTransactions
    .filter((r) => r.type === 'expense' && isActiveInRange(r))
    .reduce((sum, r) => sum + r.amount, 0);

  const typedLiabilities = liabilities as unknown as Liability[];
  const liabilityPayments = typedLiabilities
    .filter((l) => isLiabilityActiveInCashFlow(l, monthDate))
    .reduce((sum, l) => sum + getEffectiveMonthlyExpense(l, monthDate), 0);

  const totalIncome = transactionIncome + fixedIncome;
  const totalExpenses = transactionExpenses + fixedExpenses + liabilityPayments;
  const netCashflow = totalIncome - totalExpenses;

  const cashFlow: CashFlowData = {
    totalIncome,
    totalExpenses,
    netCashflow,
    transactionIncome,
    fixedIncome,
    transactionExpenses,
    fixedExpenses,
    liabilityPayments,
  };

  // --- Top Expenses by Category (with MoM) ---
  const expensesByCategory: Record<string, number> = {};

  transactions
    .filter((tx) => tx.type === 'expense')
    .forEach((tx) => {
      expensesByCategory[tx.category] =
        (expensesByCategory[tx.category] || 0) + tx.amount;
    });

  recurringTransactions
    .filter((r) => r.type === 'expense' && isActiveInRange(r))
    .forEach((r) => {
      expensesByCategory[r.category] =
        (expensesByCategory[r.category] || 0) + r.amount;
    });

  const [prevExpenseBreakdown, prevIncomeBreakdown, lastYearExpenseBreakdown, lastYearIncomeBreakdown] =
    await Promise.all([
      getPreviousMonthCategoryBreakdown(userIds, startDate, 'expense'),
      getPreviousMonthCategoryBreakdown(userIds, startDate, 'income'),
      getLastYearCategoryBreakdown(userIds, startDate, endDate, 'expense'),
      getLastYearCategoryBreakdown(userIds, startDate, endDate, 'income'),
    ]);

  const topExpenses: TopExpenseItem[] = Object.entries(expensesByCategory)
    .map(([category, amount]) => {
      const catInfo = getCategoryInfo(category, 'expense', customCategoryInfos);
      const prevAmount = prevExpenseBreakdown[category] ?? null;
      let momChangePercent: number | null = null;
      if (prevAmount !== null && prevAmount > 0) {
        momChangePercent = Math.round(
          ((amount - prevAmount) / prevAmount) * 100
        );
      }
      return {
        category,
        categoryName: catInfo?.nameHe || category,
        amount,
        percentage:
          totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
        momChangePercent,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  // --- Top Income by Category (with MoM) ---
  const incomeByCategory: Record<string, number> = {};

  transactions
    .filter((tx) => tx.type === 'income')
    .forEach((tx) => {
      incomeByCategory[tx.category] =
        (incomeByCategory[tx.category] || 0) + tx.amount;
    });

  recurringTransactions
    .filter((r) => r.type === 'income' && isActiveInRange(r))
    .forEach((r) => {
      incomeByCategory[r.category] =
        (incomeByCategory[r.category] || 0) + r.amount;
    });

  const topIncomes: TopIncomeItem[] = Object.entries(incomeByCategory)
    .map(([category, amount]) => {
      const catInfo = getCategoryInfo(category, 'income', customCategoryInfos);
      const prevAmount = prevIncomeBreakdown[category] ?? null;
      let momChangePercent: number | null = null;
      if (prevAmount !== null && prevAmount > 0) {
        momChangePercent = Math.round(
          ((amount - prevAmount) / prevAmount) * 100
        );
      }
      return {
        category,
        categoryName: catInfo?.nameHe || category,
        amount,
        percentage:
          totalIncome > 0 ? Math.round((amount / totalIncome) * 100) : 0,
        momChangePercent,
      };
    })
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);

  // --- Fixed vs Variable Income ---
  const fixedIncomeByCategory: Record<string, number> = {};
  recurringTransactions
    .filter((r) => r.type === 'income' && isActiveInRange(r))
    .forEach((r) => {
      const catInfo = getCategoryInfo(r.category, 'income', customCategoryInfos);
      const name = catInfo?.nameHe || r.category;
      fixedIncomeByCategory[name] = (fixedIncomeByCategory[name] || 0) + r.amount;
    });

  const fixedIncomeItems: FixedIncomeItem[] = Object.entries(fixedIncomeByCategory)
    .map(([name, amount]) => ({
      name,
      amount,
      percentage: totalIncome > 0 ? Math.round((amount / totalIncome) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const variableIncomeByCategory: Record<string, number> = {};
  transactions
    .filter((tx) => tx.type === 'income')
    .forEach((tx) => {
      const catInfo = getCategoryInfo(tx.category, 'income', customCategoryInfos);
      const name = catInfo?.nameHe || tx.category;
      variableIncomeByCategory[name] = (variableIncomeByCategory[name] || 0) + tx.amount;
    });

  const prevVariableIncomeByName = convertBreakdownToHebrewNames(
    prevIncomeBreakdown,
    customCategoryInfos,
    'income'
  );
  const lastYearVariableIncomeByName = convertBreakdownToHebrewNames(
    lastYearIncomeBreakdown,
    customCategoryInfos,
    'income'
  );

  const variableIncomeItems: VariableIncomeItem[] = Object.entries(variableIncomeByCategory)
    .map(([name, amount]) => ({
      name,
      amount,
      percentage: totalIncome > 0 ? Math.round((amount / totalIncome) * 100) : 0,
      prevMonthAmount: prevVariableIncomeByName[name] ?? null,
      lastYearAmount: lastYearVariableIncomeByName[name] ?? null,
    }))
    .sort((a, b) => b.amount - a.amount);

  // --- Fixed vs Variable Expenses ---
  const fixedByCategory: Record<string, number> = {};
  recurringTransactions
    .filter((r) => r.type === 'expense' && isActiveInRange(r))
    .forEach((r) => {
      const catInfo = getCategoryInfo(r.category, 'expense', customCategoryInfos);
      const name = catInfo?.nameHe || r.category;
      fixedByCategory[name] = (fixedByCategory[name] || 0) + r.amount;
    });
  typedLiabilities
    .filter((l) => isLiabilityActiveInCashFlow(l, monthDate))
    .forEach((l) => {
      const payment = getEffectiveMonthlyExpense(l, monthDate);
      if (payment > 0) {
        fixedByCategory[l.name] = (fixedByCategory[l.name] || 0) + payment;
      }
    });

  const fixedExpenseItems: FixedExpenseItem[] = Object.entries(fixedByCategory)
    .map(([name, amount]) => ({
      name,
      amount,
      percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const variableByCategory: Record<string, number> = {};
  transactions
    .filter((tx) => tx.type === 'expense')
    .forEach((tx) => {
      const catInfo = getCategoryInfo(tx.category, 'expense', customCategoryInfos);
      const name = catInfo?.nameHe || tx.category;
      variableByCategory[name] = (variableByCategory[name] || 0) + tx.amount;
    });

  const prevVariableByName = convertBreakdownToHebrewNames(
    prevExpenseBreakdown,
    customCategoryInfos
  );
  const lastYearVariableByName = convertBreakdownToHebrewNames(
    lastYearExpenseBreakdown,
    customCategoryInfos
  );

  const variableExpenseItems: VariableExpenseItem[] = Object.entries(variableByCategory)
    .map(([name, amount]) => ({
      name,
      amount,
      percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
      prevMonthAmount: prevVariableByName[name] ?? null,
      lastYearAmount: lastYearVariableByName[name] ?? null,
    }))
    .sort((a, b) => b.amount - a.amount);

  // --- Cash Flow Comparison (prev month + same month last year) ---
  const cashFlowComparison = await calculateCashFlowComparison(userIds, startDate);

  // --- Net Worth ---
  const currentMonth = getCurrentMonthKey();
  const endMonthKey = getMonthKey(endDate);
  const isCurrentMonth = endMonthKey === currentMonth;

  let totalAssets: number;
  if (isCurrentMonth) {
    totalAssets = assets.reduce((sum, a) => sum + a.value, 0);
  } else {
    const historyRecords = await prisma.assetValueHistory.findMany({
      where: {
        asset: { userId: { in: userIds } },
        monthKey: endMonthKey,
      },
    });
    totalAssets = historyRecords.reduce((sum, r) => sum + r.value, 0);
  }

  const holdingsTotal = holdings.reduce((sum, h) => sum + h.currentValue, 0);
  totalAssets += holdingsTotal;

  const totalLiabilities = typedLiabilities.reduce(
    (sum, l) => sum + getRemainingBalance(l, monthDate),
    0
  );

  const netWorth = totalAssets - totalLiabilities;

  // --- Month-over-month Comparison ---
  const monthOverMonth = await calculateMonthOverMonth(
    userIds,
    dateRange,
    { netWorth, totalIncome, totalExpenses, netCashflow }
  );

  // --- Asset Breakdown & Trading Portfolio ---
  const { assetBreakdown, tradingPortfolio } = buildAssetBreakdown(assets, holdings, netCashflow);

  // --- Liability Breakdown ---
  const liabilityBreakdown = buildLiabilityBreakdown(
    typedLiabilities,
    monthDate
  );

  // --- Goals ---
  const goalsStatus = buildGoalsStatus(goals, monthKeysInRange);

  // --- Projections ---
  const projections = buildProjections(
    recurringTransactions,
    typedLiabilities,
    endDate
  );

  return {
    period: periodInfo,
    netWorth,
    totalAssets,
    totalLiabilities,
    cashFlow,
    topExpenses,
    topIncomes,
    fixedIncomeItems,
    variableIncomeItems,
    fixedExpenseItems,
    variableExpenseItems,
    cashFlowComparison,
    monthOverMonth,
    assetBreakdown,
    liabilityBreakdown,
    goals: goalsStatus,
    projections,
    tradingPortfolio,
  };
}

// ---------------------------------------------------------------------------
// Asset breakdown
// ---------------------------------------------------------------------------

function buildAssetBreakdown(
  assets: { name: string; value: number; category: string }[],
  holdings: { name: string; currentValue: number }[],
  freeCashFlow: number
): { assetBreakdown: AssetBreakdownItem[]; tradingPortfolio: TradingPortfolioData } {
  const groups: Record<
    string,
    { items: { name: string; value: number }[]; total: number }
  > = {};

  for (const asset of assets) {
    const groupKey = ASSET_GROUP_MAP[asset.category] || 'other';
    if (!groups[groupKey]) groups[groupKey] = { items: [], total: 0 };
    groups[groupKey].items.push({ name: asset.name, value: asset.value });
    groups[groupKey].total += asset.value;
  }

  const tradingHoldings = holdings.map((h) => ({
    name: h.name,
    value: h.currentValue,
  }));
  const holdingsTotal = holdings.reduce((sum, h) => sum + h.currentValue, 0);

  const tradingPortfolio: TradingPortfolioData = {
    holdings: tradingHoldings.sort((a, b) => b.value - a.value),
    totalValue: holdingsTotal,
    hasHoldings: tradingHoldings.length > 0,
    freeCashFlow,
  };

  const order = ['liquid', 'capital_market', 'pension', 'real_estate', 'other'];
  const assetBreakdown = order
    .filter((key) => groups[key] && groups[key].total > 0)
    .map((key) => ({
      group: key,
      groupNameHe: ASSET_GROUP_NAMES[key] || 'אחר',
      items: groups[key].items.sort((a, b) => b.value - a.value),
      total: groups[key].total,
    }));

  return { assetBreakdown, tradingPortfolio };
}

// ---------------------------------------------------------------------------
// Liability breakdown
// ---------------------------------------------------------------------------

function buildLiabilityBreakdown(
  liabilities: Liability[],
  asOfDate: Date
): LiabilityBreakdownItem[] {
  const groups: Record<
    string,
    { items: { name: string; value: number }[]; total: number }
  > = {};

  for (const l of liabilities) {
    const balance = getRemainingBalance(l, asOfDate);
    if (balance <= 0) continue;
    const groupKey = LIABILITY_GROUP_MAP[l.type] || 'other';
    if (!groups[groupKey]) groups[groupKey] = { items: [], total: 0 };
    groups[groupKey].items.push({ name: l.name, value: balance });
    groups[groupKey].total += balance;
  }

  const order = ['mortgage', 'loans', 'credit_card', 'other'];
  return order
    .filter((key) => groups[key] && groups[key].total > 0)
    .map((key) => ({
      group: key,
      groupNameHe: LIABILITY_GROUP_NAMES[key] || 'אחר',
      items: groups[key].items.sort((a, b) => b.value - a.value),
      total: groups[key].total,
    }));
}

// ---------------------------------------------------------------------------
// Goals
// ---------------------------------------------------------------------------

function buildGoalsStatus(
  goals: {
    name: string;
    targetAmount: number;
    currentAmount: number;
    deadline: Date;
    recurringTransaction?: {
      amount: number;
      isActive: boolean;
      activeMonths: unknown;
    } | null;
  }[],
  monthKeysInRange: string[]
): GoalStatus[] {
  return goals.map((g) => {
    const percentage =
      g.targetAmount > 0
        ? Math.round((g.currentAmount / g.targetAmount) * 100)
        : 0;
    const monthlyContribution = g.recurringTransaction?.amount ?? 0;
    const status = calculateGoalStatus(
      g.targetAmount,
      g.currentAmount,
      g.deadline,
      monthlyContribution || undefined
    );

    const rt = g.recurringTransaction;
    let contributedThisMonth = false;
    if (rt && rt.isActive) {
      const activeMonths = rt.activeMonths as string[] | null;
      if (!activeMonths || activeMonths.length === 0) {
        contributedThisMonth = true;
      } else {
        contributedThisMonth = monthKeysInRange.some((mk) =>
          activeMonths.includes(mk)
        );
      }
    }

    const requiredMonthly = calculateMonthlyContribution(
      g.targetAmount,
      g.currentAmount,
      g.deadline
    );

    const monthsRemaining = getMonthsUntilDeadline(g.deadline);

    let projectedCompletionDate: string | null = null;
    if (monthlyContribution > 0 && g.currentAmount < g.targetAmount) {
      const monthsNeeded = Math.ceil(
        (g.targetAmount - g.currentAmount) / monthlyContribution
      );
      const projected = new Date();
      projected.setMonth(projected.getMonth() + monthsNeeded);
      projectedCompletionDate = projected.toISOString();
    }

    return {
      name: g.name,
      targetAmount: g.targetAmount,
      currentAmount: g.currentAmount,
      percentage: Math.min(percentage, 100),
      monthlyContribution,
      status,
      contributedThisMonth,
      requiredMonthly,
      projectedCompletionDate,
      monthsRemaining: monthsRemaining > 0 ? monthsRemaining : null,
    };
  });
}

// ---------------------------------------------------------------------------
// Projections
// ---------------------------------------------------------------------------

function buildProjections(
  recurringTransactions: { type: string; amount: number; isActive: boolean }[],
  liabilities: Liability[],
  endDate: Date
): ProjectionData {
  const nextMonth = new Date(endDate);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  const nextMonthFixedExpenses = recurringTransactions
    .filter((r) => r.isActive && r.type === 'expense')
    .reduce((sum, r) => sum + r.amount, 0);

  const nextMonthLiabilityPayments = liabilities
    .filter((l) => isLiabilityActiveInCashFlow(l, nextMonth))
    .reduce((sum, l) => sum + getEffectiveMonthlyExpense(l, nextMonth), 0);

  return {
    nextMonthFixedExpenses,
    nextMonthLiabilityPayments,
    totalProjected: nextMonthFixedExpenses + nextMonthLiabilityPayments,
  };
}

// ---------------------------------------------------------------------------
// Previous month category breakdown (for per-category MoM)
// ---------------------------------------------------------------------------

async function getPreviousMonthCategoryBreakdown(
  userIds: string[],
  currentStartDate: Date,
  txType: 'expense' | 'income'
): Promise<Record<string, number>> {
  const prevEnd = new Date(currentStartDate);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd.getFullYear(), prevEnd.getMonth(), 1);

  const prevTransactions = await prisma.transaction.findMany({
    where: {
      userId: { in: userIds },
      date: { gte: prevStart, lte: prevEnd },
      type: txType,
    },
  });

  const breakdown: Record<string, number> = {};
  for (const tx of prevTransactions) {
    breakdown[tx.category] = (breakdown[tx.category] || 0) + tx.amount;
  }
  return breakdown;
}

// ---------------------------------------------------------------------------
// Month-over-month
// ---------------------------------------------------------------------------

async function calculateMonthOverMonth(
  userIds: string[],
  currentRange: DateRange,
  currentData: {
    netWorth: number;
    totalIncome: number;
    totalExpenses: number;
    netCashflow: number;
  }
): Promise<MonthOverMonthComparison> {
  const endMonthKey = getMonthKey(currentRange.startDate);
  const prevMonthKey = getPreviousMonthKey(endMonthKey);

  let prevReport = await prisma.monthlyReport.findFirst({
    where: {
      userId: { in: userIds },
      monthKey: { lte: prevMonthKey },
    },
    select: {
      monthKey: true,
      netWorth: true,
      totalIncome: true,
      totalExpenses: true,
      netCashflow: true,
    },
    orderBy: { monthKey: 'desc' },
  });

  if (!prevReport) {
    const fallback = await computeCashFlowFromTransactions(userIds, prevMonthKey);
    if (fallback) {
      prevReport = {
        monthKey: prevMonthKey,
        netWorth: 0,
        totalIncome: fallback.totalIncome,
        totalExpenses: fallback.totalExpenses,
        netCashflow: fallback.netCashflow,
      };
    }
  }


  if (!prevReport) {
    return {
      prevPeriodLabel: '',
      netWorthChange: null,
      netWorthChangePercent: null,
      incomeChange: null,
      incomeChangePercent: null,
      expenseChange: null,
      expenseChangePercent: null,
      cashflowChange: null,
    };
  }

  const pctChange = (current: number, prev: number): number | null => {
    if (prev === 0) return null;
    return Math.round(((current - prev) / Math.abs(prev)) * 100);
  };

  return {
    prevPeriodLabel: formatMonthKeyHebrew(prevReport.monthKey),
    netWorthChange: currentData.netWorth - prevReport.netWorth,
    netWorthChangePercent: pctChange(currentData.netWorth, prevReport.netWorth),
    incomeChange: currentData.totalIncome - prevReport.totalIncome,
    incomeChangePercent: pctChange(
      currentData.totalIncome,
      prevReport.totalIncome
    ),
    expenseChange: currentData.totalExpenses - prevReport.totalExpenses,
    expenseChangePercent: pctChange(
      currentData.totalExpenses,
      prevReport.totalExpenses
    ),
    cashflowChange: currentData.netCashflow - prevReport.netCashflow,
  };
}

// ---------------------------------------------------------------------------
// Cash Flow Comparison (previous month + same month last year)
// ---------------------------------------------------------------------------

async function computeCashFlowFromTransactions(
  userIds: string[],
  monthKey: string
): Promise<{ totalIncome: number; totalExpenses: number; netCashflow: number } | null> {
  const [year, month] = monthKey.split('-').map(Number);
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  const transactions = await prisma.transaction.findMany({
    where: {
      userId: { in: userIds },
      date: { gte: startDate, lte: endDate },
    },
    select: { type: true, amount: true },
  });

  if (transactions.length === 0) return null;

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return { totalIncome, totalExpenses, netCashflow: totalIncome - totalExpenses };
}

async function calculateCashFlowComparison(
  userIds: string[],
  currentStartDate: Date
): Promise<CashFlowComparison> {
  const currentMonthKey = getMonthKey(currentStartDate);
  const prevMonthKey = getPreviousMonthKey(currentMonthKey);

  const [yearStr, monthStr] = currentMonthKey.split('-');
  const lastYearMonthKey = `${parseInt(yearStr) - 1}-${monthStr}`;

  let [prevReport, lastYearReport] = await Promise.all([
    prisma.monthlyReport.findFirst({
      where: { userId: { in: userIds }, monthKey: prevMonthKey },
      select: { totalIncome: true, totalExpenses: true, netCashflow: true },
    }),
    prisma.monthlyReport.findFirst({
      where: { userId: { in: userIds }, monthKey: lastYearMonthKey },
      select: { totalIncome: true, totalExpenses: true, netCashflow: true },
    }),
  ]);

  if (!prevReport) {
    prevReport = await computeCashFlowFromTransactions(userIds, prevMonthKey);
  }
  if (!lastYearReport) {
    lastYearReport = await computeCashFlowFromTransactions(userIds, lastYearMonthKey);
  }

  return {
    prevMonthIncome: prevReport?.totalIncome ?? null,
    prevMonthExpenses: prevReport?.totalExpenses ?? null,
    prevMonthCashflow: prevReport?.netCashflow ?? null,
    lastYearIncome: lastYearReport?.totalIncome ?? null,
    lastYearExpenses: lastYearReport?.totalExpenses ?? null,
    lastYearCashflow: lastYearReport?.netCashflow ?? null,
  };
}

// ---------------------------------------------------------------------------
// Same month last year category breakdown
// ---------------------------------------------------------------------------

async function getLastYearCategoryBreakdown(
  userIds: string[],
  currentStartDate: Date,
  currentEndDate: Date,
  txType: 'expense' | 'income'
): Promise<Record<string, number>> {
  const lastYearStart = new Date(currentStartDate);
  lastYearStart.setFullYear(lastYearStart.getFullYear() - 1);
  const lastYearEnd = new Date(currentEndDate);
  lastYearEnd.setFullYear(lastYearEnd.getFullYear() - 1);

  const txs = await prisma.transaction.findMany({
    where: {
      userId: { in: userIds },
      date: { gte: lastYearStart, lte: lastYearEnd },
      type: txType,
    },
  });

  const breakdown: Record<string, number> = {};
  for (const tx of txs) {
    breakdown[tx.category] = (breakdown[tx.category] || 0) + tx.amount;
  }
  return breakdown;
}

// ---------------------------------------------------------------------------
// Convert raw-category-keyed breakdown to Hebrew-name-keyed
// ---------------------------------------------------------------------------

function convertBreakdownToHebrewNames(
  breakdown: Record<string, number>,
  customCategoryInfos: CategoryInfo[],
  txType: 'expense' | 'income' = 'expense'
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [category, amount] of Object.entries(breakdown)) {
    const catInfo = getCategoryInfo(category, txType, customCategoryInfos);
    const name = catInfo?.nameHe || category;
    result[name] = (result[name] || 0) + amount;
  }
  return result;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getPreviousMonthKey(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  const prevDate = new Date(year, month - 2, 1);
  return `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthKeyHebrew(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  return new Intl.DateTimeFormat('he-IL', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function getMonthKeysInDateRange(startDate: Date, endDate: Date): string[] {
  const keys = new Set<string>();
  const current = new Date(startDate);

  while (current <= endDate) {
    keys.add(getMonthKey(current));
    current.setMonth(current.getMonth() + 1);
    current.setDate(1);
  }

  return Array.from(keys);
}
