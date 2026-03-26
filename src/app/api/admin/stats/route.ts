import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminHelpers';
import { cleanupOldAuditLogs } from '@/lib/auditLog';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { userId, error } = await requireAdmin();
    if (error) return error;

    const rateLimitResult = await checkRateLimit(`admin:${userId}`, RATE_LIMITS.admin);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'יותר מדי בקשות. נסה שוב בעוד דקה.' },
        { status: 429 }
      );
    }

    cleanupOldAuditLogs().catch(() => {});

    const now = new Date();
    const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setUTCDate(startOfTomorrow.getUTCDate() + 1);

    // All counts computed live — no cached GlobalStats
    const [
      totalUsers, totalTransactions, totalAssets, totalLiabilities,
      budgetsCount, goalsCount,
      todayTransactions, todayAssets, todayLiabilities, todayNewUsers,
      multipleLoginUsers, todayUniqueLogins, usersWithMultipleLoginDays,
      usersWithPhone, ivrExpenses,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.transaction.count(),
      prisma.asset.count(),
      prisma.liability.count(),
      prisma.budget.count(),
      prisma.financialGoal.count(),
      prisma.transaction.count({ where: { createdAt: { gte: startOfToday, lt: startOfTomorrow } } }),
      prisma.asset.count({ where: { createdAt: { gte: startOfToday, lt: startOfTomorrow } } }),
      prisma.liability.count({ where: { createdAt: { gte: startOfToday, lt: startOfTomorrow } } }),
      countTodayNewUsers(startOfToday, startOfTomorrow),
      getMultipleLoginUsersCount(),
      getTodayUniqueLoginsCount(startOfToday, startOfTomorrow),
      getUsersWithMultipleLoginDaysCount(),
      prisma.ivrPin.count(),
      prisma.ivrCallSession.count({
        where: { status: 'completed' },
      }),
    ]);

    return NextResponse.json({
      totals: {
        assets: totalAssets,
        liabilities: totalLiabilities,
        transactions: totalTransactions,
        users: totalUsers,
        budgets: budgetsCount,
        goals: goalsCount,
      },
      today: {
        assets: todayAssets,
        liabilities: todayLiabilities,
        transactions: todayTransactions,
        users: todayNewUsers,
      },
      activity: {
        multipleLoginUsers,
        todayUniqueLogins,
        usersWithMultipleLoginDays,
      },
      ivr: {
        usersWithPhone,
        expensesCount: ivrExpenses,
      },
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}

/**
 * Count users whose first-ever login falls within today's range ("new users today")
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
 * Count unique users who logged in today
 * Groups AuditLog LOGIN entries by userId for today's date range
 */
async function getTodayUniqueLoginsCount(
  startOfToday: Date,
  startOfTomorrow: Date
): Promise<number> {
  try {
    const rows = await prisma.auditLog.groupBy({
      by: ['userId'],
      where: {
        action: { in: ['LOGIN', 'OAUTH_LOGIN'] },
        userId: { not: null },
        createdAt: { gte: startOfToday, lt: startOfTomorrow },
      },
    });
    return rows.length;
  } catch {
    console.error('Failed to count today unique logins');
    return 0;
  }
}

/**
 * Count users with more than one unique login day (returning users)
 * Uses OAUTH_LOGIN/LOGIN AuditLog entries, counts distinct calendar dates per user
 */
async function getUsersWithMultipleLoginDaysCount(): Promise<number> {
  try {
    const result = await prisma.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
      SELECT COUNT(*)::bigint AS count
      FROM (
        SELECT al."userId"
        FROM "AuditLog" al
        WHERE al.action IN ('LOGIN', 'OAUTH_LOGIN')
          AND al."userId" IS NOT NULL
        GROUP BY al."userId"
        HAVING COUNT(DISTINCT DATE(al."createdAt")) > 1
      ) AS returning_users
    `);
    return Number(result[0]?.count ?? 0);
  } catch {
    console.error('Failed to count users with multiple login days');
    return 0;
  }
}

/**
 * Count users who have logged in more than once
 * Uses AuditLog if LOGIN events exist, otherwise returns 0
 */
async function getMultipleLoginUsersCount(): Promise<number> {
  try {
    const loginLogsExist = await prisma.auditLog.findFirst({
      where: { action: { in: ['LOGIN', 'OAUTH_LOGIN'] } },
      select: { id: true },
    });

    if (!loginLogsExist) {
      return 0;
    }

    const usersWithMultipleLogins = await prisma.auditLog.groupBy({
      by: ['userId'],
      where: {
        action: { in: ['LOGIN', 'OAUTH_LOGIN'] },
        userId: { not: null },
      },
      _count: {
        userId: true,
      },
      having: {
        userId: {
          _count: {
            gt: 1,
          },
        },
      },
    });

    return usersWithMultipleLogins.length;
  } catch {
    // If audit log query fails, return 0 gracefully
    console.error('Failed to count multiple login users');
    return 0;
  }
}

