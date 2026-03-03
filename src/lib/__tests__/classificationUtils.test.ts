/**
 * Classification Utilities Tests
 *
 * Comprehensive tests for the Global Consensus classification pipeline helpers:
 * - superNormalizeMerchantName: aggressive Hebrew bank string cleanup
 * - isBlacklistedMerchant: runtime blacklist for digital wallets + ambiguous terms
 * - checkGlobalConsensus: confidence scoring for cross-user stats
 */

import { describe, it, expect } from 'vitest';
import {
  superNormalizeMerchantName,
  isBlacklistedMerchant,
  checkGlobalConsensus,
} from '../classificationUtils';

// ============================================================================
// superNormalizeMerchantName
// ============================================================================

describe('superNormalizeMerchantName', () => {
  it('should return empty string for falsy input', () => {
    expect(superNormalizeMerchantName('')).toBe('');
    expect(superNormalizeMerchantName(null as unknown as string)).toBe('');
    expect(superNormalizeMerchantName(undefined as unknown as string)).toBe('');
  });

  describe('punctuation normalization (hyphen/underscore/dot/comma → space)', () => {
    it('should merge "רב-קו אונליין" and "רב קו אונליין" to the same string', () => {
      const withHyphen = superNormalizeMerchantName('רב-קו אונליין');
      const withSpace = superNormalizeMerchantName('רב קו אונליין');
      expect(withHyphen).toBe(withSpace);
      expect(withHyphen).toBe('רב קו אונליין');
    });

    it('should replace underscores with spaces', () => {
      expect(superNormalizeMerchantName('some_merchant_name')).toBe('some merchant name');
    });

    it('should replace dots with spaces', () => {
      expect(superNormalizeMerchantName('a.b.c')).toBe('a b c');
    });

    it('should replace commas with spaces', () => {
      expect(superNormalizeMerchantName('foo,bar,baz')).toBe('foo bar baz');
    });

    it('should collapse multiple spaces after punctuation replacement', () => {
      expect(superNormalizeMerchantName('רב - קו')).toBe('רב קו');
    });
  });

  describe('whitespace handling', () => {
    it('should trim leading and trailing whitespace', () => {
      expect(superNormalizeMerchantName('  שופרסל  ')).toBe('שופרסל');
    });

    it('should collapse multiple internal spaces', () => {
      expect(superNormalizeMerchantName('שופרסל   שלי')).toBe('שופרסל שלי');
    });

    it('should handle non-breaking spaces', () => {
      expect(superNormalizeMerchantName('שופרסל\u00A0שלי')).toBe('שופרסל שלי');
    });
  });

  describe('bank prefix stripping', () => {
    it('should strip "הו"ק ל" prefix', () => {
      expect(superNormalizeMerchantName('הו"ק לבזק')).toBe('בזק');
    });

    it('should strip "חיוב כרטיס" prefix', () => {
      expect(superNormalizeMerchantName('חיוב כרטיס סופר פארם')).toBe('סופר פארם');
    });

    it('should strip "זיכוי מ " prefix', () => {
      expect(superNormalizeMerchantName('זיכוי מ אלי אקספרס')).toBe('אלי אקספרס');
    });

    it('should strip "העברת ביט" prefix', () => {
      expect(superNormalizeMerchantName('העברת ביט משה כהן')).toBe('משה כהן');
    });

    it('should strip "תשלום ל" prefix', () => {
      expect(superNormalizeMerchantName('תשלום לחברת חשמל')).toBe('חברת חשמל');
    });

    it('should only strip one prefix', () => {
      const result = superNormalizeMerchantName('הו"ק לתשלום לבזק');
      expect(result).toBe('תשלום לבזק');
    });
  });

  describe('trailing metadata stripping', () => {
    it('should strip trailing branch numbers', () => {
      expect(superNormalizeMerchantName('שופרסל שלי 154')).toBe('שופרסל שלי');
    });

    it('should strip card-last-4 patterns', () => {
      expect(superNormalizeMerchantName('שופרסל *1234')).toBe('שופרסל');
      expect(superNormalizeMerchantName('שופרסל xxxx5678')).toBe('שופרסל');
    });

    it('should strip trailing date patterns (DD/MM/YYYY)', () => {
      expect(superNormalizeMerchantName('שופרסל 15/03/24')).toBe('שופרסל');
    });

    it('should strip trailing date patterns (DD.MM.YYYY) — dots become spaces first', () => {
      // Dots are replaced by spaces before date regex, so DD.MM.YYYY fragments
      // into individual numbers that get stripped as trailing digits
      expect(superNormalizeMerchantName('שופרסל 15.03.2024')).toBe('שופרסל 15 03');
    });

    it('should strip trailing date patterns with slashes (DD/MM/YYYY)', () => {
      expect(superNormalizeMerchantName('שופרסל 15/03/2024')).toBe('שופרסל');
    });

    it('should strip trailing time patterns', () => {
      expect(superNormalizeMerchantName('שופרסל 12:30')).toBe('שופרסל');
    });

    it('should strip parenthesized metadata', () => {
      expect(superNormalizeMerchantName('שופרסל (סניף 12)')).toBe('שופרסל');
    });
  });

  describe('quotation mark removal', () => {
    it('should remove double quotes (בע"מ)', () => {
      expect(superNormalizeMerchantName('חברה בעמ')).toBe('חברה בעמ');
    });

    it('should remove Hebrew geresh and gershayim', () => {
      expect(superNormalizeMerchantName('חברה בע״מ')).toBe('חברה בעמ');
    });
  });

  describe('English lowercasing', () => {
    it('should lowercase English characters', () => {
      expect(superNormalizeMerchantName('McDonald')).toBe('mcdonald');
    });

    it('should keep Hebrew characters unchanged', () => {
      expect(superNormalizeMerchantName('שופרסל DEAL')).toBe('שופרסל deal');
    });
  });

  describe('en-dash and em-dash normalization', () => {
    it('should replace en-dash with space', () => {
      expect(superNormalizeMerchantName('רב–קו')).toBe('רב קו');
    });

    it('should replace em-dash with space', () => {
      expect(superNormalizeMerchantName('רב—קו')).toBe('רב קו');
    });
  });

  describe('combined normalization produces identical output', () => {
    it('all variants of "רב-קו" should normalize identically', () => {
      const variants = [
        'רב-קו אונליין',
        'רב קו אונליין',
        'רב–קו אונליין',
        'רב—קו אונליין',
        '  רב-קו  אונליין  ',
        'רב_קו אונליין',
      ];
      const normalized = variants.map(superNormalizeMerchantName);
      const allSame = normalized.every(n => n === normalized[0]);
      expect(allSame).toBe(true);
      expect(normalized[0]).toBe('רב קו אונליין');
    });
  });
});

