import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, withSharedAccount } from '@/lib/authHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { saveCurrentMonthNetWorth } from '@/lib/netWorthHistory';
import { validateRequest } from '@/lib/validateRequest';
import { createLiabilitySchema, createMortgageSchema } from '@/lib/validationSchemas';

export async function GET() {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const rateLimitResult = await checkRateLimit(`api:${userId}`, RATE_LIMITS.api);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'יותר מדי בקשות' }, { status: 429 });
    }

    const sharedWhere = await withSharedAccount(userId);
    
    const liabilities = await prisma.liability.findMany({
      where: sharedWhere,
      orderBy: { createdAt: 'desc' },
      include: { tracks: { orderBy: { order: 'asc' } } },
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

    const rateLimitResult = await checkRateLimit(`api:${userId}`, RATE_LIMITS.api);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'יותר מדי בקשות' }, { status: 429 });
    }

    const body = await request.clone().json();

    if (body.isMortgage) {
      return handleMortgageCreate(request, userId, body);
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
    
    await saveCurrentMonthNetWorth(userId);
    
    return NextResponse.json(liability);
  } catch (error) {
    console.error('Error creating liability:', error);
    return NextResponse.json({ error: 'Failed to create liability' }, { status: 500 });
  }
}

async function handleMortgageCreate(request: NextRequest, userId: string, body: Record<string, unknown>) {
  const parsed = createMortgageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid mortgage data', details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const totalAmount = data.tracks.reduce((s, t) => s + t.amount, 0);
  const totalMonthly = data.tracks.reduce((s, t) => s + t.monthlyPayment, 0);
  const maxTerm = Math.max(...data.tracks.map(t => t.termMonths));
  const weightedRate = totalAmount > 0
    ? data.tracks.reduce((s, t) => s + t.interestRate * (t.amount / totalAmount), 0)
    : 0;

  const liability = await prisma.liability.create({
    data: {
      userId,
      name: data.name,
      type: 'mortgage',
      totalAmount,
      monthlyPayment: totalMonthly,
      interestRate: Math.round(weightedRate * 100) / 100,
      loanTermMonths: maxTerm,
      startDate: new Date(data.startDate),
      remainingAmount: totalAmount,
      loanMethod: 'spitzer',
      isMortgage: true,
      tracks: {
        create: data.tracks.map(t => ({
          trackType: t.trackType,
          amount: t.amount,
          termMonths: t.termMonths,
          termYears: t.termYears,
          interestRate: t.interestRate,
          loanMethod: t.loanMethod,
          monthlyPayment: t.monthlyPayment,
          order: t.order,
        })),
      },
    },
    include: { tracks: { orderBy: { order: 'asc' } } },
  });

  await saveCurrentMonthNetWorth(userId);
  return NextResponse.json(liability);
}
