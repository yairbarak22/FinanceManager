import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authHelpers';
import { searchSymbols, getQuote } from '@/lib/finance/engine';

/**
 * GET /api/finance/search
 * Search for stocks by symbol or name
 */
export async function GET(request: Request) {
  try {
    const { error } = await requireAuth();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 1) {
      return NextResponse.json({ results: [] });
    }

    // Search for symbols
    const searchResults = await searchSymbols(query);

    // For each result, try to get live price and beta
    const enrichedResults = await Promise.all(
      searchResults.slice(0, 8).map(async (result) => {
        try {
          const quote = await getQuote(result.symbol);
          return {
            symbol: result.symbol,
            name: result.name,
            exchange: result.exchange,
            type: result.type,
            price: quote?.price ?? 0,
            currency: quote?.currency ?? 'USD',
            changePercent: quote?.changePercent ?? 0,
            // Logo URL - use clearbit or fallback
            logo: `https://logo.clearbit.com/${result.symbol.toLowerCase().replace('.', '')}.com`,
          };
        } catch {
          return {
            symbol: result.symbol,
            name: result.name,
            exchange: result.exchange,
            type: result.type,
            price: 0,
            currency: 'USD',
            changePercent: 0,
            logo: null,
          };
        }
      })
    );

    return NextResponse.json({ results: enrichedResults });
  } catch (error) {
    console.error('Error searching stocks:', error);
    return NextResponse.json(
      { error: 'Failed to search stocks' },
      { status: 500 }
    );
  }
}
