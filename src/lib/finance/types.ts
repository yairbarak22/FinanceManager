/**
 * Unified types for the Hybrid Portfolio Engine
 */

export type Provider = 'YAHOO' | 'EOD';
export type Currency = 'USD' | 'ILS';
export type AssetType = 'stock' | 'etf' | 'mutualFund' | 'bond' | 'crypto';

/**
 * Unified asset data returned by any provider
 */
export interface AssetData {
  symbol: string;
  name: string;
  price: number;
  priceILS: number;
  currency: Currency;
  changePercent: number;
  provider: Provider;
  type?: AssetType;
}

/**
 * Quote data for search results
 */
export interface QuoteData extends AssetData {
  beta?: number;
  sector?: string;
  sectorHe?: string; // Hebrew sector name from enrichment
  exchange?: string;
  nameHe?: string; // Hebrew name from enrichment
  isEnriched?: boolean; // Whether data was enriched from local DB
}

/**
 * Search result item
 */
export interface SearchResult {
  symbol: string;
  name: string;
  nameHe?: string; // Hebrew name from enrichment
  type: AssetType;
  provider: Provider;
  exchange?: string;
  logoUrl?: string;
  isEnriched?: boolean; // Whether result came from local enrichment DB
}

/**
 * Historical price data point
 */
export interface HistoricalPrice {
  date: Date;
  close: number;
}

/**
 * Beta calculation result
 */
export interface BetaResult {
  beta: number;
  dataPoints: number;
  isCalculated: boolean; // true if calculated, false if default
}

export type PriceDisplayUnit = 'ILS' | 'ILS_AGOROT' | 'USD';

/**
 * Holding with provider info
 */
export interface HybridHolding {
  id?: string;
  symbol: string;
  quantity: number;
  provider: Provider;
  currency: Currency;
  priceDisplayUnit?: PriceDisplayUnit;
}

/**
 * Enriched holding with all market data
 */
export interface EnrichedHolding {
  id?: string;
  symbol: string;
  name: string;
  nameHe?: string; // Hebrew name from enrichment
  quantity: number;
  price: number;
  priceILS: number;
  value: number;
  valueILS: number;
  beta: number;
  sector: string;
  sectorHe?: string; // Hebrew sector name from enrichment
  currency: Currency;
  provider: Provider;
  priceDisplayUnit?: PriceDisplayUnit;
  changePercent: number;
  weight: number;
  sparklineData: number[];
  isEnriched?: boolean; // Whether data was enriched from local DB
}

/**
 * Portfolio analysis result
 */
export interface PortfolioAnalysis {
  equity: number;
  equityILS: number;
  cashBalance?: number;
  cashWeight?: number;
  beta: number;
  dailyChangePercent: number;
  dailyChangeILS: number;
  diversificationScore: number;
  sectorAllocation: SectorAllocation[];
  holdings: EnrichedHolding[];
  riskLevel: RiskLevel;
  exchangeRate: number; // USD/ILS exchange rate
}

export interface SectorAllocation {
  sector: string;
  sectorHe?: string;
  value: number;
  percent: number;
}

export type RiskLevel = 'conservative' | 'moderate' | 'aggressive';

/**
 * Provider interface - all providers must implement this
 */
export interface MarketDataProvider {
  getQuote(symbol: string): Promise<AssetData | null>;
  search(query: string): Promise<SearchResult[]>;
  getHistoricalPrices(symbol: string, months: number): Promise<HistoricalPrice[]>;
  getSparkline(symbol: string, days: number): Promise<number[]>;
}
