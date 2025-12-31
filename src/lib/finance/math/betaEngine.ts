/**
 * Beta Engine - Real Beta Calculation from Historical Prices
 *
 * Uses CAPM Model: β = Cov(Rₐ, Rₘ) / Var(Rₘ)
 *
 * - Benchmark: S&P 500 (GSPC.INDX)
 * - Period: 3 years of monthly data
 * - Caching: 24h for benchmark, 7 days for calculated betas
 */

import { normalizeSymbol, detectAssetType } from '../providers/eod';

const EOD_API_TOKEN = process.env.EOD_API_TOKEN || '';
const EOD_BASE_URL = 'https://eodhistoricaldata.com/api';

// S&P 500 benchmark symbol
const BENCHMARK_SYMBOL = 'GSPC.INDX';

// Cache durations
const BENCHMARK_CACHE_MS = 24 * 60 * 60 * 1000; // 24 hours
const BETA_CACHE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Minimum months required for reliable beta calculation
const MIN_MONTHS_REQUIRED = 18;

// ============================================================================
// TYPES
// ============================================================================

interface HistoricalPrice {
  date: string;
  close: number;
}

interface MonthlyReturn {
  date: string; // YYYY-MM format
  return: number;
}

interface CachedBeta {
  beta: number;
  dataPoints: number;
  timestamp: number;
}

interface CachedBenchmark {
  returns: MonthlyReturn[];
  timestamp: number;
}

// ============================================================================
// CACHES
// ============================================================================

let benchmarkCache: CachedBenchmark | null = null;
const betaCache = new Map<string, CachedBeta>();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Fetch historical EOD prices from API
 */
