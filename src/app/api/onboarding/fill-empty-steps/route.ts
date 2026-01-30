/**
 * Fill Empty Steps API for Onboarding
 * Called automatically when user completes onboarding to fill any empty steps with demo data
 * Only adds data for categories that don't already have data
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/authHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { saveAssetHistory } from '@/lib/assetHistory';
import { saveCurrentMonthNetWorth } from '@/lib/netWorthHistory';

/**
 * Helper function to create demo assets if none exist
 */
async function createDemoAssetsIfEmpty(userId: string): Promise<number> {
  const existingCount = await prisma.asset.count({ where: { userId } });
  if (existingCount > 0) {
    return 0;
  }

  // Asset 1: Real Estate (Apartment)
  const apartment = await prisma.asset.create({
    data: {
      userId,
      name: 'דירה לדוגמא',
      category: 'real_estate',
      value: 1000000,
    },
  });
  await saveAssetHistory(apartment.id, 1000000);

  // Asset 2: Education Fund (Keren Hishtalmut)
  const kerenHistalmut = await prisma.asset.create({
    data: {
      userId,
      name: 'קרן השתלמות לדוגמא',
      category: 'education_fund',
      value: 100000,
    },
  });
  await saveAssetHistory(kerenHistalmut.id, 100000);

  return 2;
}

/**
 * Helper function to create demo liability if none exist
 */
async function createDemoLiabilityIfEmpty(userId: string): Promise<number> {
  const existingCount = await prisma.liability.count({ where: { userId } });
  if (existingCount > 0) {
    return 0;
  }

  // Calculate start date for mortgage (4 years ago)
  const mortgageStartDate = new Date();
  mortgageStartDate.setFullYear(mortgageStartDate.getFullYear() - 4);

  // Mortgage: 750,000 ILS, 4.5% interest, 30 years (360 months) started 4 years ago
  const principal = 750000;
  const annualRate = 4.5;
  const monthlyRate = annualRate / 100 / 12;
  const totalMonths = 360;
  const monthlyPayment = Math.round(
    principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths) / 
    (Math.pow(1 + monthlyRate, totalMonths) - 1)
  );

  await prisma.liability.create({
    data: {
      userId,
      name: 'משכנתא לדוגמא',
      type: 'mortgage',
      totalAmount: 750000,
      remainingAmount: 750000,
      monthlyPayment,
      interestRate: 4.5,
      loanTermMonths: 312, // 360 - 48 months elapsed
      startDate: mortgageStartDate,
      loanMethod: 'spitzer',
      hasInterestRebate: false,
    },
  });

  return 1;
}

/**
 * Helper function to create demo recurring transactions if none exist
 */
async function createDemoRecurringIfEmpty(userId: string): Promise<number> {
  const existingCount = await prisma.recurringTransaction.count({ where: { userId } });
  if (existingCount > 0) {
    return 0;
  }

  // Recurring Income: Salary
  await prisma.recurringTransaction.create({
    data: {
      userId,
      type: 'income',
      name: 'משכורת לדוגמא',
      category: 'salary',
      amount: 12000,
      isActive: true,
    },
  });

  // Recurring Expense: Rent
  await prisma.recurringTransaction.create({
    data: {
      userId,
      type: 'expense',
      name: 'שכירות לדוגמא',
      category: 'housing',
      amount: 4000,
      isActive: true,
    },
  });

  return 2;
}

/**
 * Helper function to create demo transactions if none exist
 */
async function createDemoTransactionsIfEmpty(userId: string): Promise<number> {
  const existingCount = await prisma.transaction.count({ where: { userId } });
  if (existingCount > 0) {
    return 0;
  }

  const now = new Date();

  // Transaction 1: Grocery shopping
  await prisma.transaction.create({
    data: {
      userId,
      type: 'expense',
      description: 'קניות סופרמרקט',
      category: 'food',
      amount: 300,
      date: now,
    },
  });

  // Transaction 2: Gas
  await prisma.transaction.create({
    data: {
      userId,
      type: 'expense',
      description: 'דלק',
      category: 'transport',
      amount: 250,
      date: now,
    },
  });

  return 2;
}

// POST - Fill empty onboarding steps with demo data
export async function POST() {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    // Rate limiting
    const rateLimitResult = await checkRateLimit(`api:${userId}`, RATE_LIMITS.api);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'יותר מדי בקשות' }, { status: 429 });
    }

    // Create demo data only for empty categories
    const assetsAdded = await createDemoAssetsIfEmpty(userId);
    const liabilitiesAdded = await createDemoLiabilityIfEmpty(userId);
    const recurringAdded = await createDemoRecurringIfEmpty(userId);
    const transactionsAdded = await createDemoTransactionsIfEmpty(userId);

    // Update net worth history if any data was added
    if (assetsAdded > 0 || liabilitiesAdded > 0) {
      await saveCurrentMonthNetWorth(userId);
    }

    const totalAdded = assetsAdded + liabilitiesAdded + recurringAdded + transactionsAdded;

    return NextResponse.json({ 
      success: true,
      filledSteps: totalAdded > 0,
      data: {
        assets: assetsAdded,
        liabilities: liabilitiesAdded,
        recurringTransactions: recurringAdded,
        transactions: transactionsAdded,
      },
    });
  } catch (error) {
    console.error('Error filling empty steps:', error);
    return NextResponse.json({ error: 'Failed to fill empty steps' }, { status: 500 });
  }
}

