/**
 * hashForEdge Tests
 *
 * Tests for the Edge-compatible PII hashing function.
 * Also includes a static analysis test to verify middleware uses emailHash.
 */

import { describe, it, expect } from 'vitest';
import { hashForEdge } from '../hashForEdge';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ============================================================================
// hashForEdge function tests
// ============================================================================

describe('hashForEdge', () => {
  it('should return a 16-character hex string', async () => {
    const result = await hashForEdge('test@example.com');
    expect(result).toMatch(/^[0-9a-f]{16}$/);
  });

  it('should be deterministic (same input = same output)', async () => {
    const result1 = await hashForEdge('user@example.com');
    const result2 = await hashForEdge('user@example.com');
    expect(result1).toBe(result2);
  });

  it('should produce different hashes for different inputs', async () => {
    const hash1 = await hashForEdge('alice@example.com');
    const hash2 = await hashForEdge('bob@example.com');
    expect(hash1).not.toBe(hash2);
  });

  it('should handle empty string without throwing', async () => {
    const result = await hashForEdge('');
    expect(result).toMatch(/^[0-9a-f]{16}$/);
  });

  it('should handle unicode input', async () => {
    const result = await hashForEdge('משתמש@דוגמה.com');
    expect(result).toMatch(/^[0-9a-f]{16}$/);
  });
});

// ============================================================================
// Static analysis: middleware uses emailHash, not raw email
// ============================================================================

describe('Middleware email hash integration', () => {
  it('should use emailHash (not raw email) in admin access audit log', () => {
    const middlewarePath = resolve(__dirname, '../../middleware.ts');
    const source = readFileSync(middlewarePath, 'utf-8');

    // The audit metadata should reference emailHash
    expect(source).toContain('emailHash');

    // It should NOT pass raw 'email' as a key in metadata for the UNAUTHORIZED_ACCESS log
    // Look for the specific pattern: metadata object should not have `email: token?.email`
    expect(source).not.toMatch(/metadata:\s*\{[^}]*\bemail\b:\s*token/);
  });
});
