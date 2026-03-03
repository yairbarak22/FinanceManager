/**
 * Import API Integration Tests
 *
 * Tests the 5-step classification pipeline:
 * 1. Blacklist (digital wallets / ambiguous terms → needsReview)
 * 2. Local Cache (per-user MerchantCategoryMap)
 * 3. Global Consensus (cross-user GlobalMerchantStats)
 * 4. AI Fallback (GPT-4)
 * 5. Community Context (isHarediContext)
 *
 * All external services (Prisma, AI, rate limiter) are fully mocked.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ─────────────────────────────────────────────────────────────
// Module mocks – must be declared before any imports that
// trigger the route module to load.
// ─────────────────────────────────────────────────────────────

const { mockGenerateText } = vi.hoisted(() => ({
  mockGenerateText: vi.fn(),
}));

vi.mock('ai', () => ({
  generateText: mockGenerateText,
}));

vi.mock('@ai-sdk/openai', () => ({
  openai: vi.fn(() => 'mock-model'),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    merchantCategoryMap: { findMany: vi.fn(), createMany: vi.fn() },
    globalMerchantStats: { findMany: vi.fn() },
    globalMerchantVote: { findMany: vi.fn() },
  },
}));

vi.mock('@/lib/authHelpers', () => ({
  requireAuth: vi.fn().mockResolvedValue({ userId: 'test-user-1', error: null }),
}));

vi.mock('@/lib/rateLimit', () => ({
  checkRateLimitWithIp: vi.fn().mockResolvedValue({ success: true }),
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
  RATE_LIMITS: { import: { maxRequests: 5, windowSeconds: 60 } },
  IP_RATE_LIMITS: { import: { maxRequests: 8, windowSeconds: 60 } },
}));

vi.mock('@/lib/config', () => ({
  config: { encryptionKey: 'a'.repeat(64), nodeEnv: 'test' },
}));

vi.mock('@/lib/fileValidator', () => ({
  validateExcelFile: vi.fn().mockReturnValue(null),
}));

vi.mock('@/lib/excelSanitizer', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/excelSanitizer')>();
  return { ...actual };
});

// ─────────────────────────────────────────────────────────────
// Imports (after mocks)
// ─────────────────────────────────────────────────────────────

import { POST } from '@/app/api/transactions/import/route';
import { prisma } from '@/lib/prisma';
import { buildImportFormData } from '../../utils/dummyFileGenerator';

const mockPrisma = vi.mocked(prisma);

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function buildRequest(formData: FormData): NextRequest {
  const url = 'http://localhost:3000/api/transactions/import';
  return new NextRequest(url, {
    method: 'POST',
    body: formData,
  });
}

/**
 * Build a generateText mock that returns a valid column mapping on the first
 * call and a merchant→category JSON on the second call.
 */
function setupAIMock(merchantClassifications: Record<string, string>) {
  const columnMappingResponse = JSON.stringify({
    dateIndex: 0,
    merchantIndex: 1,
    amountIndex: 2,
    isDualAmount: false,
    debitIndex: -1,
    creditIndex: -1,
  });

  // Build the AI classification response keyed by "merchant (הוצאה)"
  const classificationWithSuffix: Record<string, string> = {};
  for (const [merchant, category] of Object.entries(merchantClassifications)) {
    classificationWithSuffix[`${merchant} (הוצאה)`] = category;
  }
  const classificationResponse = JSON.stringify(classificationWithSuffix);

  mockGenerateText
    .mockResolvedValueOnce({ text: columnMappingResponse })
    .mockResolvedValueOnce({ text: classificationResponse });
}

// ─────────────────────────────────────────────────────────────
// Setup
// ─────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockGenerateText.mockReset();

  // Default: non-Haredi user
  mockPrisma.user.findUnique.mockResolvedValue({
    signupSource: 'organic',
  } as never);

  // Default: empty local cache
  mockPrisma.merchantCategoryMap.findMany.mockResolvedValue([] as never);
  mockPrisma.merchantCategoryMap.createMany.mockResolvedValue({ count: 0 } as never);

  // Default: no global consensus data
  mockPrisma.globalMerchantStats.findMany.mockResolvedValue([] as never);
  mockPrisma.globalMerchantVote.findMany.mockResolvedValue([] as never);
});

