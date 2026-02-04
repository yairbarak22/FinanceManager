import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { requireAuth, getSharedUserIds } from '@/lib/authHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { PORTFOLIO_SYNC_ASSET_NAME, PORTFOLIO_ASSET_CATEGORY } from '@/lib/finance/portfolioCache';

/**
 * GET /api/portfolio/history
 * Returns portfolio value history for the last 6 months
 * Format: { date: string, value: number }[]
 */
export async function GET() {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    // Rate limiting
    const rateLimitResult = await checkRateLimit(`api:${userId}`, RATE_LIMITS.api);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'יותר מדי בקשות' }, { status: 429 });
    }

    // Get all user IDs in the shared account
    const userIds = await getSharedUserIds(userId);

    // Find the portfolio asset
    const portfolioAsset = await prisma.asset.findFirst({
      where: {
        userId: { in: userIds },
        name: PORTFOLIO_SYNC_ASSET_NAME,
        category: PORTFOLIO_ASSET_CATEGORY,
      },
      include: {
        valueHistory: {
          orderBy: { monthKey: 'asc' },
        },
      },
    });

    // Generate last 6 months
    const now = new Date();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const result: Array<{ date: string; value: number; month: string }> = [];

    // Create a map of existing history data by month key (YYYY-MM)
    const historyMap = new Map<string, number>();
    if (portfolioAsset?.valueHistory) {
      portfolioAsset.valueHistory.forEach((item) => {
        historyMap.set(item.monthKey, item.value);
      });
    }

    // Always generate 6 months back from current month
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
      const monthName = monthNames[monthDate.getMonth()];

      // Use historical value if available, otherwise 0
      const value = historyMap.get(monthKey) ?? 0;

      result.push({
        date: monthDate.toISOString(),
        value,
        month: monthName,
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching portfolio history:', error);
    return NextResponse.json({ error: 'Failed to fetch portfolio history' }, { status: 500 });
  }
}

