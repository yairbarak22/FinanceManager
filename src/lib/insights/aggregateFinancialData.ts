import { prisma } from '@/lib/prisma';
import { getSharedUserIds } from '@/lib/authHelpers';
import {
  getRemainingBalance,
  getEffectiveMonthlyExpense,
  isLiabilityActiveInCashFlow,
} from '@/lib/loanCalculations';
import { calculateGoalStatus } from '@/lib/goalCalculations';
import { getMonthKey } from '@/lib/utils';
import type { Liability } from '@/lib/types';
import type { DateRange } from '@/lib/periodicReport/types';
import type { UserFinancialData, MonthSummary } from './types';

// ---------------------------------------------------------------------------
// Historical data – fetch last N months of summaries
// ---------------------------------------------------------------------------

async function fetchHistoricalSummaries(
  userIds: string[],
  currentStartDate: Date,
  count: number
): Promise<MonthSummary[]> {
  const currentMonthKey = getMonthKey(currentStartDate);

  const reports = await prisma.monthlyReport.findMany({
    where: {
      userId: { in: userIds },
      monthKey: { lt: currentMonthKey },
    },
    select: {
      monthKey: true,
      totalIncome: true,
      totalExpenses: true,
      netCashflow: true,
      netWorth: true,
    },
    orderBy: { monthKey: 'desc' },
    take: count,
  });

  if (reports.length > 0) {
    return reports.map((r) => ({
      monthKey: r.monthKey,
      totalIncome: r.totalIncome,
      totalExpenses: r.totalExpenses,
      netCashflow: r.netCashflow,
      totalAssets: 0,
      totalLiabilities: 0,
    }));
  }

  // Fallback: compute from raw transactions
  const summaries: MonthSummary[] = [];
  const cursor = new Date(currentStartDate);

  for (let i = 0; i < count; i++) {
    cursor.setMonth(cursor.getMonth() - 1);
    const mk = getMonthKey(cursor);
    const [year, month] = mk.split('-').map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);

    const txs = await prisma.transaction.findMany({
      where: {
        userId: { in: userIds },
        date: { gte: start, lte: end },
      },
      select: { type: true, amount: true },
    });

    if (txs.length === 0) continue;

    const totalIncome = txs
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0);
    const totalExpenses = txs
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);

    summaries.push({
      monthKey: mk,
      totalIncome,
      totalExpenses,
      netCashflow: totalIncome - totalExpenses,
      totalAssets: 0,
      totalLiabilities: 0,
    });
  }

  return summaries;
}

// ---------------------------------------------------------------------------
// Main aggregation
// ---------------------------------------------------------------------------