async function fetchHistoricalPrices(symbol: string, months: number = 36): Promise<HistoricalPrice[]> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months - 1); // Extra month for return calculation

  const url = new URL(`${EOD_BASE_URL}/eod/${symbol}`);
  url.searchParams.set('api_token', EOD_API_TOKEN);
  url.searchParams.set('fmt', 'json');
  url.searchParams.set('period', 'm'); // Monthly data
  url.searchParams.set('from', startDate.toISOString().split('T')[0]);
  url.searchParams.set('to', endDate.toISOString().split('T')[0]);

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`EOD API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (!Array.isArray(data)) {
    return [];
  }

  return data.map((d: { date: string; close: number; adjusted_close?: number }) => ({
    date: d.date,
    close: d.adjusted_close || d.close,
  }));
}

/**
 * Calculate monthly percentage returns from price array
 */
function calculateMonthlyReturns(prices: HistoricalPrice[]): MonthlyReturn[] {
  if (prices.length < 2) return [];

  // Sort by date ascending
  const sorted = [...prices].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const returns: MonthlyReturn[] = [];

  for (let i = 1; i < sorted.length; i++) {
    const prevPrice = sorted[i - 1].close;
    const currPrice = sorted[i].close;

    if (prevPrice > 0) {
      const monthlyReturn = (currPrice - prevPrice) / prevPrice;
      // Use YYYY-MM format for alignment
      const dateKey = sorted[i].date.substring(0, 7);
      returns.push({ date: dateKey, return: monthlyReturn });
    }
  }

  return returns;
}

/**
 * Calculate mean of an array
 */
function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((sum, val) => sum + val, 0) / arr.length;
}

/**
 * Calculate variance of an array
 */
function variance(arr: number[]): number {
  if (arr.length < 2) return 0;
  const avg = mean(arr);
  const squaredDiffs = arr.map(val => Math.pow(val - avg, 2));
  return squaredDiffs.reduce((sum, val) => sum + val, 0) / (arr.length - 1);
}

/**
 * Calculate covariance between two arrays
 */
function covariance(arr1: number[], arr2: number[]): number {
  if (arr1.length !== arr2.length || arr1.length < 2) return 0;

  const mean1 = mean(arr1);
  const mean2 = mean(arr2);

  let sum = 0;
  for (let i = 0; i < arr1.length; i++) {
    sum += (arr1[i] - mean1) * (arr2[i] - mean2);
  }

  return sum / (arr1.length - 1);
}

/**
 * Align two return arrays by matching dates
 */
function alignReturns(
  assetReturns: MonthlyReturn[],
  benchmarkReturns: MonthlyReturn[]
): { assetValues: number[]; benchmarkValues: number[] } {
  const benchmarkMap = new Map(benchmarkReturns.map(r => [r.date, r.return]));

  const assetValues: number[] = [];
  const benchmarkValues: number[] = [];

  for (const assetReturn of assetReturns) {
    const benchmarkReturn = benchmarkMap.get(assetReturn.date);
    if (benchmarkReturn !== undefined) {
      assetValues.push(assetReturn.return);
      benchmarkValues.push(benchmarkReturn);
    }
  }

  return { assetValues, benchmarkValues };
}

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * Get S&P 500 benchmark returns (cached for 24h)
 */
async function getBenchmarkReturns(): Promise<MonthlyReturn[]> {
  const now = Date.now();

  // Return cached if valid
  if (benchmarkCache && (now - benchmarkCache.timestamp) < BENCHMARK_CACHE_MS) {
    return benchmarkCache.returns;
  }

  console.log('[BetaEngine] Fetching S&P 500 benchmark data...');

  try {
    const prices = await fetchHistoricalPrices(BENCHMARK_SYMBOL, 36);
    const returns = calculateMonthlyReturns(prices);

    benchmarkCache = {
      returns,
      timestamp: now,
    };

    console.log(`[BetaEngine] Benchmark cached: ${returns.length} monthly returns`);
    return returns;
  } catch (error) {
    console.error('[BetaEngine] Failed to fetch benchmark:', error);

    // Return cached even if expired
    if (benchmarkCache) {
      return benchmarkCache.returns;
    }

    return [];
  }
}

/**
 * Calculate Beta for a given symbol
 *
 * β = Cov(Rₐ, Rₘ) / Var(Rₘ)
 *
 * Returns:
 * - Calculated beta (typically between -1 and 3)
 * - 1.0 as default if insufficient data
 */
export async function calculateBeta(symbol: string): Promise<{ beta: number; dataPoints: number; source: string }> {
  const normalizedSymbol = normalizeSymbol(symbol);
  const { isIsraeli, isCrypto } = detectAssetType(symbol);
  const now = Date.now();

  // Check cache first
  const cached = betaCache.get(normalizedSymbol);
  if (cached && (now - cached.timestamp) < BETA_CACHE_MS) {
    return {
      beta: cached.beta,
      dataPoints: cached.dataPoints,
      source: 'cache'
    };
  }

  // Special cases: Crypto has no meaningful beta vs S&P
  if (isCrypto) {
    return { beta: 1.5, dataPoints: 0, source: 'default_crypto' };
  }

  try {
    // Fetch benchmark and asset data in parallel
    const [benchmarkReturns, assetPrices] = await Promise.all([
      getBenchmarkReturns(),
      fetchHistoricalPrices(normalizedSymbol, 36),
    ]);

    if (benchmarkReturns.length === 0) {
      console.warn(`[BetaEngine] No benchmark data available`);
      return { beta: 1.0, dataPoints: 0, source: 'no_benchmark' };
    }

    const assetReturns = calculateMonthlyReturns(assetPrices);

    if (assetReturns.length < MIN_MONTHS_REQUIRED) {
      console.log(`[BetaEngine] ${normalizedSymbol}: Only ${assetReturns.length} months (need ${MIN_MONTHS_REQUIRED}), using default`);
      const defaultBeta = isIsraeli ? 0.9 : 1.0;
      return { beta: defaultBeta, dataPoints: assetReturns.length, source: 'insufficient_data' };
    }

    // Align returns by date
    const { assetValues, benchmarkValues } = alignReturns(assetReturns, benchmarkReturns);

    if (assetValues.length < MIN_MONTHS_REQUIRED) {
      console.log(`[BetaEngine] ${normalizedSymbol}: Only ${assetValues.length} aligned months, using default`);
      const defaultBeta = isIsraeli ? 0.9 : 1.0;
      return { beta: defaultBeta, dataPoints: assetValues.length, source: 'insufficient_aligned' };
    }

    // Calculate Beta: Cov(Ra, Rm) / Var(Rm)
    const cov = covariance(assetValues, benchmarkValues);
    const benchmarkVar = variance(benchmarkValues);

    if (benchmarkVar === 0) {
      return { beta: 1.0, dataPoints: assetValues.length, source: 'zero_variance' };
    }

    let beta = cov / benchmarkVar;

    // Sanity check: Beta should typically be between -1 and 4
    if (beta < -1) beta = -1;
    if (beta > 4) beta = 4;

    // Round to 2 decimal places
    beta = Math.round(beta * 100) / 100;

    // Cache the result
    betaCache.set(normalizedSymbol, {
      beta,
      dataPoints: assetValues.length,
      timestamp: now,
    });

    console.log(`[BetaEngine] ${normalizedSymbol}: Beta=${beta} (${assetValues.length} data points)`);

    return { beta, dataPoints: assetValues.length, source: 'calculated' };

  } catch (error) {
    console.error(`[BetaEngine] Error calculating beta for ${normalizedSymbol}:`, error);

    // Return cached if available
    if (cached) {
      return { beta: cached.beta, dataPoints: cached.dataPoints, source: 'cache_fallback' };
    }

    // Default based on asset type
    const defaultBeta = isIsraeli ? 0.9 : 1.0;
    return { beta: defaultBeta, dataPoints: 0, source: 'error_default' };
  }
}

/**
 * Batch calculate betas for multiple symbols
 * Optimized: fetches benchmark once, then processes all assets
 */
export async function calculateBetasBatch(symbols: string[]): Promise<Map<string, { beta: number; dataPoints: number }>> {
  const results = new Map<string, { beta: number; dataPoints: number }>();

  // Pre-fetch benchmark
  await getBenchmarkReturns();

  // Calculate betas (with small delay to be nice to API)
  for (const symbol of symbols) {
    const { beta, dataPoints } = await calculateBeta(symbol);
    results.set(symbol, { beta, dataPoints });

    // Small delay between API calls
    if (symbols.indexOf(symbol) < symbols.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return results;
}

/**
 * Clear beta cache (useful for testing or forced refresh)
 */
export function clearBetaCache(): void {
  betaCache.clear();
  benchmarkCache = null;
  console.log('[BetaEngine] Cache cleared');
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  betasCached: number;
  benchmarkAge: number | null;
  benchmarkDataPoints: number;
} {
  return {
    betasCached: betaCache.size,
    benchmarkAge: benchmarkCache ? Date.now() - benchmarkCache.timestamp : null,
    benchmarkDataPoints: benchmarkCache?.returns.length || 0,
  };
}
