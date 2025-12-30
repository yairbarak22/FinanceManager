/**
 * Smart Portfolio Finance Engine
 * Based on CAPM and Risk Diversification principles
 */

import yahooFinance from 'yahoo-finance2';

// Yahoo Finance Quote type (simplified)
interface YahooQuote {
  symbol?: string;
  shortName?: string;
  longName?: string;
  regularMarketPrice?: number;
  regularMarketChangePercent?: number;
  currency?: string;
  beta?: number;
  sector?: string;
}

// Yahoo Finance Chart type
interface YahooChartResult {
  quotes: Array<{
    date: Date;
    open?: number;
    high?: number;
    low?: number;
    close?: number;
    volume?: number;
  }>;
}

// Types
export interface Holding {
  symbol: string;
  quantity: number;
}

export interface EnrichedHolding {
  symbol: string;
  name: string;
  quantity: number;
  price: number;
  priceILS: number;
  value: number;
  valueILS: number;
  beta: number;
  sector: string;
  currency: string;
  changePercent: number;
  weight: number;
  sparklineData: number[];
}

export interface PortfolioAnalysis {
  equity: number;
  equityILS: number;
  beta: number;
  dailyChangePercent: number;
  dailyChangeILS: number;
  diversificationScore: number;
  sectorAllocation: { sector: string; value: number; percent: number }[];
  holdings: EnrichedHolding[];
  riskLevel: 'conservative' | 'moderate' | 'aggressive';
}

// USD/ILS exchange rate cache
let usdIlsRate: number | null = null;
let rateLastFetched: number = 0;
const RATE_CACHE_MS = 60 * 60 * 1000; // 1 hour

/**
 * Get USD to ILS exchange rate
 */
async function getUsdIlsRate(): Promise<number> {
  const now = Date.now();

  if (usdIlsRate && (now - rateLastFetched) < RATE_CACHE_MS) {
    return usdIlsRate;
  }

  try {
    const quote = await yahooFinance.quote('USDILS=X') as { regularMarketPrice?: number };
    usdIlsRate = quote.regularMarketPrice ?? 3.7;
    rateLastFetched = now;
    return usdIlsRate;
  } catch (error) {
    console.error('Error fetching USD/ILS rate:', error);
    return usdIlsRate ?? 3.7; // Fallback rate
  }
}

/**
 * Get 7-day price history for sparkline
 */
async function getSparklineData(symbol: string): Promise<number[]> {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 10); // Get 10 days to ensure 7 trading days

    const history = await yahooFinance.chart(symbol, {
      period1: startDate,
      period2: endDate,
      interval: '1d',
    }) as YahooChartResult;

    if (!history.quotes || history.quotes.length === 0) {
      return [];
    }

    // Get last 7 data points
    return history.quotes
      .slice(-7)
      .map(q => q.close ?? 0)
      .filter(p => p > 0);
  } catch (error) {
    console.error(`Error fetching sparkline for ${symbol}:`, error);
    return [];
  }
}

/**
 * Fetch enriched data for a single holding
 */
async function enrichHolding(
  holding: Holding,
  exchangeRate: number
): Promise<EnrichedHolding | null> {
  try {
    const [quote, sparklineData] = await Promise.all([
      yahooFinance.quote(holding.symbol) as Promise<YahooQuote>,
      getSparklineData(holding.symbol),
    ]);

    const price = quote.regularMarketPrice ?? 0;
    const currency = quote.currency ?? 'USD';
    const isILS = currency === 'ILS';
    const rate = isILS ? 1 : exchangeRate;

    const value = price * holding.quantity;
    const valueILS = value * rate;

    return {
      symbol: holding.symbol,
      name: quote.shortName ?? quote.longName ?? holding.symbol,
      quantity: holding.quantity,
      price,
      priceILS: price * rate,
      value,
      valueILS,
      beta: quote.beta ?? 1.0, // Default beta = 1 (market)
      sector: quote.sector ?? 'Unknown',
      currency,
      changePercent: quote.regularMarketChangePercent ?? 0,
      weight: 0, // Will be calculated after all holdings
      sparklineData,
    };
  } catch (error) {
    console.error(`Error enriching holding ${holding.symbol}:`, error);
    return null;
  }
}

