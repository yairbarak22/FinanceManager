import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authHelpers';
import { getQuote, detectAssetType } from '@/lib/finance/marketService';

/**
 * GET /api/finance/quote
 * Get quote for a specific symbol using EOD Historical Data API
 */
export async function GET(request: Request) {
  try {
    const { error } = await requireAuth();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol is required' },
        { status: 400 }
      );
    }

    const assetInfo = detectAssetType(symbol);
    const quote = await getQuote(symbol);

    if (!quote) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...quote,
      isIsraeli: assetInfo.isIsraeli,
      isCrypto: assetInfo.isCrypto,
    });
  } catch (error) {
    console.error('Error fetching quote:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch quote';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
