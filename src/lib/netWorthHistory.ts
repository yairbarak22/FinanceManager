import { prisma } from '@/lib/prisma';
import { getSharedUserIds } from '@/lib/authHelpers';
import { getCurrentMonthKey } from '@/lib/assetHistory';
import { getRemainingBalance } from '@/lib/loanCalculations';
import { Liability } from '@/lib/types';

/**
 * Calculate total assets for a specific month
 * Uses AssetValueHistory to get historical values
 * 
 * IMPORTANT: For past months, ONLY count assets that have actual history records.
 * For current month, use current asset values.
 */
async function getTotalAssetsForMonthKey(
  userId: string,
  monthKey: string
): Promise<number> {
  const userIds = await getSharedUserIds(userId);
  const currentMonth = getCurrentMonthKey();
  const isCurrentMonth = monthKey === currentMonth;
  
  if (isCurrentMonth) {
    // For current month, use current asset values
    const allAssets = await prisma.asset.findMany({
      where: {
        userId: { in: userIds },
      },
      select: {
        value: true,
      },
    });
    return allAssets.reduce((sum, asset) => sum + asset.value, 0);
  }
  
  // For past months, ONLY use assets that have history records for that month
  // This prevents inflating past months with current asset values
  const historyRecords = await prisma.assetValueHistory.findMany({
    where: {
      asset: {
        userId: { in: userIds },
      },
      monthKey,
    },
  });
  
  return historyRecords.reduce((sum, record) => sum + record.value, 0);
}

/**
 * Calculate total liabilities for a specific month
 * Uses getRemainingBalance to calculate balance as of that date
 */
async function getTotalLiabilitiesForMonthKey(
  userId: string,
  monthKey: string
): Promise<number> {
  const userIds = await getSharedUserIds(userId);

  const liabilities = await prisma.liability.findMany({
    where: {
      userId: { in: userIds },
    },
  });

  // Parse monthKey to date (first day of month)
  const [year, month] = monthKey.split('-');
  const targetDate = new Date(parseInt(year), parseInt(month) - 1, 1);

  // Calculate remaining balance for each liability as of that date
  return liabilities.reduce((sum, liability) => {
    const liabilityData: Liability = {
      id: liability.id,
      name: liability.name,
      type: liability.type as 'loan' | 'mortgage',
      totalAmount: liability.totalAmount,
      monthlyPayment: liability.monthlyPayment,
      interestRate: liability.interestRate,
      loanTermMonths: liability.loanTermMonths,
      startDate: liability.startDate.toISOString(),
      remainingAmount: liability.remainingAmount ?? undefined,
      loanMethod: liability.loanMethod as 'spitzer' | 'equal_principal',
      hasInterestRebate: liability.hasInterestRebate,
      linkage: liability.linkage as 'none' | 'index' | 'foreign' | undefined,
    };
    return sum + getRemainingBalance(liabilityData, targetDate);
  }, 0);
}

/**
 * Save net worth history for a specific month
 * Uses upsert to avoid duplicates (unique constraint on [userId, date])
 *
 * @param userId - The user ID
 * @param monthKey - Optional month key (defaults to current month)
 */
export async function saveNetWorthHistory(
  userId: string,
  monthKey?: string
): Promise<void> {
  const month = monthKey || getCurrentMonthKey();

  // Calculate totals for this month
  const [totalAssets, totalLiabilities] = await Promise.all([
    getTotalAssetsForMonthKey(userId, month),
    getTotalLiabilitiesForMonthKey(userId, month),
  ]);

  const netWorth = totalAssets - totalLiabilities;

  // Parse monthKey to date (first day of month)
  const [year, monthNum] = month.split('-');
  const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);

  // Upsert to avoid duplicates
  await prisma.netWorthHistory.upsert({
    where: {
      userId_date: {
        userId,
        date,
      },
    },
    update: {
      netWorth,
      assets: totalAssets,
      liabilities: totalLiabilities,
    },
    create: {
      userId,
      date,
      netWorth,
      assets: totalAssets,
      liabilities: totalLiabilities,
    },
  });
}

