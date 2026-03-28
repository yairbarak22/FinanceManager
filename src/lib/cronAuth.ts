import type { NextRequest } from 'next/server';

/**
 * Vercel sends `Authorization: Bearer <CRON_SECRET>` automatically.
 * Query param `?secret=<value>` allowed only in non-production (local testing / manual curl).
 * When CRON_SECRET is not configured, fail closed in production.
 */
export function isAuthorizedCronRequest(request: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return process.env.NODE_ENV !== 'production';
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader === `Bearer ${expected}`) return true;

  // Query param fallback only in non-production (avoids secret in server/proxy logs)
  if (process.env.NODE_ENV !== 'production') {
    const { searchParams } = new URL(request.url);
    if (searchParams.get('secret') === expected) return true;
  }

  return false;
}
