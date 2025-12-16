import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from './auth';

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

