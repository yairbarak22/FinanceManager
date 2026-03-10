import { prisma } from '@/lib/prisma';

type StatType = 'user' | 'transaction' | 'asset' | 'liability' | 'goal' | 'recurringTx' | 'holding';

const TOTAL_FIELD_MAP: Record<StatType, string> = {
  user: 'totalUsers',
  transaction: 'totalTransactions',
  asset: 'totalAssets',
  liability: 'totalLiabilities',
  goal: 'totalGoals',
  recurringTx: 'totalRecurringTx',
  holding: 'totalHoldings',
};

const TODAY_FIELD_MAP: Partial<Record<StatType, string>> = {
  user: 'todayUsers',
  transaction: 'todayTransactions',
  asset: 'todayAssets',
  liability: 'todayLiabilities',
};

function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTodayRange() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
  return { startOfToday, startOfTomorrow };
}

/**
 * Read the GlobalStats singleton. If it doesn't exist yet, compute all
 * counts from scratch and persist them (one-time cost).
 */
export async function getGlobalStats() {
  const existing = await prisma.globalStats.findUnique({
    where: { id: 'singleton' },
  });

  if (existing) return existing;

  return refreshGlobalStats();
}

/**
 * Full recompute of every counter. Only called when the singleton row
 * is missing (first boot) or explicitly requested.
 */
export async function refreshGlobalStats() {
  const todayStr = getTodayDateString();
  const { startOfToday, startOfTomorrow } = getTodayRange();

  const [
    totalUsers, totalTransactions, totalAssets, totalLiabilities,
    totalGoals, totalRecurringTx, totalHoldings,
    todayUsers, todayTransactions, todayAssets, todayLiabilities,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.transaction.count(),
    prisma.asset.count(),
    prisma.liability.count(),
    prisma.financialGoal.count(),
    prisma.recurringTransaction.count(),
    prisma.holding.count(),
    prisma.user.count({ where: { createdAt: { gte: startOfToday, lt: startOfTomorrow } } }),
    prisma.transaction.count({ where: { createdAt: { gte: startOfToday, lt: startOfTomorrow } } }),
    prisma.asset.count({ where: { createdAt: { gte: startOfToday, lt: startOfTomorrow } } }),
    prisma.liability.count({ where: { createdAt: { gte: startOfToday, lt: startOfTomorrow } } }),
  ]);

  return prisma.globalStats.upsert({
    where: { id: 'singleton' },
    create: {
      id: 'singleton',
      totalUsers, totalTransactions, totalAssets, totalLiabilities,
      totalGoals, totalRecurringTx, totalHoldings,
      todayUsers, todayTransactions, todayAssets, todayLiabilities,
      todayDate: todayStr,
    },
    update: {
      totalUsers, totalTransactions, totalAssets, totalLiabilities,
      totalGoals, totalRecurringTx, totalHoldings,
      todayUsers, todayTransactions, todayAssets, todayLiabilities,
      todayDate: todayStr,
    },
  });
}

/**
 * Re-count only the "today" columns and reset todayDate.
 * Called lazily when the stored todayDate doesn't match the current date.
 */
export async function refreshTodayStats() {
  const todayStr = getTodayDateString();
  const { startOfToday, startOfTomorrow } = getTodayRange();

  const [todayUsers, todayTransactions, todayAssets, todayLiabilities] = await Promise.all([
    prisma.user.count({ where: { createdAt: { gte: startOfToday, lt: startOfTomorrow } } }),
    prisma.transaction.count({ where: { createdAt: { gte: startOfToday, lt: startOfTomorrow } } }),
    prisma.asset.count({ where: { createdAt: { gte: startOfToday, lt: startOfTomorrow } } }),
    prisma.liability.count({ where: { createdAt: { gte: startOfToday, lt: startOfTomorrow } } }),
  ]);

  return prisma.globalStats.update({
    where: { id: 'singleton' },
    data: { todayUsers, todayTransactions, todayAssets, todayLiabilities, todayDate: todayStr },
  });
}

/**
 * Atomically bump a total counter (and the matching "today" counter when the
 * stored todayDate still matches the current calendar day).
 */
export async function incrementGlobalStats(type: StatType, count = 1) {
  const totalField = TOTAL_FIELD_MAP[type];
  const todayField = TODAY_FIELD_MAP[type];

  const data: Record<string, unknown> = {
    [totalField]: { increment: count },
  };

  if (todayField) {
    const stats = await prisma.globalStats.findUnique({
      where: { id: 'singleton' },
      select: { todayDate: true },
    });
    if (stats?.todayDate === getTodayDateString()) {
      data[todayField] = { increment: count };
    }
  }

  try {
    await prisma.globalStats.update({ where: { id: 'singleton' }, data });
  } catch {
    // Singleton doesn't exist yet — will be created on next getGlobalStats()
  }
}

/**
 * Atomically decrease a total counter.
 */
export async function decrementGlobalStats(type: StatType, count = 1) {
  const totalField = TOTAL_FIELD_MAP[type];

  try {
    await prisma.globalStats.update({
      where: { id: 'singleton' },
      data: { [totalField]: { decrement: count } },
    });
  } catch {
    // Singleton doesn't exist yet
  }
}
