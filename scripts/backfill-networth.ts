/**
 * Backfill Net Worth History
 * 
 * This script populates the NetWorthHistory table for all existing users
 * based on their asset history months.
 * 
 * Usage:
 * npx tsx scripts/backfill-networth.ts
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
 * Calculate remaining balance at a specific date
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

  // Calculate how many months have passed from start date to target date
  const monthsPassed =
    (targetDate.getFullYear() - startDate.getFullYear()) * 12 +
    (targetDate.getMonth() - startDate.getMonth());

  const currentMonth = monthsPassed + 1;

  // If loan hasn't started yet
  if (currentMonth < 1) {
    return liability.totalAmount;
  }

  // If loan is finished
  if (currentMonth > liability.loanTermMonths) {
    return 0;
  }

  // Calculate remaining balance using amortization
  const monthlyRate = liability.interestRate / 100 / 12;
  let balance = liability.totalAmount;

  if (liability.loanMethod === 'spitzer' || !liability.loanMethod) {
    // Spitzer method - constant payment
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
    // Equal principal method
    const principalPayment = liability.totalAmount / liability.loanTermMonths;
    balance = Math.max(0, liability.totalAmount - principalPayment * currentMonth);
  }

  return Math.round(balance * 100) / 100;
}

/**
 * Get all user IDs that share the same account
 */
async function getSharedUserIds(userId: string): Promise<string[]> {
  // Get user's shared account
  const membership = await prisma.sharedAccountMember.findFirst({
    where: { userId },
    select: { sharedAccountId: true },
  });

  if (!membership) {
    return [userId];
  }

  // Get all members of this shared account
  const members = await prisma.sharedAccountMember.findMany({
    where: { sharedAccountId: membership.sharedAccountId },
    select: { userId: true },
  });

  return members.map((m) => m.userId);
}

/**
 * Calculate total assets for a specific month
 */
async function getTotalAssetsForMonthKey(
  userId: string,
  monthKey: string
): Promise<number> {
  const userIds = await getSharedUserIds(userId);

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
    return sum + getRemainingBalance(liability, targetDate);
  }, 0);
}

/**
 * Save net worth history for a specific month
 */
async function saveNetWorthHistory(
  userId: string,
  monthKey: string
): Promise<void> {
  // Calculate totals for this month
  const [totalAssets, totalLiabilities] = await Promise.all([
    getTotalAssetsForMonthKey(userId, monthKey),
    getTotalLiabilitiesForMonthKey(userId, monthKey),
  ]);

  const netWorth = totalAssets - totalLiabilities;

  // Parse monthKey to date (first day of month)
  const [year, monthNum] = monthKey.split('-');
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
 * Backfill net worth history for a user
 */
async function backfillNetWorthHistory(userId: string): Promise<number> {
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

  let count = 0;

  // Save net worth for each month
  for (const record of historyRecords) {
    await saveNetWorthHistory(userId, record.monthKey);
    count++;
  }

  // Also save current month if not already saved
  const currentMonthKey = getCurrentMonthKey();
  const hasCurrentMonth = historyRecords.some((r) => r.monthKey === currentMonthKey);
  if (!hasCurrentMonth) {
    await saveNetWorthHistory(userId, currentMonthKey);
    count++;
  }

  return count;
}

async function main() {
  console.log('🔄 Starting net worth history backfill...\n');

  // Get all users
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
    },
  });

  console.log(`📊 Found ${users.length} users\n`);

  let totalRecords = 0;

  for (const user of users) {
    console.log(`👤 Processing user: ${user.email}`);
    try {
      const count = await backfillNetWorthHistory(user.id);
      totalRecords += count;
      console.log(`   ✅ Created/updated ${count} net worth records\n`);
    } catch (error) {
      console.error(`   ❌ Error:`, error);
    }
  }

  console.log(`\n✨ Backfill completed! Total records: ${totalRecords}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

