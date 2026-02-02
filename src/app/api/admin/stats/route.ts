import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminHelpers';
import { cleanupOldAuditLogs } from '@/lib/auditLog';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';

// GET - Fetch admin statistics (admin only)
export async function GET() {
  try {
    // SECURITY: Triple validation - middleware, then this check
    const { userId, error } = await requireAdmin();
    if (error) return error;

    // Rate limit admin endpoints to prevent abuse
    const rateLimitResult = await checkRateLimit(`admin:${userId}`, RATE_LIMITS.admin);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'יותר מדי בקשות. נסה שוב בעוד דקה.' },
        { status: 429 }
      );
    }

    // Cleanup old audit logs (fire-and-forget, 90-day retention)
    cleanupOldAuditLogs().catch(() => {});

    // Get today's date range (Israel timezone)
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

    // Run all count queries in parallel for performance
    const [
      // Total counts (all time)
      totalAssets,
      totalLiabilities,
      totalTransactions,
      totalUsers,
      
      // Daily counts (created today)
      todayAssets,
      todayLiabilities,
      todayTransactions,
      todayUsers,
      
      // Users who logged in more than once (using AuditLog if available)
      // Since we use JWT strategy, we'll count users with multiple sessions or audit logs
      multipleLoginUsers,
    ] = await Promise.all([
      // Total counts
      prisma.asset.count(),
      prisma.liability.count(),
      prisma.transaction.count(),
      prisma.user.count(),
      
      // Daily counts
      prisma.asset.count({
        where: {
          createdAt: {
            gte: startOfToday,
            lt: startOfTomorrow,
          },
        },
      }),
      prisma.liability.count({
        where: {
          createdAt: {
            gte: startOfToday,
            lt: startOfTomorrow,
          },
        },
      }),
      prisma.transaction.count({
        where: {
          createdAt: {
            gte: startOfToday,
            lt: startOfTomorrow,
          },
        },
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: startOfToday,
            lt: startOfTomorrow,
          },
        },
      }),
      
      // Count users with multiple LOGIN events in AuditLog
      // Using raw query because Prisma groupBy with having is complex
      getMultipleLoginUsersCount(),
    ]);

    // Return only aggregated numbers - no PII
    return NextResponse.json({
      totals: {
        assets: totalAssets,
        liabilities: totalLiabilities,
        transactions: totalTransactions,
        users: totalUsers,
      },
      today: {
        assets: todayAssets,
        liabilities: todayLiabilities,
        transactions: todayTransactions,
        users: todayUsers,
      },
      activity: {
        multipleLoginUsers,
      },
    });
  } catch (error) {
    // Log error server-side but return generic message
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}

/**
 * Count users who have logged in more than once
 * Uses AuditLog if LOGIN events exist, otherwise returns 0
 */
async function getMultipleLoginUsersCount(): Promise<number> {
  try {
    // Check if we have any LOGIN audit logs
    const loginLogsExist = await prisma.auditLog.findFirst({
      where: { action: 'LOGIN' },
      select: { id: true },
    });

    if (!loginLogsExist) {
      // No login tracking yet - return 0
      // This means login audit logging needs to be implemented
      return 0;
    }

    // Group by userId and count users with more than one login
    const usersWithMultipleLogins = await prisma.auditLog.groupBy({
      by: ['userId'],
      where: {
        action: 'LOGIN',
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