/**
 * Calculate diversification score (0-100)
 * Based on number of sectors and concentration
 */
function calculateDiversificationScore(
  sectorAllocation: { sector: string; value: number; percent: number }[]
): number {
  if (sectorAllocation.length === 0) return 0;

  // Factor 1: Number of sectors (max 11 GICS sectors)
  const sectorCountScore = Math.min(sectorAllocation.length / 8, 1) * 40;

  // Factor 2: Concentration (Herfindahl-Hirschman Index)
  // Lower HHI = better diversification
  const hhi = sectorAllocation.reduce((sum, s) => sum + Math.pow(s.percent / 100, 2), 0);
  const hhiScore = (1 - hhi) * 60; // HHI of 0 = perfect, HHI of 1 = concentrated

  return Math.round(sectorCountScore + hhiScore);
}

/**
 * Determine risk level based on portfolio beta
 */
function getRiskLevel(beta: number): 'conservative' | 'moderate' | 'aggressive' {
  if (beta < 0.8) return 'conservative';
  if (beta <= 1.2) return 'moderate';
  return 'aggressive';
}

/**
 * Main analysis function
 */
export async function analyzePortfolio(holdings: Holding[]): Promise<PortfolioAnalysis> {
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

  // Get exchange rate
  const exchangeRate = await getUsdIlsRate();

  // Enrich all holdings in parallel
  const enrichedResults = await Promise.all(
    holdings.map(h => enrichHolding(h, exchangeRate))
  );

  // Filter out failed fetches
  const enrichedHoldings = enrichedResults.filter((h): h is EnrichedHolding => h !== null);

  if (enrichedHoldings.length === 0) {
    throw new Error('Failed to fetch data for any holdings');
  }

  // Calculate total equity
  const totalEquityILS = enrichedHoldings.reduce((sum, h) => sum + h.valueILS, 0);
  const totalEquity = enrichedHoldings.reduce((sum, h) => sum + h.value, 0);

  // Calculate weights and weighted metrics
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

  // Calculate diversification score
  const diversificationScore = calculateDiversificationScore(sectorAllocation);

  return {
    equity: totalEquity,
    equityILS: totalEquityILS,
    beta: Math.round(portfolioBeta * 100) / 100,
    dailyChangePercent: Math.round(dailyChangePercent * 100) / 100,
    dailyChangeILS: Math.round(dailyChangeILS),
    diversificationScore,
    sectorAllocation,
    holdings: enrichedHoldings.sort((a, b) => b.valueILS - a.valueILS),
    riskLevel: getRiskLevel(portfolioBeta),
  };
}

/**
 * Get quote for a single symbol (for search/validation)
 */
export async function getQuote(symbol: string) {
  try {
    const quote = await yahooFinance.quote(symbol) as YahooQuote;
    return {
      symbol: quote.symbol,
      name: quote.shortName ?? quote.longName ?? symbol,
      price: quote.regularMarketPrice ?? 0,
      currency: quote.currency ?? 'USD',
      changePercent: quote.regularMarketChangePercent ?? 0,
    };
  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, error);
    return null;
  }
}

// Yahoo Search Result type
interface YahooSearchResult {
  quotes: Array<{
    symbol: string;
    shortname?: string;
    longname?: string;
    exchange?: string;
    quoteType?: string;
  }>;
}

/**
 * Search for symbols
 */
export async function searchSymbols(query: string) {
  try {
    const results = await yahooFinance.search(query) as YahooSearchResult;
    return results.quotes
      .filter(q => q.quoteType === 'EQUITY' || q.quoteType === 'ETF')
      .slice(0, 10)
      .map(q => ({
        symbol: q.symbol,
        name: q.shortname ?? q.longname ?? q.symbol,
        exchange: q.exchange,
        type: q.quoteType,
      }));
  } catch (error) {
    console.error(`Error searching for ${query}:`, error);
    return [];
  }
}
