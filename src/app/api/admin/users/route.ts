import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { Prisma } from '@prisma/client';

// Row shape returned by the raw SQL query
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

// GET - Fetch paginated users sorted by last login (admin only)
export async function GET(request: NextRequest) {
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

    // Parse pagination parameters
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '30', 10)));
    const skip = (page - 1) * pageSize;

    // Raw SQL: join with AuditLog to get last LOGIN per user, include counts.
    // Sorted by lastLoginAt DESC; users with no login fall back to createdAt DESC.
    const rows = await prisma.$queryRaw<UserRow[]>(Prisma.sql`
      SELECT
        u.id,
        u.name,
        u.email,
        u.image,
        u."createdAt",
        u."hasSeenOnboarding",
        MAX(al."createdAt")                        AS "lastLoginAt",
        COUNT(DISTINCT DATE(al."createdAt"))::bigint AS unique_login_days,
        COUNT(DISTINCT t.id)::bigint  AS transactions_count,
        COUNT(DISTINCT a.id)::bigint  AS assets_count,
        COUNT(DISTINCT l.id)::bigint  AS liabilities_count,
        COUNT(DISTINCT rt.id)::bigint AS "recurringTransactions_count"
      FROM "User" u
      LEFT JOIN "AuditLog"             al ON al."userId" = u.id
        AND al.action IN ('LOGIN', 'OAUTH_LOGIN')
      LEFT JOIN "Transaction"          t  ON t."userId"  = u.id
      LEFT JOIN "Asset"                a  ON a."userId"  = u.id
      LEFT JOIN "Liability"            l  ON l."userId"  = u.id
      LEFT JOIN "RecurringTransaction" rt ON rt."userId" = u.id
      GROUP BY u.id
      ORDER BY
        COALESCE(MAX(al."createdAt"), u."createdAt") DESC
      LIMIT ${pageSize} OFFSET ${skip}
    `);

    const total = await prisma.user.count();

    const users = rows.map((u) => ({
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
