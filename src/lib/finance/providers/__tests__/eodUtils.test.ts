import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/config', () => ({
  config: { encryptionKey: 'a'.repeat(64), nodeEnv: 'test' },
}));

vi.mock('@/lib/cache', () => ({
  cacheGet: vi.fn().mockResolvedValue(null),
  cacheSet: vi.fn().mockResolvedValue(true),
  CacheKeys: {
    marketQuote: (s: string) => `market:quote:${s}`,
    marketInfo: (s: string) => `market:info:${s}`,
    exchangeRate: () => 'market:usdils',
  },
  CacheTTL: { MARKET_QUOTE_US: 300, MARKET_QUOTE_IL: 900, MARKET_INFO: 86400, EXCHANGE_RATE: 3600 },
}));

vi.mock('../../enrichmentService', () => ({
  getEnrichment: vi.fn().mockResolvedValue(null),
  enrichQuoteData: vi.fn(),
  searchBySecurityNumber: vi.fn().mockResolvedValue(null),
}));

import { normalizeSymbol, detectAssetType } from '../eod';

// ============================================================================
// normalizeSymbol
// ============================================================================

describe('normalizeSymbol', () => {
  it('appends .US for plain US stock tickers', () => {
    expect(normalizeSymbol('AAPL')).toBe('AAPL.US');
    expect(normalizeSymbol('MSFT')).toBe('MSFT.US');
  });

  it('uppercases the symbol', () => {
    expect(normalizeSymbol('aapl')).toBe('AAPL.US');
    expect(normalizeSymbol('Msft')).toBe('MSFT.US');
  });

  it('appends .TA for Israeli 6-digit security numbers', () => {
    expect(normalizeSymbol('123456')).toBe('123456.TA');
  });

  it('appends .TA for Israeli 7-digit security numbers', () => {
    expect(normalizeSymbol('1234567')).toBe('1234567.TA');
  });

  it('appends .TA for Israeli 9-digit security numbers', () => {
    expect(normalizeSymbol('123456789')).toBe('123456789.TA');
  });

  it('does NOT treat 5-digit numbers as Israeli', () => {
    expect(normalizeSymbol('12345')).toBe('12345.US');
  });

  it('does NOT treat 10-digit numbers as Israeli', () => {
    expect(normalizeSymbol('1234567890')).toBe('1234567890.US');
  });

  it('appends .CC for crypto *-USD patterns', () => {
    expect(normalizeSymbol('BTC-USD')).toBe('BTC-USD.CC');
    expect(normalizeSymbol('eth-usd')).toBe('ETH-USD.CC');
  });

  it('returns as-is (uppercased) when symbol already has exchange suffix', () => {
    expect(normalizeSymbol('VOO.US')).toBe('VOO.US');
    expect(normalizeSymbol('1159250.TA')).toBe('1159250.TA');
    expect(normalizeSymbol('gspc.indx')).toBe('GSPC.INDX');
  });

  it('handles empty string', () => {
    expect(normalizeSymbol('')).toBe('.US');
  });
});

// ============================================================================
// detectAssetType
// ============================================================================

describe('detectAssetType', () => {
  it('detects US stocks', () => {
    const result = detectAssetType('AAPL');
    expect(result).toEqual({
      provider: 'EOD',
      isIsraeli: false,
      isCrypto: false,
      isUS: true,
    });
  });

  it('detects Israeli securities from numeric symbols', () => {
    const result = detectAssetType('1159250');
    expect(result).toEqual({
      provider: 'EOD',
      isIsraeli: true,
      isCrypto: false,
      isUS: false,
    });
  });

  it('detects Israeli securities from .TA suffix', () => {
    const result = detectAssetType('1159250.TA');
    expect(result).toEqual({
      provider: 'EOD',
      isIsraeli: true,
      isCrypto: false,
      isUS: false,
    });
  });

  it('detects crypto from -USD pattern', () => {
    const result = detectAssetType('BTC-USD');
    expect(result).toEqual({
      provider: 'EOD',
      isIsraeli: false,
      isCrypto: true,
      isUS: false,
    });
  });

  it('detects .CC suffix as crypto', () => {
    const result = detectAssetType('ETH-USD.CC');
    expect(result).toEqual({
      provider: 'EOD',
      isIsraeli: false,
      isCrypto: true,
      isUS: false,
    });
  });

  it('treats suffixed symbols correctly', () => {
    const result = detectAssetType('VOO.US');
    expect(result.isUS).toBe(true);
    expect(result.isIsraeli).toBe(false);
    expect(result.isCrypto).toBe(false);
  });

  it('always returns provider EOD', () => {
    expect(detectAssetType('anything').provider).toBe('EOD');
  });
});
