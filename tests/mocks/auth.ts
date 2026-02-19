/**
 * Authentication Mocks
 *
 * Mocks for requireAuth(), getAuthSession(), and NextAuth session
 * with support for different user roles.
 */

import { vi } from 'vitest';

// ---------------------------------------------------------------------------
// Test Users
// ---------------------------------------------------------------------------

export interface TestUser {
  id: string;
  email: string;
  name: string;
  role: 'regular' | 'admin' | 'viewer';
  image?: string;
}

export const TEST_USERS = {
  regular: {
    id: 'test-user-regular-001',
    email: 'test@example.com',
    name: 'Test User',
    role: 'regular' as const,
    image: 'https://example.com/avatar.jpg',
  },
  admin: {
    id: 'test-user-admin-001',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin' as const,
    image: null,
  },
  viewer: {
    id: 'test-user-viewer-001',
    email: 'viewer@example.com',
    name: 'Viewer User',
    role: 'viewer' as const,
    image: null,
  },
  second: {
    id: 'test-user-second-002',
    email: 'second@example.com',
    name: 'Second User',
    role: 'regular' as const,
    image: null,
  },
} as const;

// ---------------------------------------------------------------------------
// Mock State
// ---------------------------------------------------------------------------

let currentUser: TestUser | null = TEST_USERS.regular;

/**
 * Set the currently authenticated user for tests.
 */
export function setCurrentUser(user: TestUser | null): void {
  currentUser = user;
}

/**
 * Get the current test user.
 */
export function getCurrentUser(): TestUser | null {
  return currentUser;
}

// ---------------------------------------------------------------------------
// Mock Functions
// ---------------------------------------------------------------------------

/**
 * Mock requireAuth that returns the current test user.
 */
export const mockRequireAuth = vi.fn(async () => {
  if (!currentUser) {
    return {
      userId: null,
      error: new Response(
        JSON.stringify({ error: 'Unauthorized - Please sign in' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      ),
    };
  }
  return { userId: currentUser.id, error: null };
});

/**
 * Mock getAuthSession that returns a NextAuth-like session.
 */
export const mockGetAuthSession = vi.fn(async () => {
  if (!currentUser) return null;
  return {
    user: {
      id: currentUser.id,
      email: currentUser.email,
      name: currentUser.name,
      image: currentUser.image || null,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
});

/**
 * Mock getServerSession for NextAuth.
 */
export const mockGetServerSession = vi.fn(async () => {
  return mockGetAuthSession();
});

// ---------------------------------------------------------------------------
// Setup helpers
// ---------------------------------------------------------------------------

/**
 * Setup auth mocks for a test suite.
 * Call this in beforeEach or at the top of your test file.
 */
export function setupAuthMocks(): void {
  vi.mock('@/lib/authHelpers', () => ({
    requireAuth: mockRequireAuth,
    getAuthSession: mockGetAuthSession,
    getOrCreateSharedAccount: vi.fn(async (userId: string) => `shared-account-${userId}`),
    getSharedUserIds: vi.fn(async (userId: string) => [userId]),
    withSharedAccount: vi.fn(async (userId: string, where: Record<string, unknown> = {}) => ({
      ...where,
      userId: { in: [userId] },
    })),
    withUserId: vi.fn((userId: string, where: Record<string, unknown> = {}) => ({
      ...where,
      userId,
    })),
    withIdAndUserId: vi.fn((id: string, userId: string) => ({ id, userId })),
    withSharedAccountId: vi.fn(async (id: string, userId: string) => ({
      id,
      userId: { in: [userId] },
    })),
    checkPermission: vi.fn(async () => ({ allowed: true })),
    getUserSharedAccountId: vi.fn(async (userId: string) => `shared-account-${userId}`),
    invalidateSharedMembersCache: vi.fn(async () => {}),
  }));
}

/**
 * Reset auth mocks state.
 */
export function resetAuthMocks(): void {
  currentUser = TEST_USERS.regular;
  mockRequireAuth.mockClear();
  mockGetAuthSession.mockClear();
  mockGetServerSession.mockClear();
}