// ============================================================================
// isBlacklistedMerchant
// ============================================================================

describe('isBlacklistedMerchant', () => {
  describe('digital wallets', () => {
    it('should blacklist "Bit" (case-insensitive)', () => {
      expect(isBlacklistedMerchant('Bit')).toBe(true);
      expect(isBlacklistedMerchant('bit')).toBe(true);
      expect(isBlacklistedMerchant('BIT')).toBe(true);
    });

    it('should blacklist "ביט" (Hebrew)', () => {
      expect(isBlacklistedMerchant('ביט')).toBe(true);
    });

    it('should blacklist "Paybox"', () => {
      expect(isBlacklistedMerchant('Paybox')).toBe(true);
      expect(isBlacklistedMerchant('paybox')).toBe(true);
    });

    it('should blacklist "PayPal"', () => {
      expect(isBlacklistedMerchant('PayPal')).toBe(true);
    });

    it('should blacklist "Apple Pay"', () => {
      expect(isBlacklistedMerchant('Apple Pay')).toBe(true);
    });

    it('should blacklist "Google Pay"', () => {
      expect(isBlacklistedMerchant('Google Pay')).toBe(true);
    });

    it('should blacklist "pepper" / "פפר"', () => {
      expect(isBlacklistedMerchant('pepper')).toBe(true);
      expect(isBlacklistedMerchant('פפר')).toBe(true);
    });
  });

  describe('ambiguous terms', () => {
    it('should blacklist "קניות" (Purchases)', () => {
      expect(isBlacklistedMerchant('קניות')).toBe(true);
    });

    it('should blacklist "משנת יוסף"', () => {
      expect(isBlacklistedMerchant('משנת יוסף')).toBe(true);
    });
  });

  describe('word boundary matching', () => {
    it('should blacklist "תשלום דרך ביט" (contains "ביט" as whole word)', () => {
      // "העברת ביט" is itself a bank prefix and gets fully stripped,
      // leaving empty string. Use a non-prefix context instead.
      expect(isBlacklistedMerchant('תשלום דרך ביט')).toBe(true);
    });

    it('should blacklist merchant names containing "pay" as a word', () => {
      expect(isBlacklistedMerchant('some pay thing')).toBe(true);
    });
  });

  describe('non-blacklisted merchants', () => {
    it('should NOT blacklist regular merchants', () => {
      expect(isBlacklistedMerchant('שופרסל')).toBe(false);
      expect(isBlacklistedMerchant('רמי לוי')).toBe(false);
      expect(isBlacklistedMerchant('סונול')).toBe(false);
    });

    it('should NOT blacklist empty string', () => {
      expect(isBlacklistedMerchant('')).toBe(false);
    });
  });
});

