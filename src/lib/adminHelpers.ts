import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from './auth';

// Hardcoded admin emails - only these can access admin pages
const ADMIN_EMAILS = ['yairbarak22@gmail.com'];

/**
 * Check if an email is an admin
 * Uses strict lowercase comparison
 */
export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

/**
 * Server-side admin check for API routes
 * Returns userId if admin, or error response if not
 */
export async function requireAdmin(): Promise<{
  userId: string;
  email: string;
  error?: never;
} | {
  userId?: never;
  email?: never;
  error: NextResponse;
}> {
  const session = await getServerSession(authOptions);
  
  // Check if authenticated
  if (!session?.user?.id) {
    return {
      error: NextResponse.json(
        { error: 'Unauthorized - Not authenticated' },
        { status: 401 }
      ),
    };
  }

  // Check if admin
  if (!isAdmin(session.user.email)) {
    return {
      error: NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      ),
    };
  }

  return {
    userId: session.user.id,
    email: session.user.email!,
  };
}

