import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, withSharedAccount } from '@/lib/authHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { saveCurrentMonthNetWorth } from '@/lib/netWorthHistory';

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

    const body = await request.json();
    
    // Validate required fields
    if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    
    if (body.name.length > 100) {
      return NextResponse.json({ error: 'Name too long (max 100 characters)' }, { status: 400 });
    }
    
    if (!body.type || !['loan', 'mortgage'].includes(body.type)) {
      return NextResponse.json({ error: 'Type must be "loan" or "mortgage"' }, { status: 400 });
    }
    
    if (typeof body.totalAmount !== 'number' || body.totalAmount <= 0) {
      return NextResponse.json({ error: 'Total amount must be a positive number' }, { status: 400 });
    }
    
    if (typeof body.monthlyPayment !== 'number' || body.monthlyPayment < 0) {
      return NextResponse.json({ error: 'Monthly payment must be a non-negative number' }, { status: 400 });
    }
    
    // Validate optional fields
    const interestRate = body.interestRate ?? 0;
    if (typeof interestRate !== 'number' || interestRate < 0 || interestRate > 100) {
      return NextResponse.json({ error: 'Interest rate must be between 0 and 100' }, { status: 400 });
    }
    
    const loanTermMonths = body.loanTermMonths ?? 0;
    if (typeof loanTermMonths !== 'number' || loanTermMonths < 0) {
      return NextResponse.json({ error: 'Loan term must be a non-negative number' }, { status: 400 });
    }
    
    const liability = await prisma.liability.create({
      data: {
        userId,
        name: body.name.trim(),
        type: body.type,
        totalAmount: body.totalAmount,
        monthlyPayment: body.monthlyPayment,
        interestRate,
        loanTermMonths,
        startDate: body.startDate ? new Date(body.startDate) : new Date(),
        remainingAmount: body.totalAmount,
        loanMethod: body.loanMethod || 'spitzer',
        hasInterestRebate: body.hasInterestRebate || false,
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
