import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from './auth';
import { prisma } from './prisma';

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
          role: 'owner',
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
 */
export async function getSharedUserIds(userId: string): Promise<string[]> {
  // Get user's shared account
  const sharedAccountId = await getOrCreateSharedAccount(userId);

  // Get all members of this shared account
  const members = await prisma.sharedAccountMember.findMany({
    where: { sharedAccountId },
    select: { userId: true },
  });

  return members.map((m) => m.userId);
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

