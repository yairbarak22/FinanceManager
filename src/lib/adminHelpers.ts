import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from './auth';

/**
 * Get admin emails from environment (safe for client-side)
 * Returns empty array if not available (e.g., client-side)
 */
function getAdminEmails(): string[] {
  // In client-side context, process.env might not have ADMIN_EMAILS
  // Return empty array to fail safely (user won't be admin)
  if (typeof window !== 'undefined') {
    // Client-side: return empty array (server will validate anyway)
    return [];
  }

  // Server-side: parse from environment
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Check if an email is an admin
 * Uses strict lowercase comparison
 * Admin emails are configured via ADMIN_EMAILS environment variable
 */
export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const adminEmails = getAdminEmails();
  return adminEmails.includes(email.toLowerCase());
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

