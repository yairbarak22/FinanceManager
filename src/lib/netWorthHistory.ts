import { prisma } from '@/lib/prisma';
import { getSharedUserIds } from '@/lib/authHelpers';
import { getCurrentMonthKey } from '@/lib/assetHistory';
import { getRemainingBalance } from '@/lib/loanCalculations';
import { Liability } from '@/lib/types';

/**
 * Calculate total assets for a specific month
 * Uses AssetValueHistory to get historical values
 */
async function getTotalAssetsForMonthKey(
  userId: string,
  monthKey: string
): Promise<number> {
  const userIds = await getSharedUserIds(userId);
  
  // Get all assets for the user
  const allAssets = await prisma.asset.findMany({
    where: {
      userId: { in: userIds },
    },
    select: {
      id: true,
      value: true,
    },
  });

  // Get history records for this month
  const historyRecords = await prisma.assetValueHistory.findMany({
    where: {
      asset: {
        userId: { in: userIds },
      },
      monthKey,
    },
  });
  
  // Create a map of asset ID to historical value
  const historyMap = new Map(historyRecords.map(r => [r.assetId, r.value]));
  
  // Calculate total: use historical value if exists, otherwise use current value
  const total = allAssets.reduce((sum, asset) => {
    const value = historyMap.get(asset.id) ?? asset.value;
    return sum + value;
  }, 0);
  
  return total;
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
  for (const monthKey of monthsToBackfill) {
    const [year, monthNum] = monthKey.split('-').map(Number);
    const date = new Date(year, monthNum - 1, 1);
    
    // Use upsert to avoid duplicates
    await prisma.netWorthHistory.upsert({
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
  }
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

  // Save net worth for each month
  for (const record of historyRecords) {
    await saveNetWorthHistory(userId, record.monthKey);
  }

  // Also save current month if not already saved
  await saveCurrentMonthNetWorth(userId);
}