export async function aggregateFinancialDataForInsights(
  userId: string,
  dateRange: DateRange,
  existing: {
    totalIncome: number;
    totalExpenses: number;
    netCashflow: number;
    fixedExpenses: number;
    totalAssets: number;
    totalLiabilities: number;
  }
): Promise<UserFinancialData> {
  const userIds = await getSharedUserIds(userId);
  const { startDate, endDate } = dateRange;
  const monthDate = new Date(endDate);

  const [
    profile,
    liabilities,
    assets,
    holdings,
    goals,
    maaserTransactions,
    historicalData,
  ] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId } }),
    prisma.liability.findMany({
      where: { userId: { in: userIds } },
      include: { tracks: true },
    }),
    prisma.asset.findMany({ where: { userId: { in: userIds } } }),
    prisma.holding.findMany({ where: { userId: { in: userIds } } }),
    prisma.financialGoal.findMany({
      where: { userId: { in: userIds } },
      include: { recurringTransaction: true },
    }),
    prisma.transaction.findMany({
      where: {
        userId: { in: userIds },
        date: { gte: startDate, lte: endDate },
        type: 'expense',
        category: { in: ['maaser', 'charity'] },
      },
      select: { amount: true },
    }),
    fetchHistoricalSummaries(userIds, startDate, 3),
  ]);

  const typedLiabilities = liabilities as unknown as Liability[];

  // Cash balance: profile cashBalance + liquid assets (cash/savings)
  const profileCash = profile?.cashBalance ?? 0;
  const liquidAssets = assets
    .filter((a) => a.category === 'cash' || a.category === 'savings_account')
    .reduce((s, a) => s + a.value, 0);
  const cashBalance = profileCash + liquidAssets;

  // Investment portfolio: investment assets + holdings
  const investmentAssets = assets
    .filter((a) => ['stocks', 'crypto', 'investments'].includes(a.category))
    .reduce((s, a) => s + a.value, 0);
  const holdingsTotal = holdings.reduce((s, h) => s + h.currentValue, 0);
  const investmentPortfolio = investmentAssets + holdingsTotal;

  // Gemach loans vs bank loans
  const gemachLoans = typedLiabilities
    .filter((l) => !!l.gemachId && getRemainingBalance(l, monthDate) > 0)
    .map((l) => ({
      name: l.name,
      balance: getRemainingBalance(l, monthDate),
      monthlyPayment: isLiabilityActiveInCashFlow(l, monthDate)
        ? getEffectiveMonthlyExpense(l, monthDate)
        : 0,
    }));

  const bankLoans = typedLiabilities
    .filter(
      (l) =>
        !l.gemachId &&
        !l.isMortgage &&
        l.type !== 'mortgage' &&
        getRemainingBalance(l, monthDate) > 0
    )
    .map((l) => ({
      name: l.name,
      balance: getRemainingBalance(l, monthDate),
      monthlyPayment: isLiabilityActiveInCashFlow(l, monthDate)
        ? getEffectiveMonthlyExpense(l, monthDate)
        : 0,
    }));

  const mortgageBalance = typedLiabilities
    .filter(
      (l) =>
        (l.isMortgage || l.type === 'mortgage') &&
        getRemainingBalance(l, monthDate) > 0
    )
    .reduce((s, l) => s + getRemainingBalance(l, monthDate), 0);

  const totalMonthlyDebtPayments = typedLiabilities
    .filter((l) => isLiabilityActiveInCashFlow(l, monthDate))
    .reduce((s, l) => s + getEffectiveMonthlyExpense(l, monthDate), 0);

  // Goals
  const goalSnapshots = goals.map((g) => {
    const percentage =
      g.targetAmount > 0
        ? Math.min(Math.round((g.currentAmount / g.targetAmount) * 100), 100)
        : 0;
    const monthlyContribution = g.recurringTransaction?.amount ?? 0;
    const status = calculateGoalStatus(
      g.targetAmount,
      g.currentAmount,
      g.deadline,
      monthlyContribution || undefined
    );
    return {
      name: g.name,
      category: g.category,
      percentage,
      status,
      monthlyContribution,
    };
  });

  // Asset context for investment rules
  const hasActiveHishtalmut = assets.some(
    (a) => a.category === 'education_fund' && a.value > 0
  );
  const hasTradingAccount = holdings.length > 0;
  const childrenCount = profile?.childrenCount ?? 0;

  // Ma'aser
  const maaserExpenses = maaserTransactions.reduce(
    (s, t) => s + t.amount,
    0
  );

  const variableExpenses =
    existing.totalExpenses - existing.fixedExpenses;
  const freeCashFlow = existing.netCashflow - totalMonthlyDebtPayments;

  return {
    totalIncome: existing.totalIncome,
    totalExpenses: existing.totalExpenses,
    netCashflow: existing.netCashflow,
    fixedExpenses: existing.fixedExpenses,
    variableExpenses,

    cashBalance,
    investmentPortfolio,
    totalAssets: existing.totalAssets,

    totalLiabilities: existing.totalLiabilities,
    bankLoans,
    gemachLoans,
    mortgageBalance,
    totalMonthlyDebtPayments,

    goals: goalSnapshots,

    maaserExpenses,
    netIncome: existing.totalIncome,

    historicalData,

    freeCashFlow,
    annualIncome: existing.totalIncome * 12,

    assets: {
      hasActiveHishtalmut,
      hasTradingAccount,
      realizedCapitalGainsYTD: 0,
    },
    profile: {
      childrenCount,
    },
    fees: {},
  };
}
