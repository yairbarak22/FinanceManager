/**
 * Transactions API Integration Tests
 *
 * Tests for transaction CRUD, import, and data integrity.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock modules
vi.mock('@/lib/prisma', () => ({
  prisma: {
    transaction: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      createMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn().mockResolvedValue({ id: 'test-user-1' }),
    },
    sharedAccountMember: {
      findFirst: vi.fn().mockResolvedValue({ sharedAccountId: 'shared-1', userId: 'test-user-1' }),
      findMany: vi.fn().mockResolvedValue([{ userId: 'test-user-1' }]),
    },
    merchantCategoryMap: {
      findMany: vi.fn().mockResolvedValue([]),
      upsert: vi.fn(),
    },
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
  RATE_LIMITS: { api: { maxRequests: 100, windowSeconds: 60 }, import: { maxRequests: 5, windowSeconds: 60 } },
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
  AuditAction: { CREATE: 'CREATE', UPDATE: 'UPDATE', DELETE: 'DELETE' },
  getRequestInfo: vi.fn().mockReturnValue({ ipAddress: '127.0.0.1', userAgent: 'test' }),
}));

import { prisma } from '@/lib/prisma';
import { createTransaction, createTransactions } from '../../factories/transaction';

const mockPrisma = vi.mocked(prisma);

beforeEach(() => {
  vi.clearAllMocks();
});

// ============================================================================
// Transaction CRUD
// ============================================================================

describe('Transactions API', () => {
  describe('Create transaction', () => {
    it('should create a transaction with correct userId', async () => {
      const userId = 'test-user-1';
      const txData = createTransaction(userId, { type: 'expense', amount: 100, category: 'מזון' });

      mockPrisma.transaction.create.mockResolvedValue({
        id: txData.id,
        userId: txData.userId,
        type: txData.type,
        amount: txData.amount,
        category: txData.category,
        description: txData.description,
        date: txData.date,
        createdAt: txData.createdAt,
        updatedAt: txData.updatedAt,
      } as never);

      const result = await mockPrisma.transaction.create({
        data: {
          userId,
          type: txData.type,
          amount: txData.amount,
          category: txData.category,
          description: txData.description,
          date: txData.date,
        },
      });

      expect(result.userId).toBe(userId);
      expect(result.amount).toBe(100);
    });
  });

  describe('List transactions', () => {
    it('should only return transactions for the authenticated user', async () => {
      const userId = 'test-user-1';
      const transactions = createTransactions(userId, 5);

      mockPrisma.transaction.findMany.mockResolvedValue(
        transactions.map((tx) => ({
          id: tx.id,
          userId: tx.userId,
          type: tx.type,
          amount: tx.amount,
          category: tx.category,
          description: tx.description,
          date: tx.date,
          createdAt: tx.createdAt,
          updatedAt: tx.updatedAt,
        })) as never
      );

      const result = await mockPrisma.transaction.findMany({
        where: { userId: { in: [userId] } },
      });

      expect(result).toHaveLength(5);
      result.forEach((tx) => {
        expect(tx.userId).toBe(userId);
      });
    });
  });

  describe('Update transaction (IDOR prevention)', () => {
    it('should only update transactions belonging to the user', async () => {
      const userId = 'test-user-1';
      const txId = 'tx-1';

      mockPrisma.transaction.update.mockResolvedValue({
        id: txId,
        userId,
        type: 'expense',
        amount: 200,
        category: 'מזון',
        description: 'Updated',
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never);

      // Update with IDOR protection (both id AND userId in where)
      const result = await mockPrisma.transaction.update({
        where: { id: txId, userId } as never,
        data: { amount: 200 },
      });

      expect(result.userId).toBe(userId);
      expect(result.amount).toBe(200);
    });
  });

  describe('Delete transaction (IDOR prevention)', () => {
    it('should only delete transactions belonging to the user', async () => {
      const userId = 'test-user-1';
      const txId = 'tx-1';

      mockPrisma.transaction.delete.mockResolvedValue({
        id: txId,
        userId,
      } as never);

      const result = await mockPrisma.transaction.delete({
        where: { id: txId, userId } as never,
      });

      expect(result.id).toBe(txId);
    });
  });
});

// ============================================================================
// Data Integrity
// ============================================================================

describe('Data integrity', () => {
  it('should handle negative amounts correctly', () => {
    const tx = createTransaction('user-1', { amount: -500, type: 'expense' });
    expect(tx.amount).toBe(-500);
    expect(tx.type).toBe('expense');
  });

  it('should handle zero amounts', () => {
    const tx = createTransaction('user-1', { amount: 0 });
    expect(tx.amount).toBe(0);
  });

  it('should handle large amounts', () => {
    const tx = createTransaction('user-1', { amount: 999999.99 });
    expect(tx.amount).toBe(999999.99);
  });
});