// ============================================================================
// Test Scenarios
// ============================================================================

describe('Import API - 5-Step Classification Pipeline', () => {
  // ────────────────────────────────────────────────────────────
  // Scenario 1: Blacklist → needsReview
  // ────────────────────────────────────────────────────────────
  describe('Scenario 1: Blacklist', () => {
    it('should send blacklisted merchant "Bit" straight to needsReview', async () => {
      const formData = buildImportFormData([
        { date: '15/01/2025', merchant: 'Bit', amount: 50 },
        { date: '16/01/2025', merchant: 'שופרסל', amount: 200 },
      ]);

      // AI will be called for column mapping + שופרסל classification
      setupAIMock({ 'שופרסל': 'food' });

      const res = await POST(buildRequest(formData));
      const body = await res.json();

      expect(res.status).toBe(200);

      // "Bit" must be in needsReview (blacklisted)
      const reviewMerchants = body.needsReview.map((t: { merchantName: string }) => t.merchantName);
      expect(reviewMerchants).toContain('Bit');

      // "שופרסל" should be classified (via AI fallback)
      const classifiedMerchants = body.transactions.map((t: { merchantName: string }) => t.merchantName);
      expect(classifiedMerchants).toContain('שופרסל');
    });

    it('should blacklist Hebrew wallet names like "ביט" and ambiguous terms like "קניות"', async () => {
      const formData = buildImportFormData([
        { date: '15/01/2025', merchant: 'ביט', amount: 100 },
        { date: '16/01/2025', merchant: 'קניות', amount: 300 },
      ]);

      // No AI classification needed since both are blacklisted
      setupAIMock({});

      const res = await POST(buildRequest(formData));
      const body = await res.json();

      expect(res.status).toBe(200);
      const reviewMerchants = body.needsReview.map((t: { merchantName: string }) => t.merchantName);
      expect(reviewMerchants).toContain('ביט');
      expect(reviewMerchants).toContain('קניות');
      expect(body.transactions).toHaveLength(0);
    });
  });

  // ────────────────────────────────────────────────────────────
  // Scenario 2: Local Cache Hit
  // ────────────────────────────────────────────────────────────
  describe('Scenario 2: Local Cache Hit', () => {
    it('should use the local MerchantCategoryMap and skip Global/AI', async () => {
      // Seed the local cache mock
      mockPrisma.merchantCategoryMap.findMany.mockResolvedValue([
        { merchantName: 'סונול', category: 'transport', alwaysAsk: false },
      ] as never);

      const formData = buildImportFormData([
        { date: '15/01/2025', merchant: 'סונול', amount: 150 },
      ]);

      setupAIMock({});

      const res = await POST(buildRequest(formData));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.transactions).toHaveLength(1);
      expect(body.transactions[0].category).toBe('transport');
      expect(body.stats.cached).toBe(1);

      // AI should have been called for column mapping but NOT for classification
      // (the second call should not happen since no merchants need AI)
      const classificationCalls = mockGenerateText.mock.calls.filter(
        (call: unknown[]) => {
          const arg = call[0] as { system?: string };
          return arg.system && !arg.system.includes('dateIndex');
        }
      );
      // The merchant should NOT have been sent to AI
      expect(body.stats.aiClassified).toBe(0);
    });
  });

  // ────────────────────────────────────────────────────────────
  // Scenario 3: Global Consensus Hit
  // ────────────────────────────────────────────────────────────
  describe('Scenario 3: Global Consensus Hit', () => {
    it('should auto-classify via consensus when >= 75% agreement from >= 3 users', async () => {
      const { superNormalizeMerchantName } = await import('@/lib/classificationUtils');
      const normalizedFuel = superNormalizeMerchantName('דלק');

      // Mock global stats: "דלק" has strong consensus for "transport"
      mockPrisma.globalMerchantStats.findMany.mockResolvedValue([
        { merchantName: normalizedFuel, category: 'transport', count: 8, isHarediContext: false },
        { merchantName: normalizedFuel, category: 'other', count: 1, isHarediContext: false },
      ] as never);

      // Mock votes: 4 unique users voted
      mockPrisma.globalMerchantVote.findMany.mockResolvedValue([
        { merchantName: normalizedFuel, userId: 'user-a' },
        { merchantName: normalizedFuel, userId: 'user-b' },
        { merchantName: normalizedFuel, userId: 'user-c' },
        { merchantName: normalizedFuel, userId: 'user-d' },
      ] as never);

      const formData = buildImportFormData([
        { date: '15/01/2025', merchant: 'דלק', amount: 250 },
      ]);

      setupAIMock({});

      const res = await POST(buildRequest(formData));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.transactions).toHaveLength(1);
      expect(body.transactions[0].category).toBe('transport');
      expect(body.stats.globalConsensus).toBe(1);
      expect(body.stats.aiClassified).toBe(0);
    });
  });

  // ────────────────────────────────────────────────────────────
  // Scenario 4: AI Fallback
  // ────────────────────────────────────────────────────────────
  describe('Scenario 4: AI Fallback', () => {
    it('should call AI when no local cache or global consensus exists', async () => {
      const formData = buildImportFormData([
        { date: '15/01/2025', merchant: 'מסעדת השף', amount: 180 },
      ]);

      // AI will classify this merchant
      setupAIMock({ 'מסעדת השף': 'food' });

      const res = await POST(buildRequest(formData));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.transactions).toHaveLength(1);
      expect(body.transactions[0].category).toBe('food');
      expect(body.stats.aiClassified).toBe(1);

      // Verify generateText was called (at least twice: column mapping + classification)
      expect(mockGenerateText).toHaveBeenCalled();
    });

    it('should send unclassifiable merchants to needsReview when AI returns null', async () => {
      const formData = buildImportFormData([
        { date: '15/01/2025', merchant: 'עסק לא ידוע', amount: 50 },
      ]);

      // Column mapping succeeds, but classification returns empty/null
      mockGenerateText
        .mockResolvedValueOnce({
          text: JSON.stringify({
            dateIndex: 0, merchantIndex: 1, amountIndex: 2,
            isDualAmount: false, debitIndex: -1, creditIndex: -1,
          }),
        })
        .mockResolvedValueOnce({
          text: JSON.stringify({ 'עסק לא ידוע (הוצאה)': null }),
        });

      const res = await POST(buildRequest(formData));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.needsReview).toHaveLength(1);
      expect(body.needsReview[0].merchantName).toBe('עסק לא ידוע');
    });
  });

  // ────────────────────────────────────────────────────────────
  // Scenario 5: Community Context (isHarediContext)
  // ────────────────────────────────────────────────────────────
  describe('Scenario 5: Community Context (Haredi)', () => {
    it('should use Haredi-specific consensus for users with signupSource=prog', async () => {
      // Mark user as Haredi
      mockPrisma.user.findUnique.mockResolvedValue({
        signupSource: 'prog',
      } as never);

      const { superNormalizeMerchantName } = await import('@/lib/classificationUtils');
      const normalizedDonation = superNormalizeMerchantName('קופת צדקה');

      // Mock global stats: Haredi users classify "קופת צדקה" as "donation"
      mockPrisma.globalMerchantStats.findMany.mockResolvedValue([
        { merchantName: normalizedDonation, category: 'donation', count: 10, isHarediContext: true },
      ] as never);

      // Mock votes: 5 unique Haredi users
      mockPrisma.globalMerchantVote.findMany.mockResolvedValue([
        { merchantName: normalizedDonation, userId: 'haredi-1' },
        { merchantName: normalizedDonation, userId: 'haredi-2' },
        { merchantName: normalizedDonation, userId: 'haredi-3' },
        { merchantName: normalizedDonation, userId: 'haredi-4' },
        { merchantName: normalizedDonation, userId: 'haredi-5' },
      ] as never);

      const formData = buildImportFormData([
        { date: '15/01/2025', merchant: 'קופת צדקה', amount: 100 },
      ]);

      setupAIMock({});

      const res = await POST(buildRequest(formData));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.transactions).toHaveLength(1);
      expect(body.transactions[0].category).toBe('donation');
      expect(body.stats.globalConsensus).toBe(1);
    });

    it('should query consensus with isHarediContext=true for Haredi users', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        signupSource: 'prog',
      } as never);

      const formData = buildImportFormData([
        { date: '15/01/2025', merchant: 'חנות כלשהי', amount: 50 },
      ]);

      setupAIMock({ 'חנות כלשהי': 'shopping' });

      const res = await POST(buildRequest(formData));
      expect(res.status).toBe(200);

      // Verify that globalMerchantStats was queried with isHarediContext: true
      const statsCall = mockPrisma.globalMerchantStats.findMany.mock.calls[0];
      expect(statsCall).toBeDefined();
      const statsWhere = (statsCall[0] as { where: { isHarediContext: boolean } }).where;
      expect(statsWhere.isHarediContext).toBe(true);
    });
  });

  // ────────────────────────────────────────────────────────────
  // Combined Pipeline Test
  // ────────────────────────────────────────────────────────────
  describe('Combined pipeline', () => {
    it('should correctly route each merchant through the right pipeline step', async () => {
      const { superNormalizeMerchantName } = await import('@/lib/classificationUtils');

      // Local cache for "סונול"
      mockPrisma.merchantCategoryMap.findMany.mockResolvedValue([
        { merchantName: 'סונול', category: 'transport', alwaysAsk: false },
      ] as never);

      // Global consensus for "רמי לוי"
      const normalizedRami = superNormalizeMerchantName('רמי לוי');
      mockPrisma.globalMerchantStats.findMany.mockResolvedValue([
        { merchantName: normalizedRami, category: 'food', count: 12, isHarediContext: false },
      ] as never);
      mockPrisma.globalMerchantVote.findMany.mockResolvedValue([
        { merchantName: normalizedRami, userId: 'u1' },
        { merchantName: normalizedRami, userId: 'u2' },
        { merchantName: normalizedRami, userId: 'u3' },
        { merchantName: normalizedRami, userId: 'u4' },
      ] as never);

      const formData = buildImportFormData([
        { date: '15/01/2025', merchant: 'Bit', amount: 50 },         // → blacklist
        { date: '16/01/2025', merchant: 'סונול', amount: 150 },      // → local cache
        { date: '17/01/2025', merchant: 'רמי לוי', amount: 300 },    // → global consensus
        { date: '18/01/2025', merchant: 'מסעדה חדשה', amount: 100 }, // → AI fallback
      ]);

      setupAIMock({ 'מסעדה חדשה': 'food' });

      const res = await POST(buildRequest(formData));
      const body = await res.json();

      expect(res.status).toBe(200);

      // Blacklisted → needsReview
      const reviewNames = body.needsReview.map((t: { merchantName: string }) => t.merchantName);
      expect(reviewNames).toContain('Bit');

      // Classified merchants
      const classified = new Map(
        body.transactions.map((t: { merchantName: string; category: string }) => [t.merchantName, t.category])
      );
      expect(classified.get('סונול')).toBe('transport');    // local cache
      expect(classified.get('רמי לוי')).toBe('food');        // global consensus
      expect(classified.get('מסעדה חדשה')).toBe('food');     // AI fallback

      // Verify stats
      expect(body.stats.cached).toBe(1);
      expect(body.stats.globalConsensus).toBe(1);
      expect(body.stats.aiClassified).toBe(1);
      expect(body.stats.needsReview).toBe(1);
    });
  });
});
