import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authHelpers';
import { searchSymbols, getQuote } from '@/lib/finance/marketService';
import { searchHebrew } from '@/lib/finance/enrichmentService';
import { normalizeSymbol } from '@/lib/finance/providers/eod';

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

    // Check if query contains Hebrew characters
    const hasHebrew = /[\u0590-\u05FF]/.test(query);
    
    // Search Hebrew enrichment DB first if query is in Hebrew
    let hebrewResults: Array<{
      symbol: string;
      name: string;
      nameHe: string;
      exchange: string;
      type: string;
      provider: 'EOD';
      isEnriched: boolean;
    }> = [];
    
    if (hasHebrew) {
      const enrichmentResults = await searchHebrew(query);
      hebrewResults = enrichmentResults.map(enrichment => ({
        symbol: enrichment.symbol,
        name: enrichment.nameHe, // Use Hebrew name as primary
        nameHe: enrichment.nameHe,
        exchange: 'תל אביב',
        type: enrichment.assetType.toLowerCase() as any,
        provider: 'EOD' as const,
        isEnriched: true,
      }));
    }

    // Search EOD API
    const eodSearchResults = await searchSymbols(query);

    // Merge results: Hebrew first, then EOD
    // Remove duplicates (by symbol) - prefer Hebrew results
    const allResults = [...hebrewResults, ...eodSearchResults];
    const seenSymbols = new Set<string>();
    const uniqueResults = allResults.filter(result => {
      const normalized = normalizeSymbol(result.symbol);
      if (seenSymbols.has(normalized)) {
        return false;
      }
      seenSymbols.add(normalized);
      return true;
    });

    // Enrich top results with live data
    const enrichedResults = await Promise.all(
      uniqueResults.slice(0, 10).map(async (result) => {
        try {
          const quote = await getQuote(result.symbol);
          return {
            symbol: result.symbol,
            name: result.name,
            nameHe: result.nameHe || quote?.nameHe,
            exchange: result.exchange,
            type: result.type,
            provider: result.provider,
            price: quote?.price ?? 0,
            priceILS: quote?.priceILS ?? 0,
            currency: quote?.currency ?? 'USD',
            changePercent: quote?.changePercent ?? 0,
            beta: quote?.beta,
            sector: quote?.sector,
            sectorHe: quote?.sectorHe,
            isEnriched: result.isEnriched || quote?.isEnriched || false,
            // Logo URL (try Clearbit for US stocks)
            logo: result.symbol.includes('.US') || !result.symbol.includes('.')
              ? `https://logo.clearbit.com/${result.symbol.toLowerCase().split('.')[0]}.com`
              : null,
          };
        } catch {
          return {
            symbol: result.symbol,
            name: result.name,
            nameHe: result.nameHe,
            exchange: result.exchange,
            type: result.type,
            provider: result.provider,
            price: 0,
            priceILS: 0,
            currency: 'USD',
            changePercent: 0,
            isEnriched: result.isEnriched || false,
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
