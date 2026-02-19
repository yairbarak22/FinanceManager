/**
 * Contact Validation Tests
 *
 * Tests for input sanitization, email validation, spam detection,
 * and form validation.
 */

import { describe, it, expect } from 'vitest';
import {
  sanitizeInput,
  escapeHtml,
  isValidEmail,
  detectSpam,
  validateContactForm,
  isValidCategory,
} from '../contactValidation';

// ============================================================================
// Input Sanitization
// ============================================================================

describe('sanitizeInput', () => {
  it('should remove HTML tags', () => {
    expect(sanitizeInput('<script>alert("xss")</script>Hello')).not.toContain('<script>');
    expect(sanitizeInput('<b>Bold</b>')).not.toContain('<b>');
  });

  it('should escape ampersand after stripping tags', () => {
    // sanitizeInput strips HTML tags first, then escapes remaining special chars
    const result = sanitizeInput('a & b');
    expect(result).toContain('&amp;');
  });

  it('should strip angle brackets as HTML tags', () => {
    // `< c >` is treated as a tag and removed
    const result = sanitizeInput('a < c > d');
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
  });

  it('should remove null bytes', () => {
    expect(sanitizeInput('hello\x00world')).toBe('helloworld');
  });

  it('should trim whitespace', () => {
    expect(sanitizeInput('  hello  ')).toBe('hello');
  });

  it('should handle non-string input', () => {
    expect(sanitizeInput(null as unknown as string)).toBe('');
    expect(sanitizeInput(undefined as unknown as string)).toBe('');
    expect(sanitizeInput(42 as unknown as string)).toBe('');
  });

  it('should normalize unicode', () => {
    // NFC normalization
    const input = 'café'; // Could be in different normalization forms
    const result = sanitizeInput(input);
    expect(result).toBe(result.normalize('NFC'));
  });
});

// ============================================================================
// HTML Escaping
// ============================================================================

describe('escapeHtml', () => {
  it('should escape <, >, &, ", \'', () => {
    const result = escapeHtml('<script>alert("xss")</script>');
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
    expect(result).toContain('&lt;');
    expect(result).toContain('&gt;');
    expect(result).toContain('&quot;');
  });

  it('should handle null/undefined', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });

  it('should handle numbers', () => {
    expect(escapeHtml(42)).toBe('42');
  });
});

// ============================================================================
// Email Validation
// ============================================================================

describe('isValidEmail', () => {
  it('should accept valid emails', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('user.name@domain.co.il')).toBe(true);
    expect(isValidEmail('user+tag@gmail.com')).toBe(true);
  });

  it('should reject invalid emails', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('not-an-email')).toBe(false);
    expect(isValidEmail('@domain.com')).toBe(false);
    expect(isValidEmail('user@')).toBe(false);
    expect(isValidEmail('user@.com')).toBe(false);
  });

  it('should reject too-long emails', () => {
    const longEmail = 'a'.repeat(250) + '@b.com';
    expect(isValidEmail(longEmail)).toBe(false);
  });

  it('should handle non-string input', () => {
    expect(isValidEmail(null as unknown as string)).toBe(false);
    expect(isValidEmail(42 as unknown as string)).toBe(false);
  });
});

// ============================================================================
// Spam Detection
// ============================================================================

describe('detectSpam', () => {
  it('should detect excessive links', () => {
    const message = 'Check http://a.com http://b.com http://c.com http://d.com';
    const result = detectSpam(message, 'Test');
    expect(result.isSpam).toBe(true);
    expect(result.reason).toBe('excessive_links');
  });

  it('should detect spam keywords', () => {
    const result = detectSpam('You are the lottery winner!', 'Prize');
    expect(result.isSpam).toBe(true);
    expect(result.reason).toBe('spam_keywords');
  });

  it('should detect Hebrew spam keywords', () => {
    const result = detectSpam('הימורים מקוונים', 'זכית בפרס');
    expect(result.isSpam).toBe(true);
  });

  it('should detect repeated characters', () => {
    const result = detectSpam('aaaaaaaaa test', 'Subject');
    expect(result.isSpam).toBe(true);
    expect(result.reason).toBe('repeated_characters');
  });

  it('should allow normal messages', () => {
    const result = detectSpam('שלום, יש לי שאלה לגבי המערכת', 'שאלה כללית');
    expect(result.isSpam).toBe(false);
  });
});

// ============================================================================
// Form Validation
// ============================================================================

describe('validateContactForm', () => {
  it('should accept valid form data', () => {
    const result = validateContactForm({
      category: 'general',
      subject: 'Test Subject',
      message: 'This is a test message with enough length.',
    });
    expect(result.isValid).toBe(true);
    expect(result.sanitizedData).toBeDefined();
  });

  it('should reject invalid category', () => {
    const result = validateContactForm({
      category: 'invalid',
      subject: 'Test',
      message: 'This is a test message.',
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.category).toBeDefined();
  });

  it('should reject too-short subject', () => {
    const result = validateContactForm({
      category: 'general',
      subject: 'Hi',
      message: 'This is a test message.',
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.subject).toBeDefined();
  });

  it('should reject too-short message', () => {
    const result = validateContactForm({
      category: 'general',
      subject: 'Test Subject',
      message: 'Short',
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.message).toBeDefined();
  });

  it('should detect honeypot (bot detection)', () => {
    const result = validateContactForm({
      category: 'general',
      subject: 'Test',
      message: 'Test message enough length.',
      website: 'http://spam.com', // Honeypot filled = bot
    });
    expect(result.isValid).toBe(false);
  });

  it('should reject non-object input', () => {
    expect(validateContactForm(null).isValid).toBe(false);
    expect(validateContactForm('string').isValid).toBe(false);
  });
});

describe('isValidCategory', () => {
  it('should accept valid categories', () => {
    expect(isValidCategory('bug')).toBe(true);
    expect(isValidCategory('feature')).toBe(true);
    expect(isValidCategory('general')).toBe(true);
  });

  it('should reject invalid categories', () => {
    expect(isValidCategory('invalid')).toBe(false);
    expect(isValidCategory('')).toBe(false);
  });
});

