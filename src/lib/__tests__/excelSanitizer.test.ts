/**
 * Excel Sanitizer Tests
 *
 * Tests for formula injection prevention, HTML stripping,
 * and negative number handling.
 */

import { describe, it, expect } from 'vitest';
import { sanitizeCellValue, sanitizeRow, sanitizeExcelData } from '../excelSanitizer';

// ============================================================================
// Basic Type Handling
// ============================================================================

describe('sanitizeCellValue - basic types', () => {
  it('should return null for null/undefined/empty', () => {
    expect(sanitizeCellValue(null)).toBeNull();
    expect(sanitizeCellValue(undefined)).toBeNull();
    expect(sanitizeCellValue('')).toBeNull();
  });

  it('should return numbers as-is', () => {
    expect(sanitizeCellValue(42)).toBe(42);
    expect(sanitizeCellValue(3.14)).toBe(3.14);
    expect(sanitizeCellValue(-500)).toBe(-500);
    expect(sanitizeCellValue(0)).toBe(0);
  });

  it('should return null for NaN/Infinity', () => {
    expect(sanitizeCellValue(NaN)).toBeNull();
    expect(sanitizeCellValue(Infinity)).toBeNull();
    expect(sanitizeCellValue(-Infinity)).toBeNull();
  });

  it('should trim whitespace', () => {
    expect(sanitizeCellValue('  hello  ')).toBe('hello');
  });
});

// ============================================================================
// Formula Injection Prevention
// ============================================================================

describe('sanitizeCellValue - formula injection', () => {
  it('should strip = prefix (formula injection)', () => {
    expect(sanitizeCellValue('=CMD("calc")')).toBe('CMD("calc")');
  });

  it('should strip @ prefix', () => {
    expect(sanitizeCellValue('@SUM(A1:A10)')).toBe('SUM(A1:A10)');
  });

  it('should strip tab character prefix', () => {
    expect(sanitizeCellValue('\tformula')).toBe('formula');
  });

  it('should strip carriage return prefix', () => {
    expect(sanitizeCellValue('\rformula')).toBe('formula');
  });

  it('should strip + prefix when NOT followed by a digit', () => {
    expect(sanitizeCellValue('+CMD("calc")')).toBe('CMD("calc")');
  });

  it('should strip - prefix when NOT followed by a digit', () => {
    expect(sanitizeCellValue('-CMD("calc")')).toBe('CMD("calc")');
  });
});

// ============================================================================
// Negative Number Preservation (Critical for Bank Imports)
// ============================================================================

describe('sanitizeCellValue - negative numbers', () => {
  it('should preserve negative numbers like -500', () => {
    expect(sanitizeCellValue('-500')).toBe('-500');
  });

  it('should preserve negative decimals like -300.50', () => {
    expect(sanitizeCellValue('-300.50')).toBe('-300.50');
  });

  it('should preserve positive numbers like +300.50', () => {
    expect(sanitizeCellValue('+300.50')).toBe('+300.50');
  });

  it('should preserve negative amounts with commas like -1,234.56', () => {
    expect(sanitizeCellValue('-1,234.56')).toBe('-1,234.56');
  });

  it('should preserve +100', () => {
    expect(sanitizeCellValue('+100')).toBe('+100');
  });

  it('should strip - when followed by non-numeric', () => {
    expect(sanitizeCellValue('-hello')).toBe('hello');
  });

  it('should strip + when followed by non-numeric', () => {
    expect(sanitizeCellValue('+hello')).toBe('hello');
  });

  it('should strip - when it is the only character', () => {
    // length < 2 case
    expect(sanitizeCellValue('-')).toBeNull(); // stripped then trimmed to empty
  });
});

// ============================================================================
// HTML Stripping (XSS Prevention)
// ============================================================================

describe('sanitizeCellValue - HTML stripping', () => {
  it('should remove HTML tags', () => {
    expect(sanitizeCellValue('<b>Bold</b>')).toBe('Bold');
  });

  it('should remove script tags', () => {
    expect(sanitizeCellValue('<script>alert("xss")</script>Hello')).toBe('alert("xss")Hello');
  });

  it('should remove nested HTML', () => {
    expect(sanitizeCellValue('<div><span>Content</span></div>')).toBe('Content');
  });

  it('should handle empty tags', () => {
    expect(sanitizeCellValue('<br/>')).toBeNull(); // empty after stripping
  });
});

// ============================================================================
// Length Limits (DoS Prevention)
// ============================================================================

describe('sanitizeCellValue - length limits', () => {
  it('should truncate strings longer than 500 characters', () => {
    const longString = 'A'.repeat(600);
    const result = sanitizeCellValue(longString);
    expect(typeof result === 'string' && result.length).toBe(500);
  });

  it('should not truncate strings at exactly 500 characters', () => {
    const exactString = 'B'.repeat(500);
    const result = sanitizeCellValue(exactString);
    expect(typeof result === 'string' && result.length).toBe(500);
  });
});

// ============================================================================
// Whitespace Normalization
// ============================================================================

describe('sanitizeCellValue - whitespace normalization', () => {
  it('should normalize multiple spaces to single space', () => {
    expect(sanitizeCellValue('hello    world')).toBe('hello world');
  });

  it('should normalize newlines to spaces', () => {
    expect(sanitizeCellValue('hello\nworld')).toBe('hello world');
  });

  it('should normalize mixed whitespace', () => {
    expect(sanitizeCellValue('hello\t\n  world')).toBe('hello world');
  });
});

// ============================================================================
// Row & Data Sanitization
// ============================================================================

describe('sanitizeRow', () => {
  it('should sanitize all values in a row', () => {
    const row = ['=formula', 42, '<b>html</b>', null, '-500'];
    const result = sanitizeRow(row);
    expect(result).toEqual(['formula', 42, 'html', null, '-500']);
  });
});

describe('sanitizeExcelData', () => {
  it('should sanitize all rows', () => {
    const data = [
      ['=A1', 100],
      ['@SUM', -200],
    ];
    const result = sanitizeExcelData(data);
    expect(result).toEqual([
      ['A1', 100],
      ['SUM', -200],
    ]);
  });
});

