import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateInvestmentAllocation, validateAllocations } from '@/lib/investmentCalculations';
import { requireAuth, withUserId } from '@/lib/authHelpers';
import { Holding } from '@/lib/types';

// POST calculate investment allocation
export async function POST(request: Request) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const { investmentAmount } = await request.json();

    // Validate investment amount
    if (investmentAmount === undefined || investmentAmount <= 0) {
      return NextResponse.json(
        { error: 'Investment amount must be a positive number' },
        { status: 400 }
      );
    }

    // Get all holdings for this user
    const holdingsData = await prisma.holding.findMany({
      where: withUserId(userId),
      orderBy: { targetAllocation: 'desc' },
    });

    if (holdingsData.length === 0) {
      return NextResponse.json(
        { error: 'No holdings found. Please add holdings first.' },
        { status: 400 }
      );
    }

    // Convert to typed holdings
    const holdings: Holding[] = holdingsData.map(h => ({
      id: h.id,
      name: h.name,
      symbol: h.symbol || undefined,
      type: h.type as 'etf' | 'index_fund',
      currentValue: h.currentValue,
      targetAllocation: h.targetAllocation,
    }));

    // Validate allocations sum to 100%
    const validation = validateAllocations(holdings);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: validation.message,
          allocationTotal: validation.total,
        },
        { status: 400 }
      );
    }

    // Calculate the investment allocation
    const calculations = calculateInvestmentAllocation(holdings, investmentAmount);

    // Calculate summary
    const currentTotal = holdings.reduce((sum, h) => sum + h.currentValue, 0);
    const newTotal = currentTotal + investmentAmount;
    const totalToInvest = calculations.reduce((sum, c) => sum + c.amountToInvest, 0);

    return NextResponse.json({
      calculations,
      summary: {
        investmentAmount,
        currentPortfolioValue: currentTotal,
        newPortfolioValue: newTotal,
        totalAllocated: Math.round(totalToInvest * 100) / 100,
        holdingsCount: holdings.length,
      },
    });
  } catch (error) {
    console.error('Error calculating investment allocation:', error);
    return NextResponse.json(
      { error: 'Failed to calculate investment allocation' },
      { status: 500 }
    );
  }
}
