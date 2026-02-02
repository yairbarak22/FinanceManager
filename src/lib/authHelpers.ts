import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { MemberRole } from '@prisma/client';
import { authOptions } from './auth';
import { prisma } from './prisma';
import { cacheGet, cacheSet, cacheDelete, CacheKeys, CacheTTL } from './cache';

/**
 * Get the current authenticated user's session
 * Returns null if not authenticated
 */
export async function getAuthSession() {
  return await getServerSession(authOptions);
}

/**
 * Require authentication for an API route
 * Returns the user ID if authenticated, or an error response
 * Also verifies that the user still exists in the database (JWT revocation protection)
 */
export async function requireAuth(): Promise<
  { userId: string; error: null } | { userId: null; error: NextResponse }
> {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    return {
      userId: null,
      error: NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      ),
    };
  }

  // JWT Revocation Check: Verify user still exists and is active
  // Use cache to reduce DB queries (user deletion is rare)
  const cacheKey = CacheKeys.authUser(session.user.id);
  const cachedUser = await cacheGet<{ id: string }>(cacheKey);

  if (cachedUser) {
    // User exists in cache, skip DB query
    return { userId: session.user.id, error: null };
  }

  // Not in cache - check DB
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true },
  });

  if (!user) {
    return {
      userId: null,
      error: NextResponse.json(
        { error: 'Unauthorized - User no longer exists' },
        { status: 401 }
      ),
    };
  }

  // Cache the user existence for 1 hour
  void cacheSet(cacheKey, { id: user.id }, CacheTTL.AUTH_USER);

  return { userId: session.user.id, error: null };
}

/**
 * Get or create a shared account for a user
 * Each new user gets their own SharedAccount where they are the owner
 */
export async function getOrCreateSharedAccount(userId: string): Promise<string> {
  // Check if user already has a shared account membership
  const existingMembership = await prisma.sharedAccountMember.findFirst({
    where: { userId },
    select: { sharedAccountId: true },
  });

  if (existingMembership) {
    return existingMembership.sharedAccountId;
  }

  // Create new shared account and membership
  const sharedAccount = await prisma.sharedAccount.create({
    data: {
      name: 'החשבון שלי',
      members: {
        create: {
          userId,
          role: MemberRole.OWNER,
        },
      },
    },
  });

  return sharedAccount.id;
}

/**
 * Get the shared account ID for a user
 * Returns null if user doesn't have a shared account
 */
export async function getUserSharedAccountId(userId: string): Promise<string | null> {
  const membership = await prisma.sharedAccountMember.findFirst({
    where: { userId },
    select: { sharedAccountId: true },
  });

  return membership?.sharedAccountId || null;
}

/**
 * Get all user IDs that share the same account
 * This is used to query data for shared accounts
 * Results are cached for 5 minutes to reduce DB queries
 */
export async function getSharedUserIds(userId: string): Promise<string[]> {
  // Check cache first
  const cacheKey = CacheKeys.sharedMembers(userId);
  const cachedMembers = await cacheGet<string[]>(cacheKey);

  if (cachedMembers) {
    return cachedMembers;
  }

  // Get user's shared account
  const sharedAccountId = await getOrCreateSharedAccount(userId);

  // Get all members of this shared account
  const members = await prisma.sharedAccountMember.findMany({
    where: { sharedAccountId },
    select: { userId: true },
  });

  const userIds = members.map((m) => m.userId);

  // Cache for 5 minutes
  void cacheSet(cacheKey, userIds, CacheTTL.SHARED_MEMBERS);

  return userIds;
}

/**
 * Invalidate shared members cache for a user
 * Call this when members are added/removed from shared account
 */
export async function invalidateSharedMembersCache(userId: string): Promise<void> {
  await cacheDelete(CacheKeys.sharedMembers(userId));
}

/**
 * Build a where clause for shared account queries
 * Uses userId IN (all shared account members)
 */
export async function withSharedAccount<T extends Record<string, unknown>>(
  userId: string,
  where: T = {} as T
): Promise<T & { userId: { in: string[] } }> {
  const userIds = await getSharedUserIds(userId);
  return { ...where, userId: { in: userIds } };
}

/**
 * Build a where clause that includes the userId to prevent IDOR attacks
 * For use with findMany, updateMany, deleteMany
 */
export function withUserId<T extends Record<string, unknown>>(
  userId: string,
  where: T = {} as T
): T & { userId: string } {
  return { ...where, userId };
}

/**
 * Build a where clause for single record operations that includes both id and userId
 * This prevents IDOR attacks by ensuring users can only access their own records
 */
export function withIdAndUserId(
  id: string,
  userId: string
): { id: string; userId: string } {
  return { id, userId };
}

/**
 * Build a where clause for single record operations in shared accounts
 * Allows access to records owned by ANY member of the user's shared account
 * Use this for PUT/DELETE operations on shared data
 */
export async function withSharedAccountId(
  id: string,
  userId: string
): Promise<{ id: string; userId: { in: string[] } }> {
  const userIds = await getSharedUserIds(userId);
  return { id, userId: { in: userIds } };
}

/**
 * Check if the user has permission to perform an action in their shared account
 * Returns allowed: true for personal accounts (no shared account membership)
 * For shared accounts, checks the specific permission flag (canEdit, canDelete, canInvite)
 */
export async function checkPermission(
  userId: string,
  permission: 'canEdit' | 'canDelete' | 'canInvite'
): Promise<{ allowed: boolean; error?: NextResponse }> {
  const member = await prisma.sharedAccountMember.findFirst({
    where: { userId },
    select: {
      role: true,
      canEdit: true,
      canDelete: true,
      canInvite: true
    },
  });

  // No membership found - this shouldn't happen but allow (will be created on first access)
  if (!member) {
    return { allowed: true };
  }

  // Owner always has full permissions
  if (member.role === MemberRole.OWNER) {
    return { allowed: true };
  }

  // Check the specific permission
  if (!member[permission]) {
    return {
      allowed: false,
      error: NextResponse.json(
        { error: 'אין לך הרשאה לבצע פעולה זו' },
        { status: 403 }
      ),
    };
  }

  return { allowed: true };
}

