import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, withSharedAccount } from '@/lib/authHelpers';
import { analyzePortfolio, type Holding } from '@/lib/finance/engine';

/**
 * POST /api/portfolio/analyze
 * Analyze portfolio holdings with real-time market data
 */
export async function POST(request: Request) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const body = await request.json();
    let holdings: Holding[] = [];

    // Option 1: Use provided holdings array
    if (body.holdings && Array.isArray(body.holdings)) {
      holdings = body.holdings.filter(
        (h: Holding) => h.symbol && typeof h.quantity === 'number' && h.quantity > 0
      );
    }
    // Option 2: Fetch from database if no holdings provided
    else {
      const sharedWhere = await withSharedAccount(userId);
      const dbHoldings = await prisma.holding.findMany({
        where: {
          ...sharedWhere,
          symbol: { not: null },
        },
      });

      holdings = dbHoldings
        .filter(h => h.symbol && h.currentValue > 0)
        .map(h => ({
          symbol: h.symbol!,
          quantity: h.currentValue, // Treat currentValue as quantity for now
        }));
    }

    if (holdings.length === 0) {
      return NextResponse.json({
        equity: 0,
        equityILS: 0,
        beta: 0,
        dailyChangePercent: 0,
        dailyChangeILS: 0,
        diversificationScore: 0,
        sectorAllocation: [],
        holdings: [],
        riskLevel: 'moderate',
      });
    }

    const analysis = await analyzePortfolio(holdings);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Error analyzing portfolio:', error);
    return NextResponse.json(
      { error: 'Failed to analyze portfolio' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/portfolio/analyze
 * Analyze portfolio using holdings from database
 */
export async function GET() {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const sharedWhere = await withSharedAccount(userId);
    const dbHoldings = await prisma.holding.findMany({
      where: {
        ...sharedWhere,
        symbol: { not: null },
      },
    });

    const holdings: Holding[] = dbHoldings
      .filter(h => h.symbol && h.currentValue > 0)
      .map(h => ({
        id: h.id, // Include database ID for edit/delete
        symbol: h.symbol!,
        quantity: h.currentValue,
      }));

    if (holdings.length === 0) {
      return NextResponse.json({
        equity: 0,
        equityILS: 0,
        beta: 0,
        dailyChangePercent: 0,
        dailyChangeILS: 0,
        diversificationScore: 0,
        sectorAllocation: [],
        holdings: [],
        riskLevel: 'moderate',
      });
    }

    const analysis = await analyzePortfolio(holdings);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Error analyzing portfolio:', error);
    return NextResponse.json(
      { error: 'Failed to analyze portfolio' },
      { status: 500 }
    );
  }
}
