import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { requireAuth, getSharedUserIds } from '@/lib/authHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { needsInitialBackfill, initialBackfillNetWorthHistory } from '@/lib/netWorthHistory';

export async function GET() {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    // Rate limiting
    const rateLimitResult = await checkRateLimit(`api:${userId}`, RATE_LIMITS.api);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'יותר מדי בקשות' }, { status: 429 });
    }

    // Check if user needs initial backfill (first time viewing chart)
    const needsBackfill = await needsInitialBackfill(userId);
    if (needsBackfill) {
      await initialBackfillNetWorthHistory(userId);
    }

    // Get all user IDs in the shared account
    const userIds = await getSharedUserIds(userId);

    // Fetch net worth history for all shared account members
    // Sort by createdAt desc to get most recent records first
    const allHistory = await prisma.netWorthHistory.findMany({
      where: {
        userId: { in: userIds },
      },
      orderBy: [
        { date: 'asc' },
        { createdAt: 'desc' }, // Most recent first within same date
      ],
    });

    // Deduplicate by month - keep only the most recent record for each month
    // For shared accounts, different users might have records for the same month
    const monthMap = new Map<string, typeof allHistory[0]>();
    
    // Process in reverse order (oldest first, but most recent createdAt wins)
    for (const record of allHistory) {
      const monthKey = `${record.date.getFullYear()}-${String(record.date.getMonth() + 1).padStart(2, '0')}`;
      const existing = monthMap.get(monthKey);
      
      // Keep the record with the most recent createdAt
      if (!existing || record.createdAt > existing.createdAt) {
        monthMap.set(monthKey, record);
      }
    }

    // Convert back to array and sort by date ascending
    const history = Array.from(monthMap.values()).sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );

    return NextResponse.json(history);
  } catch (error) {
    console.error('Error fetching net worth history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch net worth history' },
      { status: 500 }
    );
  }
}

