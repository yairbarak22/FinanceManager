/**
 * EOD Historical Data Provider - SOLE DATA SOURCE
 * Using Historical Data API for prices + Custom Beta calculation
 *
 * Features:
 * - Real-time/EOD prices for all markets
 * - Beta calculated from 3-year historical data (CAPM model)
 * - USD/ILS exchange rate with fallback
 * - Sector estimation from symbol patterns
 *
 * Symbol Normalization:
 * - Israeli: 6-9 digits → {symbol}.TA
 * - US stocks: no suffix → {symbol}.US
 * - Crypto: *-USD → {symbol}.CC
 * - Already suffixed: use as-is
 */

import type {
  MarketDataProvider,
  AssetData,
  SearchResult,
  HistoricalPrice,
  AssetType,
} from '../types';
import { getEnrichment, enrichQuoteData } from '../enrichmentService';

const EOD_API_TOKEN = process.env.EOD_API_TOKEN || '';
const EOD_BASE_URL = 'https://eodhistoricaldata.com/api';

// ============================================================================
// TYPES - EOD API Response Structures
// ============================================================================

interface EODRealTimeQuote {
  code: string;
  timestamp?: number;
  gmtoffset?: number;
  open?: number;
  high?: number;
  low?: number;
  close: number;
  volume?: number;
  previousClose?: number;
  change?: number;
  change_p?: number;
}

interface EODHistoricalData {
  date: string;
  open?: number;
  high?: number;
  low?: number;
  close: number;
  adjusted_close?: number;
  volume?: number;
}

interface EODSearchResult {
  Code: string;
  Name: string;
  Exchange: string;
  Type: string;
  Country?: string;
  Currency?: string;
  ISIN?: string;
}

/**
 * Cached asset info (sector, name, type)
 */
interface CachedAssetInfo {
  sector: string;
  name: string;
  type: string;
  timestamp: number;
}

// ============================================================================
// CACHING
// ============================================================================

// Cache for USD/ILS rate (refreshed hourly)
let cachedUsdIlsRate: number | null = null;
let rateLastFetched = 0;
const RATE_CACHE_MS = 60 * 60 * 1000; // 1 hour

// Cache for asset info (sector, name, type)
const assetInfoCache = new Map<string, CachedAssetInfo>();
const ASSET_INFO_CACHE_MS = 24 * 60 * 60 * 1000; // 24 hours

// Cache for real-time prices
const priceCache = new Map<string, { price: number; changePercent: number; timestamp: number }>();
const PRICE_CACHE_MS_US = 5 * 60 * 1000; // 5 minutes for US
const PRICE_CACHE_MS_IL = 24 * 60 * 60 * 1000; // 24 hours for Israel (market closes earlier)

// Fallback USD/ILS rate if all API calls fail
const FALLBACK_USD_ILS_RATE = 3.65;

// ============================================================================
// SYMBOL UTILITIES
// ============================================================================

/**
 * Normalize symbol for EOD API
 */
export function normalizeSymbol(symbol: string): string {
  const upperSymbol = symbol.toUpperCase();

  // Already has exchange suffix
  if (upperSymbol.includes('.')) {
    return upperSymbol;
  }

  // Israeli security number (6-9 digits)
  if (/^\d{6,9}$/.test(symbol)) {
    return `${symbol}.TA`;
  }

  // Crypto pattern (BTC-USD, ETH-USD, etc.)
  if (/-USD$/i.test(symbol)) {
    return `${upperSymbol}.CC`;
  }

  // Default: US stock
  return `${upperSymbol}.US`;
}

/**
 * Detect asset type from symbol
 */
export function detectAssetType(symbol: string): {
  provider: 'EOD';
  isIsraeli: boolean;
  isCrypto: boolean;
  isUS: boolean;
} {
  const normalized = normalizeSymbol(symbol);
  return {
    provider: 'EOD',
    isIsraeli: normalized.endsWith('.TA'),
    isCrypto: normalized.endsWith('.CC'),
    isUS: normalized.endsWith('.US'),
  };
}

/**
 * Map EOD type to our AssetType
 */
function mapEODType(type: string): AssetType {
  const typeMap: Record<string, AssetType> = {
    'Common Stock': 'stock',
    'Stock': 'stock',
    'ETF': 'etf',
    'Mutual Fund': 'mutualFund',
    'FUND': 'mutualFund',
    'Fund': 'mutualFund',
    'Bond': 'bond',
    'BOND': 'bond',
    'Fixed Income': 'bond',
    'Crypto': 'crypto',
    'Currency': 'stock',
  };
  return typeMap[type] || 'stock';
}

