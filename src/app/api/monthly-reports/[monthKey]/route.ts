import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { fetchNetWorthTimeline, fetchCategoryHistory, calculateUpcomingObligations } from '@/lib/monthlyReport/calculations';
import { getSharedUserIds } from '@/lib/authHelpers';
import { getMonthKey } from '@/lib/utils';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ monthKey: string }> }
) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const rateLimitResult = await checkRateLimit(`api:${userId}`, RATE_LIMITS.api);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'יותר מדי בקשות' }, { status: 429 });
    }

    const { monthKey } = await params;

    if (!monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) {
      return NextResponse.json(
        { error: 'Invalid monthKey format (expected YYYY-MM)' },
        { status: 400 }
      );
    }

    const report = await prisma.monthlyReport.findUnique({
      where: {
        userId_monthKey: { userId, monthKey },
      },
    });

    if (!report) {
      return NextResponse.json(
        { error: 'לא נמצא דוח לחודש זה', exists: false },
        { status: 404 }
      );
    }

    // Fetch supplementary data in parallel
    const [netWorthHistory, previousReportsCount, categoryHistory, upcomingObligations] = await Promise.all([
      fetchNetWorthTimeline(userId, monthKey, 6),
      prisma.monthlyReport.count({
        where: { userId, monthKey: { lt: monthKey } },
      }),
      fetchCategoryHistory(userId, monthKey, 3),
      calculateUpcomingObligations(userId, monthKey),
    ]);

    // Fetch transactions for this month for drill-down
    const userIds = await getSharedUserIds(userId);
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: { in: userIds },
      },
      orderBy: { date: 'desc' },
    });

    const monthTransactions = transactions
      .filter((tx) => getMonthKey(tx.date) === monthKey)
      .map((tx) => ({
        id: tx.id,
        type: tx.type,
        amount: tx.amount,
        category: tx.category,
        description: tx.description,
        date: tx.date.toISOString(),
      }));

    return NextResponse.json({
      ...report,
      netWorthHistory,
      categoryHistory,
      upcomingObligations: report.upcomingObligations || upcomingObligations,
      transactions: monthTransactions,
      isFirstMonth: previousReportsCount === 0,
    });
  } catch (err) {
    console.error('Error fetching monthly report:', err);
    return NextResponse.json(
      { error: 'Failed to fetch monthly report' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ monthKey: string }> }
) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const { monthKey } = await params;

    await prisma.monthlyReport.deleteMany({
      where: { userId, monthKey },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error deleting monthly report:', err);
    return NextResponse.json(
      { error: 'Failed to delete monthly report' },
      { status: 500 }
    );
  }
}
