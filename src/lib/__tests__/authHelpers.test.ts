/**
 * Auth Helpers Tests
 *
 * Tests for authentication, authorization, IDOR prevention,
 * shared account permissions, and admin access control.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

// Mock Prisma
vi.mock('../prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    sharedAccountMember: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    sharedAccount: {
      create: vi.fn(),
    },
  },
}));

// Mock cache
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

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('../auth', () => ({
  authOptions: {},
}));

import { prisma } from '../prisma';
import { getServerSession } from 'next-auth';
import {
  requireAuth,
  withUserId,
  withIdAndUserId,
  checkPermission,
} from '../authHelpers';
import { MemberRole } from '@prisma/client';

const mockPrisma = vi.mocked(prisma);
const mockGetServerSession = vi.mocked(getServerSession);

beforeEach(() => {
  vi.clearAllMocks();
});

// ============================================================================
// requireAuth
// ============================================================================

describe('requireAuth', () => {
  it('should return userId when authenticated and user exists', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-1', email: 'test@example.com', name: 'Test' },
      expires: new Date().toISOString(),
    });
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
    } as never);

    const result = await requireAuth();
    expect(result.userId).toBe('user-1');
    expect(result.error).toBeNull();
  });

  it('should return 401 when no session', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const result = await requireAuth();
    expect(result.userId).toBeNull();
    expect(result.error).toBeInstanceOf(NextResponse);
  });

  it('should return 401 when session has no user id', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { email: 'test@example.com' },
      expires: new Date().toISOString(),
    });

    const result = await requireAuth();
    expect(result.userId).toBeNull();
  });

  it('should return 401 when user no longer exists (JWT revocation)', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'deleted-user', email: 'test@example.com', name: 'Test' },
      expires: new Date().toISOString(),
    });
    mockPrisma.user.findUnique.mockResolvedValue(null as never);

    const result = await requireAuth();
    expect(result.userId).toBeNull();
    expect(result.error).toBeInstanceOf(NextResponse);
  });
});

// ============================================================================
// IDOR Prevention
// ============================================================================

describe('IDOR Prevention helpers', () => {
  describe('withUserId', () => {
    it('should add userId to where clause', () => {
      const result = withUserId('user-1', { category: 'food' });
      expect(result).toEqual({ category: 'food', userId: 'user-1' });
    });

    it('should work with empty where', () => {
      const result = withUserId('user-1');
      expect(result).toEqual({ userId: 'user-1' });
    });

    it('should override existing userId', () => {
      // This is intentional – IDOR prevention overrides any user-supplied userId
      const result = withUserId('user-1', { userId: 'malicious-user' } as Record<string, unknown>);
      expect(result.userId).toBe('user-1');
    });
  });

  describe('withIdAndUserId', () => {
    it('should create where clause with both id and userId', () => {
      const result = withIdAndUserId('record-1', 'user-1');
      expect(result).toEqual({ id: 'record-1', userId: 'user-1' });
    });
  });
});

// ============================================================================
// Permission Checking
// ============================================================================

describe('checkPermission', () => {
  it('should allow OWNER all permissions', async () => {
    mockPrisma.sharedAccountMember.findFirst.mockResolvedValue({
      role: MemberRole.OWNER,
      canEdit: false,
      canDelete: false,
      canInvite: false,
    } as never);

    const result = await checkPermission('user-1', 'canEdit');
    expect(result.allowed).toBe(true);
  });

  it('should check specific permission for MEMBER', async () => {
    mockPrisma.sharedAccountMember.findFirst.mockResolvedValue({
      role: MemberRole.MEMBER,
      canEdit: true,
      canDelete: false,
      canInvite: false,
    } as never);

    const editResult = await checkPermission('user-1', 'canEdit');
    expect(editResult.allowed).toBe(true);

    const deleteResult = await checkPermission('user-1', 'canDelete');
    expect(deleteResult.allowed).toBe(false);
    expect(deleteResult.error).toBeInstanceOf(NextResponse);
  });

  it('should deny VIEWER edit permission', async () => {
    mockPrisma.sharedAccountMember.findFirst.mockResolvedValue({
      role: MemberRole.VIEWER,
      canEdit: false,
      canDelete: false,
      canInvite: false,
    } as never);

    const result = await checkPermission('user-1', 'canEdit');
    expect(result.allowed).toBe(false);
  });

  it('should allow when no membership found (new user)', async () => {
    mockPrisma.sharedAccountMember.findFirst.mockResolvedValue(null as never);

    const result = await checkPermission('user-1', 'canEdit');
    expect(result.allowed).toBe(true);
  });
});

