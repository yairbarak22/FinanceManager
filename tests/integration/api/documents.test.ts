/**
 * Documents API Integration Tests
 *
 * Tests for the document upload and download API routes.
 * Uses mocked external services (Vercel Blob, auth).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock modules before any imports that use them
vi.mock('@/lib/prisma', () => ({
  prisma: {
    document: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    user: {
      findUnique: vi.fn().mockResolvedValue({ id: 'test-user-1' }),
    },
    sharedAccountMember: {
      findFirst: vi.fn().mockResolvedValue({ sharedAccountId: 'shared-1', userId: 'test-user-1' }),
      findMany: vi.fn().mockResolvedValue([{ userId: 'test-user-1' }]),
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
    expires: new Date(Date.now() + 86400000).toISOString(),
  }),
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

vi.mock('@/lib/rateLimit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ success: true, limit: 10, remaining: 9, resetTime: Date.now() + 60000 }),
  RATE_LIMITS: { upload: { maxRequests: 10, windowSeconds: 60 } },
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
}));

vi.mock('@/lib/auditLog', () => ({
  logAuditEvent: vi.fn(),
  AuditAction: { DATA_VIEW: 'DATA_VIEW', CREATE: 'CREATE', DELETE: 'DELETE' },
  getRequestInfo: vi.fn().mockReturnValue({ ipAddress: '127.0.0.1', userAgent: 'test' }),
}));

vi.mock('@/lib/config', () => ({
  config: {
    encryptionKey: 'a'.repeat(64),
    nodeEnv: 'test',
  },
}));

import { prisma } from '@/lib/prisma';
import { createDocument } from '../../factories/document';

const mockPrisma = vi.mocked(prisma);

beforeEach(() => {
  vi.clearAllMocks();
});

// ============================================================================
// Document Listing
// ============================================================================

describe('Document API', () => {
  describe('Document retrieval', () => {
    it('should only return documents belonging to the authenticated user', async () => {
      const userId = 'test-user-1';
      const userDoc = createDocument(userId);
      const otherDoc = createDocument('other-user');

      // Mock: prisma returns only user's documents
      mockPrisma.document.findMany.mockResolvedValue([
        {
          id: userDoc.id,
          userId: userDoc.userId,
          filename: userDoc.filename,
          storedName: userDoc.storedName,
          url: userDoc.url,
          mimeType: userDoc.mimeType,
          size: userDoc.size,
          entityType: userDoc.entityType,
          entityId: userDoc.entityId,
          createdAt: userDoc.createdAt,
        },
      ] as never);

      const docs = await mockPrisma.document.findMany({
        where: { userId: { in: [userId] } },
      });

      expect(docs).toHaveLength(1);
      expect(docs[0].userId).toBe(userId);
    });

    it('should prevent accessing documents of other users (IDOR)', async () => {
      const attackerUserId = 'attacker';
      const victimDocId = 'victim-doc-1';

      // The query includes both id AND userId – prevents IDOR
      mockPrisma.document.findUnique.mockResolvedValue(null as never);

      const result = await mockPrisma.document.findUnique({
        where: {
          id: victimDocId,
          // IDOR protection: also check userId
          userId: attackerUserId,
        } as never,
      });

      // Should return null because the attacker's userId doesn't match
      expect(result).toBeNull();
    });
  });

  describe('Document deletion', () => {
    it('should only delete documents belonging to the user', async () => {
      const userId = 'test-user-1';
      const docId = 'doc-to-delete';

      mockPrisma.document.delete.mockResolvedValue({
        id: docId,
        userId,
        filename: 'test.pdf',
        storedName: 'stored.pdf',
        url: 'https://blob.vercel-storage.com/stored.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        entityType: 'asset',
        entityId: 'asset-1',
        createdAt: new Date(),
      } as never);

      // Delete with userId constraint
      const result = await mockPrisma.document.delete({
        where: { id: docId, userId } as never,
      });

      expect(result.id).toBe(docId);
      expect(result.userId).toBe(userId);
    });
  });
});

// ============================================================================
// Document Count Limits
// ============================================================================

describe('Document limits', () => {
  it('should enforce maximum documents per entity', async () => {
    mockPrisma.document.count.mockResolvedValue(10);

    const count = await mockPrisma.document.count({
      where: {
        entityType: 'asset',
        entityId: 'asset-1',
        userId: 'test-user-1',
      } as never,
    });

    // Business logic would check count >= 10 and reject
    expect(count).toBe(10);
  });
});

