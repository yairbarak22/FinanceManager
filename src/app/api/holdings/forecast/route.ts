import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateMonthsToIdealAllocation, validateAllocations } from '@/lib/investmentCalculations';
import { requireAuth, withUserId } from '@/lib/authHelpers';
import { Holding } from '@/lib/types';

// POST - Calculate forecast to ideal allocation
export async function POST(request: Request) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const { monthlyInvestment, tolerancePercent = 1 } = await request.json();

    // Validate investment amount
    if (monthlyInvestment === undefined || monthlyInvestment <= 0) {
      return NextResponse.json(
        { error: 'Monthly investment amount must be a positive number' },
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

    // Calculate forecast
    const forecast = calculateMonthsToIdealAllocation(
      holdings,
      monthlyInvestment,
      tolerancePercent
    );

    // Calculate current allocation status
    const currentTotal = holdings.reduce((sum, h) => sum + h.currentValue, 0);
    const currentAllocations = holdings.map(h => ({
      name: h.name,
      current: currentTotal > 0 ? (h.currentValue / currentTotal) * 100 : 0,
      target: h.targetAllocation,
      diff: currentTotal > 0 
        ? ((h.currentValue / currentTotal) * 100) - h.targetAllocation 
        : -h.targetAllocation,
    }));

    return NextResponse.json({
      monthsToIdeal: forecast.months,
      reachable: forecast.reachable,
      monthlyInvestment,
      tolerancePercent,
      currentAllocations,
      finalAllocations: forecast.finalAllocations,
      currentPortfolioValue: currentTotal,
      projectedPortfolioValue: currentTotal + (monthlyInvestment * forecast.months),
    });
  } catch (error) {
    console.error('Error calculating forecast:', error);
    return NextResponse.json(
      { error: 'Failed to calculate forecast' },
      { status: 500 }
    );
  }
}