/**
 * Get exchange display name
 */
function getExchangeDisplay(exchange: string): string {
  const exchanges: Record<string, string> = {
    'TA': 'תל אביב',
    'TASE': 'תל אביב',
    'US': 'US',
    'NYSE': 'NYSE',
    'NASDAQ': 'NASDAQ',
    'CC': 'Crypto',
    'FOREX': 'Forex',
    'INDX': 'Index',
  };
  return exchanges[exchange] || exchange;
}

/**
 * Estimate sector from symbol pattern
 */
function estimateSector(symbol: string, isIsraeli: boolean): { sector: string; type: string } {
  const upperSymbol = symbol.toUpperCase().split('.')[0];

  // Known sector patterns for US ETFs/stocks
  const sectorPatterns: Array<{ pattern: RegExp; sector: string; type: string }> = [
    // Technology
    { pattern: /^(QQQ|XLK|VGT|ARKK|AAPL|MSFT|GOOGL|GOOG|META|NVDA|AMD|INTC)$/i, sector: 'Technology', type: 'ETF' },
    // Financials
    { pattern: /^(XLF|VFH|JPM|BAC|GS|MS|C|WFC)$/i, sector: 'Financials', type: 'ETF' },
    // Healthcare
    { pattern: /^(XLV|VHT|JNJ|UNH|PFE|MRK|ABBV)$/i, sector: 'Healthcare', type: 'ETF' },
    // Energy
    { pattern: /^(XLE|VDE|XOM|CVX|COP|USO|OIL)$/i, sector: 'Energy', type: 'ETF' },
    // Real Estate
    { pattern: /^(VNQ|IYR|XLRE)$/i, sector: 'Real Estate', type: 'ETF' },
    // Commodities - Gold/Silver
    { pattern: /^(GLD|IAU|SLV|GDX|GDXJ|SIL|GOLD)$/i, sector: 'Commodities', type: 'ETF' },
    // Bonds
    { pattern: /^(BND|AGG|TLT|IEF|LQD|HYG|JNK|MUB|GOVT|SHY)$/i, sector: 'Bonds', type: 'ETF' },
    // S&P 500 / Total Market
    { pattern: /^(SPY|VOO|IVV|VTI|ITOT|SCHB)$/i, sector: 'US Equity', type: 'ETF' },
    // International
    { pattern: /^(VEA|VXUS|EFA|VWO|EEM|IEMG)$/i, sector: 'International', type: 'ETF' },
    // Small Cap
    { pattern: /^(IWM|VB|IJR|SCHA)$/i, sector: 'Small Cap', type: 'ETF' },
  ];

  for (const { pattern, sector, type } of sectorPatterns) {
    if (pattern.test(upperSymbol)) {
      return { sector, type };
    }
  }

  // Israeli assets
  if (isIsraeli) {
    return { sector: 'Israel', type: 'Stock' };
  }

  // Default for unknown US stocks
  return { sector: 'US Equity', type: 'Stock' };
}

// ============================================================================
// EOD PROVIDER CLASS
// ============================================================================

export class EODProvider implements MarketDataProvider {
  private readonly apiToken = EOD_API_TOKEN;

