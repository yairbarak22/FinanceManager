/**
 * Admin Helpers Tests
 *
 * Tests for requireAdmin() — verifies DB revocation check, admin email
 * validation, and correct return shapes for all cases.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

// Mock Prisma (used by requireAuth inside requireAdmin)
vi.mock('../prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    sharedAccountMember: {
      findFirst: vi.fn(),
    },
  },
}));

// Mock cache (used by requireAuth)
vi.mock('../cache', () => ({
  cacheGet: vi.fn().mockResolvedValue(null),
  cacheSet: vi.fn().mockResolvedValue(undefined),
  cacheDelete: vi.fn().mockResolvedValue(undefined),
  CacheKeys: {
    authUser: (id: string) => `auth:user:${id}`,
    sharedMembers: (id: string) => `shared:members:${id}`,
  },
  CacheTTL: {
    AUTH_USER: 3600,
    SHARED_MEMBERS: 300,
  },
}));

// Mock next-auth (used by both requireAuth and requireAdmin)
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('../auth', () => ({
  authOptions: {},
}));

import { prisma } from '../prisma';
import { getServerSession } from 'next-auth';
import { requireAdmin } from '../adminHelpers';

const mockPrisma = vi.mocked(prisma);
const mockGetServerSession = vi.mocked(getServerSession);

beforeEach(() => {
  vi.clearAllMocks();
  process.env.ADMIN_EMAILS = 'admin@example.com';
});

// ============================================================================
// requireAdmin
// ============================================================================

describe('requireAdmin', () => {
  it('should return userId and email for a valid admin', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-1', email: 'admin@example.com', name: 'Admin' },
      expires: new Date().toISOString(),
    });
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' } as never);

    const result = await requireAdmin();

    expect(result.userId).toBe('user-1');
    expect(result.email).toBe('admin@example.com');
    expect(result.error).toBeUndefined();
  });

  it('should return 401 when there is no session', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const result = await requireAdmin();

    expect(result.error).toBeInstanceOf(NextResponse);
    expect(result.userId).toBeUndefined();
    const body = await result.error!.json();
    expect(body.error).toMatch(/unauthorized/i);
  });

  it('should return 401 when user no longer exists in DB (JWT revocation)', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'deleted-admin', email: 'admin@example.com', name: 'Admin' },
      expires: new Date().toISOString(),
    });
    mockPrisma.user.findUnique.mockResolvedValue(null as never);

    const result = await requireAdmin();

    expect(result.error).toBeInstanceOf(NextResponse);
    expect(result.userId).toBeUndefined();
    const body = await result.error!.json();
    expect(body.error).toMatch(/unauthorized/i);
  });

  it('should return 403 when authenticated but email is not in ADMIN_EMAILS', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-2', email: 'notanadmin@example.com', name: 'Regular' },
      expires: new Date().toISOString(),
    });
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-2' } as never);

    const result = await requireAdmin();

    expect(result.error).toBeInstanceOf(NextResponse);
    expect(result.userId).toBeUndefined();
    const body = await result.error!.json();
    expect(body.error).toMatch(/forbidden/i);
  });
});
