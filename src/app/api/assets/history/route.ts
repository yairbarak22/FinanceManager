import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getSharedUserIds } from '@/lib/authHelpers';

export async function GET(request: NextRequest) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    // Check for detailed query parameter
    const { searchParams } = new URL(request.url);
    const detailed = searchParams.get('detailed') === 'true';

    // Get all user IDs in the shared account
    const userIds = await getSharedUserIds(userId);

    // Get history records for assets belonging to all shared account members
    const historyRecords = await prisma.assetValueHistory.findMany({
      where: {
        asset: {
          userId: { in: userIds },
        },
      },
      orderBy: { monthKey: 'asc' },
    });

    // If detailed requested, return individual records
    if (detailed) {
      return NextResponse.json(historyRecords);
    }

    // Default: return aggregated data
    const aggregatedHistory = historyRecords.reduce((acc, record) => {
      if (!acc[record.monthKey]) {
        acc[record.monthKey] = 0;
      }
      acc[record.monthKey] += record.value;
      return acc;
    }, {} as Record<string, number>);

    const formattedHistory = Object.entries(aggregatedHistory).map(([monthKey, totalAssets]) => ({
      monthKey,
      totalAssets,
    }));

    return NextResponse.json(formattedHistory);
  } catch (error) {
    console.error('Error fetching asset history:', error);
    return NextResponse.json({ error: 'Failed to fetch asset history' }, { status: 500 });
  }
}
