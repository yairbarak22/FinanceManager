/**
 * Market Service - Pure EOD Architecture with Fundamentals API
 * Using "All World Extended" plan for direct Beta retrieval
 *
 * Features:
 * - Real-time/EOD prices for all markets
 * - Beta from Fundamentals API (no manual calculation needed)
 * - Sector classification from EOD
 * - USD/ILS exchange rate with fallback
 * - 7-day caching for fundamentals data
 */

import { eodProvider, normalizeSymbol, detectAssetType } from './providers/eod';
import type {
  AssetData,
  SearchResult,
  QuoteData,
  EnrichedHolding,
  HybridHolding,
  PortfolioAnalysis,
  SectorAllocation,
  RiskLevel,
} from './types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Get USD to ILS exchange rate
 * Delegates to EOD provider (with caching and fallback)
 */
export async function getUsdIlsRate(): Promise<number> {
  return eodProvider.getUsdIlsRate();
}

/**
 * Get quote for any symbol with Beta and Sector from Fundamentals API
 */
export async function getQuote(symbol: string): Promise<QuoteData | null> {
  // Use enriched quote which fetches price + fundamentals in parallel
  const enrichedQuote = await eodProvider.getEnrichedQuote(symbol);

  if (!enrichedQuote) {
    return null;
  }

  return {
    ...enrichedQuote,
    beta: enrichedQuote.beta,
    sector: enrichedQuote.sector,
  };
}

/**
 * Search for symbols across all exchanges
 * Delegates to EOD provider
 */
export async function searchSymbols(query: string): Promise<SearchResult[]> {
  return eodProvider.search(query);
}

/**
 * Enrich a single holding with market data
 * Fetches price + fundamentals in parallel from EOD
 */
async function enrichHolding(
  holding: HybridHolding,
  exchangeRate: number
): Promise<EnrichedHolding | null> {
  try {
    // Get enriched quote (price + fundamentals in parallel)
    const enrichedQuote = await eodProvider.getEnrichedQuote(holding.symbol);

    if (!enrichedQuote) {
      console.error(`[MarketService] No quote for ${holding.symbol}`);
      return null;
    }

    // Get sparkline (separate call, optional)
    let sparklineData: number[] = [];
    try {
      sparklineData = await eodProvider.getSparkline(holding.symbol);
    } catch {
      // Sparkline is optional - continue without it
    }

    // Calculate values
    const price = enrichedQuote.price;
    const currency = enrichedQuote.currency;
    const priceILS = currency === 'ILS' ? price : price * exchangeRate;
    const value = price * holding.quantity;
    const valueILS = priceILS * holding.quantity;

    return {
      id: holding.id,
      symbol: holding.symbol,
      name: enrichedQuote.name,
      quantity: holding.quantity,
      price,
      priceILS,
      value,
      valueILS,
      beta: enrichedQuote.beta,
      sector: enrichedQuote.sector,
      currency,
      provider: 'EOD',
      priceDisplayUnit: holding.priceDisplayUnit || 'ILS',
      changePercent: enrichedQuote.changePercent,
      weight: 0, // Calculated later
      sparklineData,
    };
  } catch (error) {
    console.error(`[MarketService] Error enriching ${holding.symbol}:`, error);
    return null;
  }
}

/**
 * Calculate diversification score (0-100)
 * Based on number of sectors and concentration (HHI)
 */
function calculateDiversificationScore(sectorAllocation: SectorAllocation[]): number {
  if (sectorAllocation.length === 0) return 0;

  // Factor 1: Number of sectors (max 40 points)
  const sectorCountScore = Math.min(sectorAllocation.length / 8, 1) * 40;

  // Factor 2: Concentration using Herfindahl-Hirschman Index (max 60 points)
  const hhi = sectorAllocation.reduce((sum, s) => sum + Math.pow(s.percent / 100, 2), 0);
  const hhiScore = (1 - hhi) * 60;

  return Math.round(sectorCountScore + hhiScore);
}

/**
 * Determine risk level based on portfolio beta
 */
function getRiskLevel(beta: number): RiskLevel {
  if (beta < 0.8) return 'conservative';
  if (beta <= 1.2) return 'moderate';
  return 'aggressive';
}

/**
 * Main portfolio analysis function
 * Enriches all holdings and calculates portfolio metrics
 */
export async function analyzePortfolio(holdings: HybridHolding[]): Promise<PortfolioAnalysis> {
  if (holdings.length === 0) {
    return {
      equity: 0,
      equityILS: 0,
      beta: 0,
      dailyChangePercent: 0,
      dailyChangeILS: 0,
      diversificationScore: 0,
      sectorAllocation: [],
      holdings: [],
      riskLevel: 'moderate',
    };
  }

  // Get exchange rate (with fallback - never fails)
  const exchangeRate = await eodProvider.getUsdIlsRate();

  // Enrich holdings sequentially with small delay to be nice to the API
  const enrichedHoldings: EnrichedHolding[] = [];
  for (const holding of holdings) {
    const enriched = await enrichHolding(holding, exchangeRate);
    if (enriched) {
      enrichedHoldings.push(enriched);
    }
    // Small delay between holdings
    if (holdings.indexOf(holding) < holdings.length - 1) {
      await delay(150);
    }
  }

  if (enrichedHoldings.length === 0) {
    throw new Error('Failed to fetch data for any holdings');
  }

  // Calculate totals
  const totalEquityILS = enrichedHoldings.reduce((sum, h) => sum + h.valueILS, 0);
  const totalEquity = enrichedHoldings.reduce((sum, h) => sum + h.value, 0);

  // Calculate weights and metrics
  let portfolioBeta = 0;
  let dailyChangeILS = 0;

  enrichedHoldings.forEach(h => {
    h.weight = totalEquityILS > 0 ? (h.valueILS / totalEquityILS) * 100 : 0;
    portfolioBeta += (h.beta * h.weight) / 100;
    dailyChangeILS += (h.changePercent / 100) * h.valueILS;
  });

  const dailyChangePercent = totalEquityILS > 0 ? (dailyChangeILS / totalEquityILS) * 100 : 0;

  // Calculate sector allocation
  const sectorMap = new Map<string, number>();
  enrichedHoldings.forEach(h => {
    const current = sectorMap.get(h.sector) ?? 0;
    sectorMap.set(h.sector, current + h.valueILS);
  });

  const sectorAllocation = Array.from(sectorMap.entries())
    .map(([sector, value]) => ({
      sector,
      value,
      percent: totalEquityILS > 0 ? (value / totalEquityILS) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);

  return {
    equity: totalEquity,
    equityILS: totalEquityILS,
    beta: Math.round(portfolioBeta * 100) / 100,
    dailyChangePercent: Math.round(dailyChangePercent * 100) / 100,
    dailyChangeILS: Math.round(dailyChangeILS),
    diversificationScore: calculateDiversificationScore(sectorAllocation),
    sectorAllocation,
    holdings: enrichedHoldings.sort((a, b) => b.valueILS - a.valueILS),
    riskLevel: getRiskLevel(portfolioBeta),
  };
}

/**
 * Export provider and utilities for direct access
 */
export { eodProvider, normalizeSymbol, detectAssetType };
