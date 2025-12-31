import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authHelpers';
import { searchSymbols, getQuote } from '@/lib/finance/marketService';

/**
 * GET /api/finance/search
 * Search across all exchanges using EOD Historical Data API
 * Supports: US stocks, Israeli stocks, ETFs, Crypto
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

    // Search both providers
    const searchResults = await searchSymbols(query);

    // Enrich top results with live data
    const enrichedResults = await Promise.all(
      searchResults.slice(0, 10).map(async (result) => {
        try {
          const quote = await getQuote(result.symbol);
          return {
            symbol: result.symbol,
            name: result.name,
            exchange: result.exchange,
            type: result.type,
            provider: result.provider,
            price: quote?.price ?? 0,
            priceILS: quote?.priceILS ?? 0,
            currency: quote?.currency ?? 'USD',
            changePercent: quote?.changePercent ?? 0,
            beta: quote?.beta,
            sector: quote?.sector,
            // Logo URL (try Clearbit for US stocks)
            logo: result.symbol.includes('.US') || !result.symbol.includes('.')
              ? `https://logo.clearbit.com/${result.symbol.toLowerCase().split('.')[0]}.com`
              : null,
          };
        } catch {
          return {
            symbol: result.symbol,
            name: result.name,
            exchange: result.exchange,
            type: result.type,
            provider: result.provider,
            price: 0,
            priceILS: 0,
            currency: 'USD',
            changePercent: 0,
            logo: null,
          };
        }
      })
    );

    return NextResponse.json({
      results: enrichedResults,
      query,
      count: enrichedResults.length,
    });
  } catch (error) {
    console.error('Error searching stocks:', error);
    const message = error instanceof Error ? error.message : 'Search failed';
    return NextResponse.json(
      { error: message, results: [] },
      { status: 500 }
    );
  }
}
