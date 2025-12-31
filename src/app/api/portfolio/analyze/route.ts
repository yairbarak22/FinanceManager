import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, withSharedAccount } from '@/lib/authHelpers';
import { analyzePortfolio, detectAssetType } from '@/lib/finance/marketService';
import type { HybridHolding } from '@/lib/finance/types';

/**
 * POST /api/portfolio/analyze
 * Analyze portfolio holdings with EOD Historical Data API
 */
export async function POST(request: Request) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const body = await request.json();
    let holdings: HybridHolding[] = [];

    // Option 1: Use provided holdings array
    if (body.holdings && Array.isArray(body.holdings)) {
      holdings = body.holdings
        .filter((h: { symbol?: string; quantity?: number }) =>
          h.symbol && typeof h.quantity === 'number' && h.quantity > 0
        )
        .map((h: { symbol: string; quantity: number; provider?: string; currency?: string }) => {
          const assetInfo = detectAssetType(h.symbol);
          return {
            symbol: h.symbol,
            quantity: h.quantity,
            provider: 'EOD' as const,
            currency: (h.currency || (assetInfo.isIsraeli ? 'ILS' : 'USD')) as 'USD' | 'ILS',
          };
        });
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
        .map(h => {
          const assetInfo = detectAssetType(h.symbol!);
          return {
            symbol: h.symbol!,
            quantity: h.currentValue,
            provider: 'EOD' as const,
            currency: (h.currency as 'USD' | 'ILS') || (assetInfo.isIsraeli ? 'ILS' : 'USD'),
          };
        });
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
    console.error('Error analyzing portfolio (POST):', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to analyze portfolio: ${errorMessage}` },
      { status: 500 }
    );
  }
}

/**
 * GET /api/portfolio/analyze
 * Analyze portfolio using holdings from database (EOD Historical Data API)
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

    const holdings: HybridHolding[] = dbHoldings
      .filter(h => h.symbol && h.currentValue > 0)
      .map(h => {
        const assetInfo = detectAssetType(h.symbol!);
        return {
          id: h.id, // Include database ID for edit/delete
          symbol: h.symbol!,
          quantity: h.currentValue,
          provider: 'EOD' as const,
          currency: (h.currency as 'USD' | 'ILS') || (assetInfo.isIsraeli ? 'ILS' : 'USD'),
        };
      });

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
    console.error('Error analyzing portfolio (GET):', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to analyze portfolio: ${errorMessage}` },
      { status: 500 }
    );
  }
}
