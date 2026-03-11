import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

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
  return new Date().toISOString().slice(0, 10);
}

function getTodayRange() {
  const now = new Date();
  const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setUTCDate(startOfTomorrow.getUTCDate() + 1);
  return { startOfToday, startOfTomorrow };
}

/**
 * Count users whose first-ever login (AuditLog) falls within today's range.
 * "New users" = users who logged in today for the very first time.
 */
async function countTodayNewUsers(startOfToday: Date, startOfTomorrow: Date): Promise<number> {
  try {
    const result = await prisma.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
      SELECT COUNT(DISTINCT al."userId")::bigint AS count
      FROM "AuditLog" al
      WHERE al.action IN ('LOGIN', 'OAUTH_LOGIN')
        AND al."userId" IS NOT NULL
        AND al."createdAt" >= ${startOfToday}
        AND al."createdAt" < ${startOfTomorrow}
        AND NOT EXISTS (
          SELECT 1
          FROM "AuditLog" al2
          WHERE al2."userId" = al."userId"
            AND al2.action IN ('LOGIN', 'OAUTH_LOGIN')
            AND al2."createdAt" < ${startOfToday}
        )
    `);
    return Number(result[0]?.count ?? 0);
  } catch {
    return 0;
  }
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
    countTodayNewUsers(startOfToday, startOfTomorrow),
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
    countTodayNewUsers(startOfToday, startOfTomorrow),
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

  // Ensure singleton exists and get current stats in a single call
  const currentStats = await getGlobalStats();
  const todayStr = getTodayDateString();

  const data: Record<string, unknown> = {
    [totalField]: { increment: count },
  };

  if (todayField && currentStats.todayDate === todayStr) {
    data[todayField] = { increment: count };
  }

  try {
    await prisma.globalStats.update({ where: { id: 'singleton' }, data });
  } catch (error) {
    console.error(`[GlobalStats] Failed to increment ${type}:`, error);
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
