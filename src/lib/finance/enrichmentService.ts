/**
 * Security Enrichment Service
 * 
 * Provides Hebrew names and detailed sectors for Israeli securities
 * Acts as a local "dictionary" that overrides EOD API data for Israeli securities
 */

import { prisma } from '@/lib/prisma';
import { normalizeSymbol } from './providers/eod';
import type { AssetData, QuoteData } from './types';

export interface SecurityEnrichment {
  id: string;
  symbol: string;
  nameHe: string;
  shortNameHe: string | null;
  sectorHe: string;
  assetType: string;
  updatedAt: Date;
}

/**
 * Get enrichment data for a symbol
 * Returns null if no enrichment found (fallback to EOD)
 * Handles case-insensitive symbol matching
 */
export async function getEnrichment(symbol: string): Promise<SecurityEnrichment | null> {
  try {
    const normalizedSymbol = normalizeSymbol(symbol).toUpperCase();
    
    // First try exact match (faster)
    let enrichment = await prisma.securityEnrichment.findUnique({
      where: { symbol: normalizedSymbol },
    });

    // If not found, try case-insensitive search (for symbols like iSFF301.TA)
    if (!enrichment) {
      enrichment = await prisma.securityEnrichment.findFirst({
        where: {
          symbol: {
            equals: normalizedSymbol,
            mode: 'insensitive',
          },
        },
      });
    }

    return enrichment;
  } catch (error) {
    console.error(`[EnrichmentService] Error fetching enrichment for ${symbol}:`, error);
    return null;
  }
}

/**
 * Get enrichment data for multiple symbols in a single DB query
 * OPTIMIZED: Single query instead of N queries for N symbols
 * Returns a Map for O(1) lookup
 */
export async function getEnrichmentsBatch(symbols: string[]): Promise<Map<string, SecurityEnrichment>> {
  try {
    if (symbols.length === 0) {
      return new Map();
    }

    const normalizedSymbols = symbols.map(s => normalizeSymbol(s).toUpperCase());
    
    const enrichments = await prisma.securityEnrichment.findMany({
      where: {
        symbol: { in: normalizedSymbols }
      }
    });

    // Create a Map for O(1) lookup
    const enrichmentMap = new Map<string, SecurityEnrichment>();
    enrichments.forEach(e => {
      enrichmentMap.set(e.symbol, e);
    });

    return enrichmentMap;
  } catch (error) {
    console.error(`[EnrichmentService] Error fetching batch enrichments:`, error);
    return new Map();
  }
}

/**
 * Search for securities by Hebrew name
 * Case-insensitive search in nameHe field
 */
export async function searchHebrew(query: string): Promise<SecurityEnrichment[]> {
  try {
    // Only search if query contains Hebrew characters
    const hasHebrew = /[\u0590-\u05FF]/.test(query);
    if (!hasHebrew) {
      return [];
    }

    const results = await prisma.securityEnrichment.findMany({
      where: {
        nameHe: {
          contains: query,
          mode: 'insensitive',
        },
      },
      take: 20, // Limit results
    });

    return results;
  } catch (error) {
    console.error(`[EnrichmentService] Error searching Hebrew for "${query}":`, error);
    return [];
  }
}

/**
 * Enrich quote data with Hebrew information
 * Overrides name and sector if enrichment exists
 */
export function enrichQuoteData(
  quote: AssetData | QuoteData,
  enrichment: SecurityEnrichment | null
): AssetData | QuoteData {
  if (!enrichment) {
    return quote;
  }

  return {
    ...quote,
    name: enrichment.nameHe, // Override with Hebrew name
    // Add Hebrew fields to quote (will be typed in types.ts)
    ...(quote as any).sector && { sector: enrichment.sectorHe }, // Override sector if exists
  };
}

/**
 * Check if a symbol is Israeli based on enrichment existence
 */
export async function isIsraeliSecurity(symbol: string): Promise<boolean> {
  const enrichment = await getEnrichment(symbol);
  return enrichment !== null;
}

