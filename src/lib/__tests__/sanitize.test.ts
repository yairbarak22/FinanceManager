/**
 * Sanitize Utility Tests
 *
 * Tests for sanitizeEmailHtml() and escapeHtml() from src/lib/sanitize.ts.
 * Verifies that dangerous HTML is stripped while safe formatting is preserved.
 */

import { describe, it, expect } from 'vitest';
import { sanitizeEmailHtml, escapeHtml } from '../sanitize';

// ============================================================================
// sanitizeEmailHtml — strips dangerous tags, preserves safe formatting
// ============================================================================

describe('sanitizeEmailHtml', () => {
  it('should strip <script> tags', () => {
    const input = '<script>alert("xss")</script>Hello';
    const result = sanitizeEmailHtml(input);
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('alert');
    expect(result).toContain('Hello');
  });

  it('should strip <iframe> tags', () => {
    const input = '<iframe src="https://evil.com"></iframe>Content';
    const result = sanitizeEmailHtml(input);
    expect(result).not.toContain('<iframe');
    expect(result).toContain('Content');
  });

  it('should strip event handler attributes', () => {
    const input = '<div onmouseover="alert(1)" onclick="steal()">text</div>';
    const result = sanitizeEmailHtml(input);
    expect(result).not.toContain('onmouseover');
    expect(result).not.toContain('onclick');
    expect(result).toContain('text');
  });

  it('should preserve safe formatting tags', () => {
    const input = '<b>bold</b> <em>italic</em> <strong>strong</strong> <u>underline</u>';
    const result = sanitizeEmailHtml(input);
    expect(result).toContain('<b>bold</b>');
    expect(result).toContain('<em>italic</em>');
    expect(result).toContain('<strong>strong</strong>');
    expect(result).toContain('<u>underline</u>');
  });

  it('should preserve <a> tags with https href', () => {
    const input = '<a href="https://example.com">link</a>';
    const result = sanitizeEmailHtml(input);
    expect(result).toContain('<a href="https://example.com">link</a>');
  });

  it('should strip javascript: scheme from links', () => {
    const input = '<a href="javascript:alert(1)">click me</a>';
    const result = sanitizeEmailHtml(input);
    expect(result).not.toContain('javascript:');
  });

  it('should preserve list tags', () => {
    const input = '<ul><li>item 1</li><li>item 2</li></ul>';
    const result = sanitizeEmailHtml(input);
    expect(result).toContain('<ul>');
    expect(result).toContain('<li>item 1</li>');
  });

  it('should strip <img>, <form>, and <input> tags', () => {
    const input = '<img src="https://tracker.com/pixel.png"><form action="/steal"><input type="text"></form>';
    const result = sanitizeEmailHtml(input);
    expect(result).not.toContain('<img');
    expect(result).not.toContain('<form');
    expect(result).not.toContain('<input');
  });

  it('should handle nested dangerous content', () => {
    const input = '<div><script>bad()</script><b>ok</b></div>';
    const result = sanitizeEmailHtml(input);
    expect(result).not.toContain('<script>');
    expect(result).toContain('<b>ok</b>');
  });

  it('should strip <style> tags', () => {
    const input = '<style>body { display: none; }</style>Content';
    const result = sanitizeEmailHtml(input);
    expect(result).not.toContain('<style>');
    expect(result).toContain('Content');
  });
});

// ============================================================================
// escapeHtml — full entity escape for user-generated strings
// ============================================================================

describe('escapeHtml', () => {
  it('should escape all 5 HTML special characters', () => {
    const input = '<script>"test" & \'value\'';
    const result = escapeHtml(input);
    expect(result).toBe('&lt;script&gt;&quot;test&quot; &amp; &#39;value&#39;');
  });

  it('should leave plain text unchanged', () => {
    expect(escapeHtml('Hello World 123')).toBe('Hello World 123');
  });

  it('should escape a realistic email From field', () => {
    const input = 'John <john@evil.com>';
    const result = escapeHtml(input);
    expect(result).toContain('&lt;');
    expect(result).toContain('&gt;');
    expect(result).not.toContain('<john');
  });

  it('should escape multiple occurrences', () => {
    const input = '<a> & <b>';
    const result = escapeHtml(input);
    expect(result).toBe('&lt;a&gt; &amp; &lt;b&gt;');
  });
});