/**
 * Save net worth history for current month
 * Called after asset/liability changes
 *
 * @param userId - The user ID
 */
export async function saveCurrentMonthNetWorth(userId: string): Promise<void> {
  await saveNetWorthHistory(userId);
}

/**
 * Check if net worth history needs initial backfill
 * Returns true if user has no history for past months
 */
export async function needsInitialBackfill(userId: string): Promise<boolean> {
  const currentMonth = getCurrentMonthKey();
  
  // Check if we have any history records for months BEFORE the current month
  const [year, month] = currentMonth.split('-').map(Number);
  const previousMonth = new Date(year, month - 2, 1); // month-1 for 0-indexed, -1 for previous
  const previousMonthKey = `${previousMonth.getFullYear()}-${String(previousMonth.getMonth() + 1).padStart(2, '0')}`;
  
  const previousMonthDate = new Date(previousMonth.getFullYear(), previousMonth.getMonth(), 1);
  
  const existingHistory = await prisma.netWorthHistory.findFirst({
    where: {
      userId,
      date: {
        lt: new Date(year, month - 1, 1), // Before current month
      },
    },
  });
  
  return !existingHistory;
}

/**
 * Initial backfill: Create net worth history for past 6 months
 * All past months get the CURRENT net worth value (snapshot)
 * This only runs ONCE when user has no historical data
 */
export async function initialBackfillNetWorthHistory(userId: string): Promise<void> {
  const currentMonth = getCurrentMonthKey();
  
  // Calculate current net worth
  const [totalAssets, totalLiabilities] = await Promise.all([
    getTotalAssetsForMonthKey(userId, currentMonth),
    getTotalLiabilitiesForMonthKey(userId, currentMonth),
  ]);
  const currentNetWorth = totalAssets - totalLiabilities;
  
  // Generate month keys for past 6 months (including current)
  const now = new Date();
  const monthsToBackfill: string[] = [];
  
  for (let i = 5; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
    monthsToBackfill.push(monthKey);
  }
  
  // Create history records for all months with same value
  // Use batch transaction instead of sequential upserts (N+1 fix)
  const upsertOperations = monthsToBackfill.map((monthKey) => {
    const [year, monthNum] = monthKey.split('-').map(Number);
    const date = new Date(year, monthNum - 1, 1);

    return prisma.netWorthHistory.upsert({
      where: {
        userId_date: {
          userId,
          date,
        },
      },
      update: {
        // Don't update past months if they already exist
        // Only update current month
        ...(monthKey === currentMonth ? {
          netWorth: currentNetWorth,
          assets: totalAssets,
          liabilities: totalLiabilities,
        } : {}),
      },
      create: {
        userId,
        date,
        netWorth: currentNetWorth,
        assets: totalAssets,
        liabilities: totalLiabilities,
      },
    });
  });

  // Execute all upserts in a single transaction
  await prisma.$transaction(upsertOperations);
}

/**
 * Backfill net worth history for all months that have asset history
 * This is used to populate historical data for existing users
 *
 * @param userId - The user ID
 */
export async function backfillNetWorthHistory(userId: string): Promise<void> {
  const userIds = await getSharedUserIds(userId);

  // Get all unique monthKeys from asset history
  const historyRecords = await prisma.assetValueHistory.findMany({
    where: {
      asset: {
        userId: { in: userIds },
      },
    },
    select: {
      monthKey: true,
    },
    distinct: ['monthKey'],
    orderBy: {
      monthKey: 'asc',
    },
  });

  // Save net worth for each month using parallel batches (N+1 fix)
  // Process in batches of 5 to avoid overwhelming the database
  const BATCH_SIZE = 5;
  for (let i = 0; i < historyRecords.length; i += BATCH_SIZE) {
    const batch = historyRecords.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map((record) => saveNetWorthHistory(userId, record.monthKey))
    );
  }

  // Also save current month if not already saved
  await saveCurrentMonthNetWorth(userId);
}
