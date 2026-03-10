import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { Prisma } from '@prisma/client';
import { getGlobalStats } from '@/lib/globalStats';

interface UserRow {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  createdAt: Date;
  hasSeenOnboarding: boolean;
  lastLoginAt: Date | null;
  unique_login_days: bigint;
  transactions_count: bigint;
  assets_count: bigint;
  liabilities_count: bigint;
  recurringTransactions_count: bigint;
}

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '10', 10)));
    const skip = (page - 1) * pageSize;

    // Step 1: CTE finds the N most recently logged-in users from AuditLog
    //         (lightweight — scans only the indexed AuditLog table).
    // Step 2: Correlated sub-selects fetch per-user counts only for
    //         the small result set, each hitting the userId index.
    // This avoids the 5-way LEFT JOIN cartesian explosion.
    const [rows, globalStats] = await Promise.all([
      prisma.$queryRaw<UserRow[]>(Prisma.sql`
        WITH latest_logins AS (
          SELECT
            "userId",
            MAX("createdAt") AS last_login,
            COUNT(DISTINCT DATE("createdAt"))::bigint AS unique_days
          FROM "AuditLog"
          WHERE action IN ('LOGIN', 'OAUTH_LOGIN') AND "userId" IS NOT NULL
          GROUP BY "userId"
          ORDER BY last_login DESC
          LIMIT ${pageSize} OFFSET ${skip}
        )
        SELECT
          u.id,
          u.name,
          u.email,
          u.image,
          u."createdAt",
          u."hasSeenOnboarding",
          ll.last_login                     AS "lastLoginAt",
          COALESCE(ll.unique_days, 0)       AS unique_login_days,
          (SELECT COUNT(*) FROM "Transaction"          WHERE "userId" = u.id)::bigint AS transactions_count,
          (SELECT COUNT(*) FROM "Asset"                WHERE "userId" = u.id)::bigint AS assets_count,
          (SELECT COUNT(*) FROM "Liability"            WHERE "userId" = u.id)::bigint AS liabilities_count,
          (SELECT COUNT(*) FROM "RecurringTransaction" WHERE "userId" = u.id)::bigint AS "recurringTransactions_count"
        FROM latest_logins ll
        JOIN "User" u ON u.id = ll."userId"
        ORDER BY ll.last_login DESC
      `),
      getGlobalStats(),
    ]);

    const total = globalStats.totalUsers;

    const users = rows.map((u: UserRow) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      image: u.image,
      createdAt: u.createdAt.toISOString(),
      hasSeenOnboarding: u.hasSeenOnboarding,
      lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
      uniqueLoginDays: Number(u.unique_login_days),
      _count: {
        transactions: Number(u.transactions_count),
        assets: Number(u.assets_count),
        liabilities: Number(u.liabilities_count),
        recurringTransactions: Number(u.recurringTransactions_count),
      },
    }));

    return NextResponse.json({
      users,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
