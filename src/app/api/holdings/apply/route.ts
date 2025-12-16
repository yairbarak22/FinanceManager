import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateInvestmentAllocation, validateAllocations } from '@/lib/investmentCalculations';
import { requireAuth, withUserId, withIdAndUserId } from '@/lib/authHelpers';
import { Holding } from '@/lib/types';

// POST - Apply investment to holdings
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

    // Apply the investments - update each holding's currentValue (with user check)
    const updatePromises = calculations.map(calc => 
      prisma.holding.updateMany({
        where: withIdAndUserId(calc.holdingId, userId),
        data: { currentValue: calc.newValue },
      })
    );

    await Promise.all(updatePromises);

    // Get updated holdings
    const updatedHoldings = await prisma.holding.findMany({
      where: withUserId(userId),
      orderBy: { targetAllocation: 'desc' },
    });

    // Calculate summary
    const currentTotal = holdings.reduce((sum, h) => sum + h.currentValue, 0);
    const newTotal = currentTotal + investmentAmount;

    return NextResponse.json({
      success: true,
      message: `השקעה של ₪${investmentAmount.toLocaleString()} הוכנסה בהצלחה`,
      holdings: updatedHoldings,
      summary: {
        investmentAmount,
        previousPortfolioValue: currentTotal,
        newPortfolioValue: newTotal,
      },
    });
  } catch (error) {
    console.error('Error applying investment:', error);
    return NextResponse.json(
      { error: 'Failed to apply investment' },
      { status: 500 }
    );
  }
}
