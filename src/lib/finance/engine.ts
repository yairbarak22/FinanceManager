/**
 * Smart Portfolio Finance Engine
 * Based on CAPM and Risk Diversification principles
 */

import YahooFinance from 'yahoo-finance2';

// Initialize yahoo-finance2 v3 instance with suppressed notices
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

// Yahoo Finance Quote type (simplified)
interface YahooQuote {
  symbol?: string;
  shortName?: string;
  longName?: string;
  regularMarketPrice?: number;
  regularMarketChangePercent?: number;
  currency?: string;
}

// Yahoo Finance QuoteSummary types
interface YahooQuoteSummary {
  summaryDetail?: {
    beta?: number;
  };
  assetProfile?: {
    sector?: string;
    industry?: string;
  };
  fundProfile?: {
    categoryName?: string;
    family?: string;
    legalType?: string;
  };
  defaultKeyStatistics?: {
    beta3Year?: number;
  };
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
  id?: string; // Database ID (optional)
  symbol: string;
  quantity: number;
}

export interface EnrichedHolding {
  id?: string; // Database ID (optional)
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

// Beta/Sector cache to reduce API calls
const betaSectorCache = new Map<string, { beta: number; sector: string; timestamp: number }>();
const BETA_CACHE_MS = 24 * 60 * 60 * 1000; // 24 hours (beta doesn't change often)

// Simple delay function for rate limiting
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Retry with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      // Check if it's a rate limit error
      if (lastError.message.includes('Too Many Requests') || lastError.message.includes('429')) {
        const delayTime = baseDelayMs * Math.pow(2, i); // Exponential backoff
        console.log(`Rate limited, waiting ${delayTime}ms before retry ${i + 1}/${maxRetries}`);
        await delay(delayTime);
      } else {
        throw lastError; // Don't retry non-rate-limit errors
      }
    }
  }
  throw lastError;
}

// Process items with rate limiting (sequential with delay)
async function processWithThrottle<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  delayMs: number = 500
): Promise<R[]> {
  const results: R[] = [];
  for (const item of items) {
    const result = await processor(item);
    results.push(result);
    if (items.indexOf(item) < items.length - 1) {
      await delay(delayMs);
    }
  }
  return results;
}

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
 * Fetch beta and sector from quoteSummary
 * Handles both stocks (assetProfile) and ETFs (fundProfile)
 * Uses cache to reduce API calls (beta doesn't change frequently)
 */
async function getBetaAndSector(symbol: string): Promise<{ beta: number; sector: string }> {
  const now = Date.now();

  // Check cache first
  const cached = betaSectorCache.get(symbol);
  if (cached && (now - cached.timestamp) < BETA_CACHE_MS) {
    return { beta: cached.beta, sector: cached.sector };
  }

  try {
    const summary = await retryWithBackoff(
      () => yahooFinance.quoteSummary(symbol, {
        modules: ['summaryDetail', 'assetProfile', 'fundProfile', 'defaultKeyStatistics'],
      }) as Promise<YahooQuoteSummary>,
      3,
      2000
    );

    // Beta: prefer summaryDetail.beta (stocks), fall back to defaultKeyStatistics.beta3Year (ETFs)
    let beta = summary.summaryDetail?.beta;
    if (beta === undefined || beta === null) {
      beta = summary.defaultKeyStatistics?.beta3Year ?? 1.0;
    }

    // Sector: try assetProfile first (stocks), then fundProfile.categoryName (ETFs)
    let sector = summary.assetProfile?.sector;
    if (!sector && summary.fundProfile?.categoryName) {
      sector = summary.fundProfile.categoryName;
    }

    const result = {
      beta,
      sector: sector ?? 'Unknown',
    };

    // Cache the result
    betaSectorCache.set(symbol, { ...result, timestamp: now });

    return result;
  } catch (error) {
    console.error(`Error fetching beta/sector for ${symbol}:`, error);
    // Return cached value if available (even if expired), otherwise defaults
    if (cached) {
      return { beta: cached.beta, sector: cached.sector };
    }
    return { beta: 1.0, sector: 'Unknown' };
  }
}

/**
 * Fetch enriched data for a single holding
 * Uses sequential requests with retry to avoid Yahoo rate limits
 */
async function enrichHolding(
  holding: Holding,
  exchangeRate: number
): Promise<EnrichedHolding | null> {
  try {
    // Sequential requests with retry and longer delays
    const quote = await retryWithBackoff(
      () => yahooFinance.quote(holding.symbol) as Promise<YahooQuote>,
      3,
      2000
    );
    await delay(500);
    const betaSector = await getBetaAndSector(holding.symbol);
    await delay(500);
    const sparklineData = await getSparklineData(holding.symbol);

    const price = quote.regularMarketPrice ?? 0;
    const currency = quote.currency ?? 'USD';
    const isILS = currency === 'ILS';
    const rate = isILS ? 1 : exchangeRate;

    const value = price * holding.quantity;
    const valueILS = value * rate;

    return {
      id: holding.id, // Pass through database ID
      symbol: holding.symbol,
      name: quote.shortName ?? quote.longName ?? holding.symbol,
      quantity: holding.quantity,
      price,
      priceILS: price * rate,
      value,
      valueILS,
      beta: betaSector.beta,
      sector: betaSector.sector,
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

  // Enrich holdings with throttling to avoid Yahoo rate limits (429)
  const enrichedResults = await processWithThrottle(
    holdings,
    (h) => enrichHolding(h, exchangeRate),
    1500 // 1.5s delay between each holding to avoid rate limits
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
    const [quote, betaSector] = await Promise.all([
      yahooFinance.quote(symbol) as Promise<YahooQuote>,
      getBetaAndSector(symbol),
    ]);

    return {
      symbol: quote.symbol,
      name: quote.shortName ?? quote.longName ?? symbol,
      price: quote.regularMarketPrice ?? 0,
      currency: quote.currency ?? 'USD',
      changePercent: quote.regularMarketChangePercent ?? 0,
      beta: betaSector.beta,
      sector: betaSector.sector,
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
