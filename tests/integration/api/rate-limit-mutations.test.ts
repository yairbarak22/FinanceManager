/**
 * Rate Limit Mutation Routes Tests (H-6)
 *
 * Tests that all mutation routes enforce rate limiting.
 * Verifies 429 response when checkRateLimit returns { success: false }.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================================
// Mocks
// ============================================================================

vi.mock('@/lib/prisma', () => ({
  prisma: {
    transaction: { updateMany: vi.fn(), deleteMany: vi.fn(), findFirst: vi.fn() },
    financialGoal: { findFirst: vi.fn() },
    customCategory: { findFirst: vi.fn() },
    asset: { findFirst: vi.fn(), updateMany: vi.fn(), deleteMany: vi.fn() },
    liability: { findFirst: vi.fn(), updateMany: vi.fn(), deleteMany: vi.fn() },
    mortgageTrack: { deleteMany: vi.fn(), create: vi.fn() },
    userProfile: { findUnique: vi.fn(), upsert: vi.fn(), create: vi.fn() },
    accountInvite: { findUnique: vi.fn(), delete: vi.fn() },
    sharedAccount: { delete: vi.fn() },
    sharedAccountMember: {
      findFirst: vi.fn().mockResolvedValue({ sharedAccountId: 'shared-1', userId: 'test-user-1' }),
      findMany: vi.fn().mockResolvedValue([{ userId: 'test-user-1' }]),
      deleteMany: vi.fn(),
      create: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
    },
    user: { findUnique: vi.fn().mockResolvedValue({ id: 'test-user-1', email: 'test@example.com' }) },
    $transaction: vi.fn(),
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
    user: { id: 'test-user-1', email: 'test@example.com', name: 'Test' },
  }),
}));

vi.mock('@/lib/auth', () => ({ authOptions: {} }));

vi.mock('@/lib/rateLimit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ success: true, limit: 100, remaining: 99, resetTime: Date.now() + 60000 }),
  RATE_LIMITS: { api: { maxRequests: 100, windowSeconds: 60 } },
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
}));

vi.mock('@/lib/config', () => ({
  config: {
    encryptionKey: 'a'.repeat(64),
    nodeEnv: 'test',
  },
}));

vi.mock('@/lib/auditLog', () => ({
  logAuditEvent: vi.fn(),
  AuditAction: { CREATE: 'CREATE', UPDATE: 'UPDATE', DELETE: 'DELETE', INVITE_ACCEPTED: 'INVITE_ACCEPTED' },
  getRequestInfo: vi.fn().mockReturnValue({ ipAddress: '127.0.0.1', userAgent: 'test' }),
}));

vi.mock('@/lib/assetHistory', () => ({
  saveAssetHistoryIfChanged: vi.fn(),
}));

vi.mock('@/lib/netWorthHistory', () => ({
  saveCurrentMonthNetWorth: vi.fn(),
}));

vi.mock('@/lib/portfolioAssetSync', () => ({
  isPortfolioSyncAsset: vi.fn().mockReturnValue(false),
}));

vi.mock('@/lib/goalCalculations', () => ({
  recalculateDeadline: vi.fn(),
}));

vi.mock('@/lib/encryption', () => ({
  encrypt: vi.fn((v: string) => `enc:${v}`),
  decrypt: vi.fn((v: string) => v.replace('enc:', '')),
  ENCRYPTED_PROFILE_FIELDS: [],
}));

// ============================================================================
// Imports
// ============================================================================

import { checkRateLimit } from '@/lib/rateLimit';
import { createMockRequest } from '../../helpers/api';

import { PUT as putTransaction, DELETE as deleteTransaction } from '@/app/api/transactions/[id]/route';
import { POST as acceptInvite } from '@/app/api/account/invite/accept/route';
import { GET as getProfile, PUT as putProfile } from '@/app/api/profile/route';
import { PUT as putAsset, DELETE as deleteAsset } from '@/app/api/assets/[id]/route';
import { PUT as putLiability, DELETE as deleteLiability } from '@/app/api/liabilities/[id]/route';

const mockCheckRateLimit = vi.mocked(checkRateLimit);

const idParams = { params: Promise.resolve({ id: 'test-id-1' }) };

beforeEach(() => {
  vi.clearAllMocks();
  mockCheckRateLimit.mockResolvedValue({ success: true, limit: 100, remaining: 99, resetTime: Date.now() + 60000 });
});

// ============================================================================
// Rate limit enforcement tests
// ============================================================================

describe('Rate limiting on mutation routes (H-6)', () => {
  describe('transactions/[id]', () => {
    it('PUT should return 429 when rate limited', async () => {
      mockCheckRateLimit.mockResolvedValueOnce({ success: false, limit: 100, remaining: 0, resetTime: Date.now() + 60000 });
      const request = createMockRequest('/api/transactions/test-id-1', {
        method: 'PUT',
        body: { amount: 100 },
      });
      const response = await putTransaction(request, idParams);
      expect(response.status).toBe(429);
    });

    it('DELETE should return 429 when rate limited', async () => {
      mockCheckRateLimit.mockResolvedValueOnce({ success: false, limit: 100, remaining: 0, resetTime: Date.now() + 60000 });
      const request = createMockRequest('/api/transactions/test-id-1', { method: 'DELETE' });
      const response = await deleteTransaction(request, idParams);
      expect(response.status).toBe(429);
    });
  });

  describe('account/invite/accept', () => {
    it('POST should return 429 when rate limited', async () => {
      mockCheckRateLimit.mockResolvedValueOnce({ success: false, limit: 100, remaining: 0, resetTime: Date.now() + 60000 });
      const request = createMockRequest('/api/account/invite/accept', {
        method: 'POST',
        body: { token: 'invite-token-1' },
      });
      const response = await acceptInvite(request);
      expect(response.status).toBe(429);
    });
  });

  describe('profile', () => {
    it('GET should return 429 when rate limited', async () => {
      mockCheckRateLimit.mockResolvedValueOnce({ success: false, limit: 100, remaining: 0, resetTime: Date.now() + 60000 });
      const response = await getProfile();
      expect(response.status).toBe(429);
    });

    it('PUT should return 429 when rate limited', async () => {
      mockCheckRateLimit.mockResolvedValueOnce({ success: false, limit: 100, remaining: 0, resetTime: Date.now() + 60000 });
      const request = createMockRequest('/api/profile', {
        method: 'PUT',
        body: { hasChildren: false },
      });
      const response = await putProfile(request);
      expect(response.status).toBe(429);
    });
  });

  describe('assets/[id]', () => {
    it('PUT should return 429 when rate limited', async () => {
      mockCheckRateLimit.mockResolvedValueOnce({ success: false, limit: 100, remaining: 0, resetTime: Date.now() + 60000 });
      const request = createMockRequest('/api/assets/test-id-1', {
        method: 'PUT',
        body: { value: 5000 },
      });
      const response = await putAsset(request, idParams);
      expect(response.status).toBe(429);
    });

    it('DELETE should return 429 when rate limited', async () => {
      mockCheckRateLimit.mockResolvedValueOnce({ success: false, limit: 100, remaining: 0, resetTime: Date.now() + 60000 });
      const request = createMockRequest('/api/assets/test-id-1', { method: 'DELETE' });
      const response = await deleteAsset(request, idParams);
      expect(response.status).toBe(429);
    });
  });

  describe('liabilities/[id]', () => {
    it('PUT should return 429 when rate limited', async () => {
      mockCheckRateLimit.mockResolvedValueOnce({ success: false, limit: 100, remaining: 0, resetTime: Date.now() + 60000 });
      const request = createMockRequest('/api/liabilities/test-id-1', {
        method: 'PUT',
        body: { name: 'Test Loan' },
      });
      const response = await putLiability(request, idParams);
      expect(response.status).toBe(429);
    });

    it('DELETE should return 429 when rate limited', async () => {
      mockCheckRateLimit.mockResolvedValueOnce({ success: false, limit: 100, remaining: 0, resetTime: Date.now() + 60000 });
      const request = createMockRequest('/api/liabilities/test-id-1', { method: 'DELETE' });
      const response = await deleteLiability(request, idParams);
      expect(response.status).toBe(429);
    });
  });
});

// ============================================================================
// Identifier format verification
// ============================================================================

describe('Rate limit identifier format', () => {
  it('should use api:userId as the rate limit identifier', async () => {
    const request = createMockRequest('/api/profile');
    await getProfile();
    expect(mockCheckRateLimit).toHaveBeenCalledWith(
      expect.stringMatching(/^api:test-user/),
      expect.any(Object)
    );
  });

  it('should use RATE_LIMITS.api config', async () => {
    const request = createMockRequest('/api/profile');
    await getProfile();
    expect(mockCheckRateLimit).toHaveBeenCalledWith(
      expect.any(String),
      { maxRequests: 100, windowSeconds: 60 }
    );
  });
});
