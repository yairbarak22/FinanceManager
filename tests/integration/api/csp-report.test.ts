/**
 * CSP Report Endpoint — Integration Tests
 *
 * Verifies that the /api/csp-report endpoint:
 * - Accepts valid CSP violation reports
 * - Handles malformed payloads gracefully
 * - Does not require authentication
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// The endpoint is lightweight (no DB / no auth), so we import directly.
import { POST } from '@/app/api/csp-report/route';

// Spy on console.warn to verify logging
const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

beforeEach(() => {
  warnSpy.mockClear();
  errorSpy.mockClear();
});

// ============================================================================
// Helper
// ============================================================================

function cspReportRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/csp-report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// ============================================================================
// Tests
// ============================================================================

describe('POST /api/csp-report', () => {
  it('returns 204 for a valid CSP violation report', async () => {
    const report = {
      'csp-report': {
        'document-uri': 'https://example.com/',
        'violated-directive': "script-src 'self'",
        'blocked-uri': 'https://evil.com/script.js',
        'source-file': 'https://example.com/page.html',
        'line-number': 42,
      },
    };

    const response = await POST(cspReportRequest(report));
    expect(response.status).toBe(204);
  });

  it('logs the violation details', async () => {
    const report = {
      'csp-report': {
        'document-uri': 'https://example.com/page',
        'violated-directive': "script-src 'self'",
        'blocked-uri': 'https://evil.com/bad.js',
      },
    };

    await POST(cspReportRequest(report));

    expect(warnSpy).toHaveBeenCalledTimes(1);
    const loggedJson = JSON.parse(warnSpy.mock.calls[0][0] as string);
    expect(loggedJson.level).toBe('csp-violation');
    expect(loggedJson.blockedUri).toBe('https://evil.com/bad.js');
    expect(loggedJson.violatedDirective).toBe("script-src 'self'");
  });

  it('returns 204 for a flat report (no csp-report wrapper)', async () => {
    const flatReport = {
      'document-uri': 'https://example.com/',
      'violated-directive': "img-src 'self'",
      'blocked-uri': 'data:image/png;base64,...',
    };

    const response = await POST(cspReportRequest(flatReport));
    expect(response.status).toBe(204);
  });

  it('returns 204 for malformed JSON (does not crash)', async () => {
    const req = new NextRequest('http://localhost:3000/api/csp-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'this is not json',
    });

    const response = await POST(req);
    expect(response.status).toBe(204);
  });

  it('returns 204 for empty body', async () => {
    const req = new NextRequest('http://localhost:3000/api/csp-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });

    const response = await POST(req);
    expect(response.status).toBe(204);
  });

  it('does not require authentication headers', async () => {
    const report = {
      'csp-report': {
        'blocked-uri': 'inline',
        'violated-directive': "script-src 'self'",
      },
    };

    // No auth headers, no CSRF — should still work
    const req = new NextRequest('http://localhost:3000/api/csp-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/csp-report' },
      body: JSON.stringify(report),
    });

    const response = await POST(req);
    expect(response.status).toBe(204);
  });
});