  /**
   * Fetch from EOD API with error handling
   */
  private async fetchEOD<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${EOD_BASE_URL}/${endpoint}`);
    url.searchParams.set('api_token', this.apiToken);
    url.searchParams.set('fmt', 'json');
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`EOD API error: ${response.status} ${response.statusText}`);
    }

    const text = await response.text();

    // EOD sometimes returns error messages as plain text
    if (text.startsWith('<!DOCTYPE') || text.startsWith('Error')) {
      throw new Error(`EOD API returned error: ${text.substring(0, 100)}`);
    }

    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`EOD API returned invalid JSON: ${text.substring(0, 100)}`);
    }
  }

  /**
   * Get USD to ILS exchange rate
   * NEVER fails - always returns a valid rate
   */
  async getUsdIlsRate(): Promise<number> {
    const now = Date.now();

    // Return cached rate if still valid
    if (cachedUsdIlsRate && (now - rateLastFetched) < RATE_CACHE_MS) {
      return cachedUsdIlsRate;
    }

    // Try real-time endpoint first
    try {
      const data = await this.fetchEOD<EODRealTimeQuote>('real-time/USDILS.FOREX');
      if (data.close && data.close > 0) {
        cachedUsdIlsRate = data.close;
        rateLastFetched = now;
        console.log(`[EOD] USD/ILS rate: ${cachedUsdIlsRate}`);
        return cachedUsdIlsRate;
      }
    } catch (error) {
      console.warn('[EOD] Real-time FOREX failed:', error instanceof Error ? error.message : error);
    }

    // Fallback: Try EOD endpoint
    try {
      const data = await this.fetchEOD<EODHistoricalData[]>('eod/USDILS.FOREX', {
        period: 'd',
        order: 'd',
      });
      if (Array.isArray(data) && data.length > 0 && data[0].close > 0) {
        cachedUsdIlsRate = data[0].close;
        rateLastFetched = now;
        console.log(`[EOD] USD/ILS rate (fallback): ${cachedUsdIlsRate}`);
        return cachedUsdIlsRate;
      }
    } catch (error) {
      console.warn('[EOD] EOD FOREX fallback failed:', error instanceof Error ? error.message : error);
    }

    // Final fallback
    const fallbackRate = cachedUsdIlsRate ?? FALLBACK_USD_ILS_RATE;
    console.log(`[EOD] Using fallback USD/ILS rate: ${fallbackRate}`);
    return fallbackRate;
  }

  /**
   * Get asset info (sector, name, type) - checks enrichment first, then cache, then estimates
   * Beta is calculated separately by betaEngine
   * IMPORTANT: Enrichment is checked BEFORE cache to ensure Hebrew names are always fresh
   */
  async getAssetInfo(symbol: string): Promise<CachedAssetInfo> {
    const normalizedSymbol = normalizeSymbol(symbol);
    const { isIsraeli } = detectAssetType(symbol);
    const now = Date.now();

    // Check enrichment first (always fresh from DB) - this ensures Hebrew names override cache
    const enrichment = await getEnrichment(symbol);
    if (enrichment) {
      const result: CachedAssetInfo = {
        sector: enrichment.sectorHe,
        name: enrichment.nameHe,
        type: enrichment.assetType,
        timestamp: now,
      };
      // Update cache with enriched data (overwrites any stale cache)
      assetInfoCache.set(normalizedSymbol, result);
      return result;
    }

    // If no enrichment, check cache
    const cached = assetInfoCache.get(normalizedSymbol);
    if (cached && (now - cached.timestamp) < ASSET_INFO_CACHE_MS) {
      return cached;
    }

    // Fallback: Estimate sector from symbol pattern
    const { sector, type } = estimateSector(symbol, isIsraeli);
    const name = symbol.toUpperCase().split('.')[0];

    const result: CachedAssetInfo = {
      sector,
      name,
      type,
      timestamp: now,
    };

    // Cache the result
    assetInfoCache.set(normalizedSymbol, result);

    return result;
  }

  /**
   * Get real-time price with caching
   */
  private async getPriceData(symbol: string): Promise<{ price: number; changePercent: number } | null> {
    const normalizedSymbol = normalizeSymbol(symbol);
    const { isIsraeli } = detectAssetType(symbol);
    const now = Date.now();

    // Check price cache
    const cached = priceCache.get(normalizedSymbol);
    const cacheMs = isIsraeli ? PRICE_CACHE_MS_IL : PRICE_CACHE_MS_US;
    if (cached && (now - cached.timestamp) < cacheMs) {
      return { price: cached.price, changePercent: cached.changePercent };
    }

    // Try real-time endpoint
    try {
      const rtData = await this.fetchEOD<EODRealTimeQuote>(`real-time/${normalizedSymbol}`);
      if (rtData.close && rtData.close > 0) {
        const result = {
          price: rtData.close,
          changePercent: rtData.change_p || 0,
          timestamp: now,
        };
        priceCache.set(normalizedSymbol, result);
        return { price: result.price, changePercent: result.changePercent };
      }
    } catch {
      // Fall through to EOD endpoint
    }

    // Fallback to EOD endpoint
    try {
      const eodData = await this.fetchEOD<EODHistoricalData[]>(`eod/${normalizedSymbol}`, {
        period: 'd',
        order: 'd',
      });

      if (Array.isArray(eodData) && eodData.length > 0) {
        const latest = eodData[0];
        const previous = eodData[1];
        const changePercent = previous && previous.close > 0
          ? ((latest.close - previous.close) / previous.close) * 100
          : 0;

        const result = {
          price: latest.close,
          changePercent,
          timestamp: now,
        };
        priceCache.set(normalizedSymbol, result);
        return { price: result.price, changePercent: result.changePercent };
      }
    } catch (error) {
      console.error(`[EOD] Price fetch failed for ${normalizedSymbol}:`, error);
    }

    return null;
  }

  /**
   * Get complete quote (price only, no beta)
   * Checks enrichment service for Hebrew names and sectors
   */
  async getQuote(symbol: string): Promise<AssetData | null> {
    const normalizedSymbol = normalizeSymbol(symbol);
    const { isIsraeli, isCrypto } = detectAssetType(symbol);

    console.log(`[EOD] Getting quote for ${normalizedSymbol}`);

    // Fetch price
    const priceData = await this.getPriceData(symbol);
    if (!priceData || priceData.price <= 0) {
      console.error(`[EOD] No valid price for ${symbol}`);
      return null;
    }

    // Get asset info (sector, name, type) - checks enrichment first
    const assetInfo = await this.getAssetInfo(symbol);

    // Check enrichment service for Hebrew data
    const enrichment = await getEnrichment(symbol);

    // Determine currency
    const currency: 'USD' | 'ILS' = isIsraeli ? 'ILS' : 'USD';

    // Calculate ILS price
    let priceILS = priceData.price;
    if (currency === 'USD') {
      const exchangeRate = await this.getUsdIlsRate();
      priceILS = priceData.price * exchangeRate;
    }

    const baseQuote: AssetData = {
      symbol: symbol.toUpperCase().split('.')[0], // Clean symbol for display
      name: assetInfo.name,
      price: priceData.price,
      priceILS,
      currency,
      changePercent: Math.round(priceData.changePercent * 100) / 100,
      provider: 'EOD',
      type: isCrypto ? 'crypto' : mapEODType(assetInfo.type),
    };

    // Enrich with Hebrew data if available
    if (enrichment) {
      return enrichQuoteData(baseQuote, enrichment) as AssetData;
    }

    return baseQuote;
  }

  /**
   * Get quote with beta and sector (enriched)
   * Beta is calculated from historical data using CAPM model
   * Checks enrichment service for Hebrew names and sectors
   * OPTIMIZED: All data fetched in parallel for maximum performance
   */
  async getEnrichedQuote(symbol: string): Promise<(AssetData & { beta: number; sector: string; sectorHe?: string; nameHe?: string; isEnriched?: boolean }) | null> {
    // Import betaEngine dynamically to avoid circular dependency
    const { calculateBeta } = await import('../math/betaEngine');

    // Fetch all data in parallel for maximum performance
    const [quote, assetInfo, betaResult, enrichment] = await Promise.all([
      this.getQuote(symbol),
      this.getAssetInfo(symbol),
      calculateBeta(symbol),
      getEnrichment(symbol),
    ]);

    if (!quote) return null;

    const enrichedQuote = {
      ...quote,
      beta: betaResult.beta,
      sector: assetInfo.sector,
      ...(enrichment && {
        sectorHe: enrichment.sectorHe,
        nameHe: enrichment.nameHe,
        isEnriched: true,
      }),
    };

    console.log(`[EOD] Enriched ${symbol}: Beta=${betaResult.beta} (${betaResult.source}), Sector=${enrichedQuote.sector}${enrichment ? ` (Hebrew: ${enrichment.sectorHe})` : ''}`);

    return enrichedQuote;
  }

  /**
   * Search for securities across all exchanges
   * Enhanced: Israeli security numbers (6-9 digits) trigger TA exchange search
   */
  async search(query: string): Promise<SearchResult[]> {
    try {
      const isIsraeliSecurityNumber = /^\d{6,9}$/.test(query.trim());
      let results: EODSearchResult[] = [];

      // Standard search
      const standardResults = await this.fetchEOD<EODSearchResult[]>(`search/${encodeURIComponent(query)}`);
      if (Array.isArray(standardResults)) {
        results = standardResults;
      }

      // If Israeli security number with no results, search TA exchange for ETFs/Funds
      if (isIsraeliSecurityNumber && results.length === 0) {
        console.log(`[EOD] Israeli security number detected: ${query}, searching TA exchange...`);

        // Try searching TA exchange for common fund patterns
        // Extract potential keywords from common Israeli fund names
        const taResults = await this.searchTAExchange(query);
        if (taResults.length > 0) {
          results = taResults;
        }
      }

      // Also search TA exchange if query looks like a fund name
      if (!isIsraeliSecurityNumber && results.length < 5) {
        const taResults = await this.fetchEOD<EODSearchResult[]>(
          `search/${encodeURIComponent(query)}`,
          { exchange: 'TA' }
        ).catch(() => []);

        if (Array.isArray(taResults) && taResults.length > 0) {
          // Merge TA results, avoiding duplicates
          const existingCodes = new Set(results.map(r => r.Code));
          for (const ta of taResults) {
            if (!existingCodes.has(ta.Code)) {
              results.push(ta);
            }
          }
        }
      }

      if (!Array.isArray(results) || results.length === 0) {
        return [];
      }

      // Sort: Israeli first, then US, then others
      const sorted = results.sort((a, b) => {
        const aIsIsraeli = a.Exchange === 'TA' || a.Exchange === 'TASE';
        const bIsIsraeli = b.Exchange === 'TA' || b.Exchange === 'TASE';
        const aIsUS = a.Exchange === 'US' || a.Exchange === 'NYSE' || a.Exchange === 'NASDAQ';
        const bIsUS = b.Exchange === 'US' || b.Exchange === 'NYSE' || b.Exchange === 'NASDAQ';

        if (aIsIsraeli && !bIsIsraeli) return -1;
        if (!aIsIsraeli && bIsIsraeli) return 1;
        if (aIsUS && !bIsUS) return -1;
        if (!aIsUS && bIsUS) return 1;
        return 0;
      });

      return sorted.slice(0, 15).map(r => {
        const isIsraeli = r.Exchange === 'TA' || r.Exchange === 'TASE';
        return {
          symbol: `${r.Code}.${r.Exchange}`,
          name: r.Name,
          type: mapEODType(r.Type),
          provider: 'EOD' as const,
          exchange: getExchangeDisplay(r.Exchange),
          currency: isIsraeli ? 'ILS' : (r.Currency || 'USD'),
          isIsraeli,
        };
      });
    } catch (error) {
      console.error(`[EOD] Search failed for "${query}":`, error);
      return [];
    }
  }

  /**
   * Search Tel Aviv exchange for ETFs and Funds
   * Used when Israeli security number search fails
   */
  private async searchTAExchange(securityNumber: string): Promise<EODSearchResult[]> {
    // Known Israeli fund number to name mappings (common funds)
    const knownFunds: Record<string, string[]> = {
      '1159250': ['S&P 500', 'SPX'],
      '1159235': ['MSCI ACWI', 'ACWI'],
      '1159094': ['MSCI Europe', 'Europe'],
      '1185164': ['World', 'MSCI World'],
      '1159209': ['Nasdaq', 'QQQ'],
      '1159217': ['Emerging', 'EM'],
    };

    const searchTerms = knownFunds[securityNumber];
    if (!searchTerms) {
      // If not a known fund, try generic search terms based on common patterns
      return [];
    }

    // Search for each term and merge results
    const allResults: EODSearchResult[] = [];
    const seenCodes = new Set<string>();

    for (const term of searchTerms) {
      try {
        const results = await this.fetchEOD<EODSearchResult[]>(`search/${encodeURIComponent(term)}`);
        if (Array.isArray(results)) {
          for (const r of results) {
            if ((r.Exchange === 'TA' || r.Exchange === 'TASE') && !seenCodes.has(r.Code)) {
              seenCodes.add(r.Code);
              allResults.push(r);
            }
          }
        }
      } catch {
        // Continue with other terms
      }
    }

    return allResults.slice(0, 10);
  }

  /**
   * Get historical prices
   */
  async getHistoricalPrices(symbol: string, months: number): Promise<HistoricalPrice[]> {
    try {
      const normalizedSymbol = normalizeSymbol(symbol);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      const data = await this.fetchEOD<EODHistoricalData[]>(`eod/${normalizedSymbol}`, {
        from: startDate.toISOString().split('T')[0],
        to: endDate.toISOString().split('T')[0],
        period: 'm',
      });

      if (!Array.isArray(data)) return [];

      return data.map(d => ({
        date: new Date(d.date),
        close: d.adjusted_close || d.close,
      }));
    } catch (error) {
      console.error(`[EOD] Historical prices failed for ${symbol}:`, error);
      return [];
    }
  }

  /**
   * Get sparkline data (7 days daily prices)
   */
  async getSparkline(symbol: string, days = 7): Promise<number[]> {
    try {
      const normalizedSymbol = normalizeSymbol(symbol);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days - 5);

      const data = await this.fetchEOD<EODHistoricalData[]>(`eod/${normalizedSymbol}`, {
        from: startDate.toISOString().split('T')[0],
        to: endDate.toISOString().split('T')[0],
        period: 'd',
      });

      if (!Array.isArray(data)) return [];

      return data.slice(-days).map(d => d.close).filter(p => p > 0);
    } catch (error) {
      console.error(`[EOD] Sparkline failed for ${symbol}:`, error);
      return [];
    }
  }
}

// Singleton instance
export const eodProvider = new EODProvider();
