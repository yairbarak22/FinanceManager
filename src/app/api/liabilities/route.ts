import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, withSharedAccount } from '@/lib/authHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { saveCurrentMonthNetWorth } from '@/lib/netWorthHistory';
import { validateRequest } from '@/lib/validateRequest';
import { createLiabilitySchema } from '@/lib/validationSchemas';

export async function GET() {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    // Rate limiting
    const rateLimitResult = await checkRateLimit(`api:${userId}`, RATE_LIMITS.api);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'יותר מדי בקשות' }, { status: 429 });
    }

    // Use shared account to get liabilities from all members
    const sharedWhere = await withSharedAccount(userId);
    
    const liabilities = await prisma.liability.findMany({
      where: sharedWhere,
      orderBy: { createdAt: 'desc' },
    });
    
    return NextResponse.json(liabilities);
  } catch (error) {
    console.error('Error fetching liabilities:', error);
    return NextResponse.json({ error: 'Failed to fetch liabilities' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    // Rate limiting
    const rateLimitResult = await checkRateLimit(`api:${userId}`, RATE_LIMITS.api);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'יותר מדי בקשות' }, { status: 429 });
    }

    const { data, errorResponse } = await validateRequest(request, createLiabilitySchema);
    if (errorResponse) return errorResponse;

    const liability = await prisma.liability.create({
      data: {
        userId,
        name: data.name,
        type: data.type,
        totalAmount: data.totalAmount,
        monthlyPayment: data.monthlyPayment,
        interestRate: data.interestRate,
        loanTermMonths: data.loanTermMonths,
        startDate: data.startDate ? new Date(data.startDate) : new Date(),
        remainingAmount: data.totalAmount,
        loanMethod: data.loanMethod,
        hasInterestRebate: data.hasInterestRebate,
        isActiveInCashFlow: data.isActiveInCashFlow,
      },
    });
    
    // Update net worth history for current month
    await saveCurrentMonthNetWorth(userId);
    
    return NextResponse.json(liability);
  } catch (error) {
    console.error('Error creating liability:', error);
    return NextResponse.json({ error: 'Failed to create liability' }, { status: 500 });
  }
}
