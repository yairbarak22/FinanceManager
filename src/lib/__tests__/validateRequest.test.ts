/**
 * validateRequest Helper — Unit Tests
 *
 * Tests the generic request validation helper that wraps Zod parsing
 * with consistent error responses.
 */

import { describe, it, expect } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateRequest } from '../validateRequest';

// ============================================================================
// Test schema
// ============================================================================

const testSchema = z.object({
  name: z.string().min(1),
  age: z.number().int().positive(),
  email: z.string().email().optional(),
});

// ============================================================================
// Helpers
// ============================================================================

function jsonRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function badJsonRequest(rawBody: string): NextRequest {
  return new NextRequest('http://localhost:3000/api/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: rawBody,
  });
}

// ============================================================================
// Tests
// ============================================================================

describe('validateRequest', () => {
  // --- Success cases ---

  it('returns data and null errorResponse for valid input', async () => {
    const req = jsonRequest({ name: 'Alice', age: 30 });
    const result = await validateRequest(req, testSchema);

    expect(result.data).toEqual({ name: 'Alice', age: 30 });
    expect(result.errorResponse).toBeNull();
  });

  it('returns data with optional fields when provided', async () => {
    const req = jsonRequest({ name: 'Bob', age: 25, email: 'bob@example.com' });
    const result = await validateRequest(req, testSchema);

    expect(result.data).toEqual({
      name: 'Bob',
      age: 25,
      email: 'bob@example.com',
    });
    expect(result.errorResponse).toBeNull();
  });

  // --- Validation error cases ---

  it('returns null data and 400 errorResponse for missing required field', async () => {
    const req = jsonRequest({ age: 30 }); // missing name
    const result = await validateRequest(req, testSchema);

    expect(result.data).toBeNull();
    expect(result.errorResponse).toBeInstanceOf(NextResponse);
    expect(result.errorResponse!.status).toBe(400);

    const body = await result.errorResponse!.json();
    expect(body.error).toBeTruthy();
  });

  it('returns null data and 400 for invalid field type', async () => {
    const req = jsonRequest({ name: 'Alice', age: 'not-a-number' });
    const result = await validateRequest(req, testSchema);

    expect(result.data).toBeNull();
    expect(result.errorResponse!.status).toBe(400);
  });

  it('returns null data and 400 for negative age', async () => {
    const req = jsonRequest({ name: 'Alice', age: -5 });
    const result = await validateRequest(req, testSchema);

    expect(result.data).toBeNull();
    expect(result.errorResponse!.status).toBe(400);
  });

  it('returns null data and 400 for invalid email', async () => {
    const req = jsonRequest({ name: 'Alice', age: 30, email: 'not-an-email' });
    const result = await validateRequest(req, testSchema);

    expect(result.data).toBeNull();
    expect(result.errorResponse!.status).toBe(400);
  });

  it('includes field name in error message', async () => {
    const req = jsonRequest({ name: '', age: 30 });
    const result = await validateRequest(req, testSchema);

    expect(result.data).toBeNull();
    const body = await result.errorResponse!.json();
    // Should mention "name" in the error
    expect(body.error).toContain('name');
  });

  // --- JSON parse error cases ---

  it('returns 400 for invalid JSON body', async () => {
    const req = badJsonRequest('this is not json');
    const result = await validateRequest(req, testSchema);

    expect(result.data).toBeNull();
    expect(result.errorResponse!.status).toBe(400);

    const body = await result.errorResponse!.json();
    expect(body.error).toBe('Invalid JSON body');
  });

  it('returns 400 for empty body', async () => {
    const req = badJsonRequest('');
    const result = await validateRequest(req, testSchema);

    expect(result.data).toBeNull();
    expect(result.errorResponse!.status).toBe(400);
  });

  // --- Extra fields ---

  it('strips unknown fields (Zod default behavior)', async () => {
    const req = jsonRequest({
      name: 'Alice',
      age: 30,
      unknownField: 'should be stripped',
    });
    const result = await validateRequest(req, testSchema);

    expect(result.data).toEqual({ name: 'Alice', age: 30 });
    expect(result.errorResponse).toBeNull();
    expect((result.data as Record<string, unknown>)?.unknownField).toBeUndefined();
  });

  // --- Completely wrong input ---

  it('returns 400 for null body', async () => {
    const req = jsonRequest(null);
    const result = await validateRequest(req, testSchema);

    expect(result.data).toBeNull();
    expect(result.errorResponse!.status).toBe(400);
  });

  it('returns 400 for array instead of object', async () => {
    const req = jsonRequest([{ name: 'Alice', age: 30 }]);
    const result = await validateRequest(req, testSchema);

    expect(result.data).toBeNull();
    expect(result.errorResponse!.status).toBe(400);
  });
});

