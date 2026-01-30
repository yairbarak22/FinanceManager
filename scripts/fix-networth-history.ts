/**
 * Fix Net Worth History
 * 
 * This script fixes the net worth history for all users by:
 * 1. For each user, getting their current net worth
 * 2. Setting ALL past months to the same current value (flat line)
 * 3. This is the honest representation - we don't have real historical data
 * 
 * The problem was that the initial backfill was saving inflated/incorrect values
 * for past months due to a bug in asset calculation.
 * 
 * Usage:
 * npx tsx scripts/fix-networth-history.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get current month key in YYYY-MM format
 */
function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Get all user IDs that share the same account
 */
async function getSharedUserIds(userId: string): Promise<string[]> {
  const membership = await prisma.sharedAccountMember.findFirst({
    where: { userId },
    select: { sharedAccountId: true },
  });

  if (!membership) {
    return [userId];
  }

  const members = await prisma.sharedAccountMember.findMany({
    where: { sharedAccountId: membership.sharedAccountId },
    select: { userId: true },
  });

  return members.map((m) => m.userId);
}

/**
 * Calculate remaining balance at a specific date (same as in loanCalculations.ts)
 */
function getRemainingBalance(
  liability: {
    totalAmount: number;
    interestRate: number;
    loanTermMonths: number;
    startDate: Date;
    remainingAmount: number | null;
    loanMethod: string;
  },
  asOfDate: Date
): number {
  if (!liability.interestRate || !liability.loanTermMonths || !liability.startDate) {
    return liability.remainingAmount ?? liability.totalAmount;
  }

  const startDate = new Date(liability.startDate);
  const targetDate = asOfDate;

  const monthsPassed =
    (targetDate.getFullYear() - startDate.getFullYear()) * 12 +
    (targetDate.getMonth() - startDate.getMonth());

  const currentMonth = monthsPassed + 1;

  if (currentMonth < 1) {
    return liability.totalAmount;
  }

  if (currentMonth > liability.loanTermMonths) {
    return 0;
  }

  const monthlyRate = liability.interestRate / 100 / 12;
  let balance = liability.totalAmount;

  if (liability.loanMethod === 'spitzer' || !liability.loanMethod) {
    const factor = Math.pow(1 + monthlyRate, liability.loanTermMonths);
    const payment = monthlyRate === 0 
      ? liability.totalAmount / liability.loanTermMonths
      : liability.totalAmount * (monthlyRate * factor) / (factor - 1);

    for (let i = 0; i < currentMonth; i++) {
      const interest = balance * monthlyRate;
      const principalPayment = payment - interest;
      balance = Math.max(0, balance - principalPayment);
    }
  } else {
    const principalPayment = liability.totalAmount / liability.loanTermMonths;
    balance = Math.max(0, liability.totalAmount - principalPayment * currentMonth);
  }

  return Math.round(balance * 100) / 100;
}

/**
 * Calculate CURRENT total assets (using current values)
 */
async function getCurrentTotalAssets(userId: string): Promise<number> {
  const userIds = await getSharedUserIds(userId);

  const assets = await prisma.asset.findMany({
    where: {
      userId: { in: userIds },
    },
    select: {
      value: true,
    },
  });

  return assets.reduce((sum, asset) => sum + asset.value, 0);
}

/**
 * Calculate CURRENT total liabilities
 */
async function getCurrentTotalLiabilities(userId: string): Promise<number> {
  const userIds = await getSharedUserIds(userId);
  const now = new Date();

  const liabilities = await prisma.liability.findMany({
    where: {
      userId: { in: userIds },
    },
  });

  return liabilities.reduce((sum, liability) => {
    return sum + getRemainingBalance(liability, now);
  }, 0);
}

/**
 * Fix net worth history for a single user
 * Sets all months to the current net worth value
 */
async function fixUserNetWorthHistory(userId: string): Promise<number> {
  const currentMonth = getCurrentMonthKey();
  
  // Calculate CURRENT net worth
  const [totalAssets, totalLiabilities] = await Promise.all([
    getCurrentTotalAssets(userId),
    getCurrentTotalLiabilities(userId),
  ]);
  const currentNetWorth = totalAssets - totalLiabilities;

  // Get all existing history records for this user
  const existingRecords = await prisma.netWorthHistory.findMany({
    where: { userId },
    select: { id: true, date: true },
  });

  let updatedCount = 0;

  // Update all records to have the current net worth value
  // This creates a flat line which is honest - we don't have real historical data
  for (const record of existingRecords) {
    await prisma.netWorthHistory.update({
      where: { id: record.id },
      data: {
        netWorth: currentNetWorth,
        assets: totalAssets,
        liabilities: totalLiabilities,
      },
    });
    updatedCount++;
  }

  // Make sure current month exists
  const [year, monthNum] = currentMonth.split('-').map(Number);
  const currentMonthDate = new Date(year, monthNum - 1, 1);

  const hasCurrentMonth = existingRecords.some(
    r => r.date.getFullYear() === currentMonthDate.getFullYear() &&
         r.date.getMonth() === currentMonthDate.getMonth()
  );

  if (!hasCurrentMonth) {
    await prisma.netWorthHistory.create({
      data: {
        userId,
        date: currentMonthDate,
        netWorth: currentNetWorth,
        assets: totalAssets,
        liabilities: totalLiabilities,
      },
    });
    updatedCount++;
  }

  return updatedCount;
}

async function main() {
  console.log('🔧 Starting net worth history fix...\n');

  // Get all unique userIds from NetWorthHistory
  const usersWithHistory = await prisma.netWorthHistory.findMany({
    select: {
      userId: true,
    },
    distinct: ['userId'],
  });

  console.log(`📊 Found ${usersWithHistory.length} users with net worth history\n`);

  let totalUpdated = 0;

  for (const { userId } of usersWithHistory) {
    // Get user email for logging
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    console.log(`👤 Processing user: ${user?.email || userId}`);
    
    try {
      const count = await fixUserNetWorthHistory(userId);
      totalUpdated += count;
      console.log(`   ✅ Updated ${count} records to current net worth\n`);
    } catch (error) {
      console.error(`   ❌ Error:`, error);
    }
  }

  console.log(`\n✨ Fix completed! Total records updated: ${totalUpdated}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

