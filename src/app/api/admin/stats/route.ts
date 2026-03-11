import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminHelpers';
import { cleanupOldAuditLogs } from '@/lib/auditLog';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { Prisma } from '@prisma/client';
import { getGlobalStats, refreshTodayStats } from '@/lib/globalStats';

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

    // Read cached totals + today stats from GlobalStats singleton
    let stats = await getGlobalStats();

    // Lazy-refresh today counters when the calendar day rolls over
    const todayStr = new Date().toISOString().slice(0, 10);
    if (stats.todayDate !== todayStr) {
      stats = await refreshTodayStats();
    }

    const now = new Date();
    const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setUTCDate(startOfTomorrow.getUTCDate() + 1);

    // Activity stats still need real-time queries
    const [multipleLoginUsers, todayUniqueLogins, usersWithMultipleLoginDays] = await Promise.all([
      getMultipleLoginUsersCount(),
      getTodayUniqueLoginsCount(startOfToday, startOfTomorrow),
      getUsersWithMultipleLoginDaysCount(),
    ]);

    return NextResponse.json({
      totals: {
        assets: stats.totalAssets,
        liabilities: stats.totalLiabilities,
        transactions: stats.totalTransactions,
        users: stats.totalUsers,
      },
      today: {
        assets: stats.todayAssets,
        liabilities: stats.todayLiabilities,
        transactions: stats.todayTransactions,
        users: stats.todayUsers,
      },
      activity: {
        multipleLoginUsers,
        todayUniqueLogins,
        usersWithMultipleLoginDays,
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

