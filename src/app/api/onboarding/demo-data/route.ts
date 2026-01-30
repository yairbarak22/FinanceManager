/**
 * Demo Data API for Onboarding
 * Creates sample data for users who want to start with demo data
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/authHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { saveAssetHistory } from '@/lib/assetHistory';
import { saveCurrentMonthNetWorth } from '@/lib/netWorthHistory';

// POST - Create demo data for the user
export async function POST() {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    // Rate limiting
    const rateLimitResult = await checkRateLimit(`api:${userId}`, RATE_LIMITS.api);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'יותר מדי בקשות' }, { status: 429 });
    }

    const now = new Date();
    
    // Calculate start date for mortgage (4 years ago)
    const mortgageStartDate = new Date();
    mortgageStartDate.setFullYear(mortgageStartDate.getFullYear() - 4);

    // ============================================
    // CREATE ASSETS
    // ============================================
    
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

    // ============================================
    // CREATE LIABILITY
    // ============================================
    
    // Mortgage: 750,000 ILS, 4.5% interest, 30 years (360 months) started 4 years ago
    // Remaining: 360 - 48 = 312 months
    // Calculate monthly payment using Spitzer formula: P * r * (1+r)^n / ((1+r)^n - 1)
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
        remainingAmount: 750000, // This would be recalculated based on payments made
        monthlyPayment,
        interestRate: 4.5,
        loanTermMonths: 312, // 360 - 48 months elapsed
        startDate: mortgageStartDate,
        loanMethod: 'spitzer',
        hasInterestRebate: false,
      },
    });

    // ============================================
    // CREATE RECURRING TRANSACTIONS
    // ============================================
    
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

    // ============================================
    // CREATE TRANSACTIONS
    // ============================================
    
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

    // ============================================
    // UPDATE NET WORTH HISTORY
    // ============================================
    await saveCurrentMonthNetWorth(userId);

    // ============================================
    // MARK ONBOARDING AS COMPLETE
    // ============================================
    await prisma.user.update({
      where: { id: userId },
      data: { hasSeenOnboarding: true },
    });

    return NextResponse.json({ 
      success: true,
      message: 'נתוני הדמה נוספו בהצלחה!',
      data: {
        assets: 2,
        liabilities: 1,
        recurringTransactions: 2,
        transactions: 2,
      },
    });
  } catch (error) {
    console.error('Error creating demo data:', error);
    return NextResponse.json({ error: 'Failed to create demo data' }, { status: 500 });
  }
}