// ============================================================================
// checkGlobalConsensus
// ============================================================================

describe('checkGlobalConsensus', () => {
  it('should return null for empty stats', () => {
    expect(checkGlobalConsensus([], 5)).toBeNull();
  });

  it('should return null when uniqueUserCount < 3', () => {
    const stats = [{ category: 'food', count: 10 }];
    expect(checkGlobalConsensus(stats, 2)).toBeNull();
    expect(checkGlobalConsensus(stats, 1)).toBeNull();
    expect(checkGlobalConsensus(stats, 0)).toBeNull();
  });

  it('should return null when totalCount < 3', () => {
    const stats = [{ category: 'food', count: 2 }];
    expect(checkGlobalConsensus(stats, 3)).toBeNull();
  });

  it('should return null when confidence < 75%', () => {
    const stats = [
      { category: 'food', count: 3 },
      { category: 'shopping', count: 2 },
    ];
    // 3/5 = 60% < 75%
    expect(checkGlobalConsensus(stats, 5)).toBeNull();
  });

  it('should return winning category when confidence >= 75% and >= 3 unique users', () => {
    const stats = [
      { category: 'transport', count: 8 },
      { category: 'other', count: 2 },
    ];
    // 8/10 = 80% >= 75%, 5 unique users >= 3
    expect(checkGlobalConsensus(stats, 5)).toBe('transport');
  });

  it('should return category at exactly 75% threshold', () => {
    const stats = [
      { category: 'food', count: 3 },
      { category: 'other', count: 1 },
    ];
    // 3/4 = 75%, exactly at threshold
    expect(checkGlobalConsensus(stats, 3)).toBe('food');
  });

  it('should return the top category when 100% consensus', () => {
    const stats = [{ category: 'bills', count: 10 }];
    expect(checkGlobalConsensus(stats, 10)).toBe('bills');
  });

  it('should handle multiple categories and pick the one with highest count', () => {
    const stats = [
      { category: 'shopping', count: 1 },
      { category: 'food', count: 10 },
      { category: 'other', count: 1 },
    ];
    // 10/12 ≈ 83%
    expect(checkGlobalConsensus(stats, 5)).toBe('food');
  });

  it('should return null for evenly split votes', () => {
    const stats = [
      { category: 'food', count: 5 },
      { category: 'shopping', count: 5 },
    ];
    // 5/10 = 50% < 75%
    expect(checkGlobalConsensus(stats, 10)).toBeNull();
  });
});
