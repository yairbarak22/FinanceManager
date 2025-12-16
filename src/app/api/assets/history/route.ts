import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authHelpers';

export async function GET() {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    // Get history records only for assets belonging to the user
    const historyRecords = await prisma.assetValueHistory.findMany({
      where: {
        asset: {
          userId,
        },
      },
      orderBy: { monthKey: 'asc' },
    });

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
