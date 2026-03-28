/**
 * Generic Error Messages Tests (C-3)
 *
 * Tests that API routes return generic Hebrew error messages
 * and do NOT leak internal error.message details to the client.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================================
// Mocks
// ============================================================================

vi.mock('@/lib/prisma', () => ({
  prisma: {
    holding: { findMany: vi.fn().mockResolvedValue([]) },
    userProfile: { findUnique: vi.fn().mockResolvedValue(null) },
    user: { findUnique: vi.fn().mockResolvedValue({ id: 'test-user-1' }) },
    sharedAccountMember: {
      findFirst: vi.fn().mockResolvedValue({ sharedAccountId: 'shared-1', userId: 'test-user-1' }),
      findMany: vi.fn().mockResolvedValue([{ userId: 'test-user-1' }]),
    },
    marketingCampaign: { findUnique: vi.fn() },
  },
}));

vi.mock('@/lib/cache', () => ({
  cacheGet: vi.fn().mockResolvedValue({ id: 'test-user-1' }),
  cacheSet: vi.fn(),
  cacheDelete: vi.fn(),
  CacheKeys: { authUser: (id: string) => `auth:${id}`, sharedMembers: (id: string) => `shared:${id}` },
  CacheTTL: { AUTH_USER: 3600, SHARED_MEMBERS: 300 },
}));

vi.mock('next-auth', () => ({
  getServerSession: vi.fn().mockResolvedValue({
    user: { id: 'test-user-1', email: 'admin@example.com', name: 'Admin' },
  }),
}));

vi.mock('@/lib/auth', () => ({ authOptions: {} }));

vi.mock('@/lib/rateLimit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ success: true, limit: 100, remaining: 99, resetTime: Date.now() + 60000 }),
  RATE_LIMITS: { api: { maxRequests: 100, windowSeconds: 60 }, admin: { maxRequests: 30, windowSeconds: 60 } },
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
}));

vi.mock('@/lib/config', () => ({
  config: {
    encryptionKey: 'a'.repeat(64),
    nodeEnv: 'test',
    adminEmails: ['admin@example.com'],
    resendApiKey: 'test-resend-key',
  },
}));

vi.mock('@/lib/auditLog', () => ({
  logAuditEvent: vi.fn(),
  AuditAction: { CREATE: 'CREATE', UPDATE: 'UPDATE', DELETE: 'DELETE' },
  getRequestInfo: vi.fn().mockReturnValue({ ipAddress: '127.0.0.1', userAgent: 'test' }),
}));

// Mock market services to throw errors with sensitive details
vi.mock('@/lib/finance/marketService', () => ({
  getQuote: vi.fn().mockRejectedValue(new Error('EODHD API key invalid: sk_live_abc123')),
  searchSymbols: vi.fn().mockRejectedValue(new Error('Connection refused to api.eodhd.com')),
  detectAssetType: vi.fn().mockReturnValue({ isIsraeli: false, isCrypto: false }),
  analyzePortfolio: vi.fn().mockRejectedValue(new Error('Internal portfolio calculation failed at line 42')),
  getUsdIlsRate: vi.fn().mockResolvedValue(3.65),
}));

vi.mock('@/lib/finance/enrichmentService', () => ({
  searchHebrew: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/lib/finance/providers/eod', () => ({
  normalizeSymbol: vi.fn((s: string) => s),
}));

vi.mock('@/lib/marketing/segment', () => ({
  getSegmentUsers: vi.fn().mockRejectedValue(new Error('Database connection pool exhausted')),
  validateSegmentFilter: vi.fn().mockReturnValue(true),
}));

// ============================================================================
// Imports
// ============================================================================

import { createMockRequest } from '../../helpers/api';
import { GET as getQuote } from '@/app/api/finance/quote/route';
import { GET as searchStocks } from '@/app/api/finance/search/route';
import { POST as analyzePost, GET as analyzeGet } from '@/app/api/portfolio/analyze/route';

beforeEach(() => {
  vi.clearAllMocks();
});

// ============================================================================
// Tests
// ============================================================================

describe('Generic error messages (C-3)', () => {
  it('GET /finance/quote should return generic Hebrew error, not API key', async () => {
    const request = createMockRequest('/api/finance/quote', {
      searchParams: { symbol: 'AAPL' },
    });
    const response = await getQuote(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('שגיאה בטעינת נתוני המניה');

    // Must NOT contain sensitive internal details
    const bodyStr = JSON.stringify(body);
    expect(bodyStr).not.toContain('sk_live');
    expect(bodyStr).not.toContain('API key');
    expect(bodyStr).not.toContain('EODHD');
  });

  it('GET /finance/search should return generic Hebrew error, not connection details', async () => {
    const request = createMockRequest('/api/finance/search', {
      searchParams: { q: 'AAPL' },
    });
    const response = await searchStocks(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('שגיאה בחיפוש ניירות ערך');

    const bodyStr = JSON.stringify(body);
    expect(bodyStr).not.toContain('Connection refused');
    expect(bodyStr).not.toContain('eodhd.com');
  });

  it('POST /portfolio/analyze should return generic Hebrew error', async () => {
    const request = createMockRequest('/api/portfolio/analyze', {
      method: 'POST',
      body: { holdings: [{ symbol: 'AAPL', quantity: 10 }] },
    });
    const response = await analyzePost(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('שגיאה בניתוח התיק');

    const bodyStr = JSON.stringify(body);
    expect(bodyStr).not.toContain('Internal portfolio');
    expect(bodyStr).not.toContain('line 42');
  });

  it('GET /portfolio/analyze should return generic Hebrew error', async () => {
    // Mock holdings to trigger analyzePortfolio call
    const { prisma } = await import('@/lib/prisma');
    vi.mocked(prisma.holding.findMany).mockResolvedValue([
      { id: 'h1', symbol: 'AAPL', currentValue: 1000, currency: 'USD' },
    ] as never);

    const response = await analyzeGet();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('שגיאה בניתוח התיק');
  });

  it('POST /campaigns/[id]/send should not include details field', async () => {
    const { prisma } = await import('@/lib/prisma');
    vi.mocked(prisma.marketingCampaign.findUnique).mockResolvedValue({
      id: 'campaign-1',
      status: 'DRAFT',
      segmentFilter: { type: 'all' },
      isAbTest: false,
    } as never);

    // Import dynamically to get fresh mocks
    const { POST } = await import('@/app/api/admin/marketing/campaigns/[id]/send/route');
    const request = createMockRequest('/api/admin/marketing/campaigns/campaign-1/send', {
      method: 'POST',
      body: {},
    });
    const params = { params: Promise.resolve({ id: 'campaign-1' }) };
    const response = await POST(request, params);
    const body = await response.json();

    // If it's a 500 error, it should NOT have a 'details' field
    if (response.status === 500) {
      expect(body).not.toHaveProperty('details');
      expect(body.error).toBe('שגיאה בשליחת הקמפיין');
    }
  });
});
