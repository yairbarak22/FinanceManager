import type { NextRequest } from 'next/server';

/**
 * Vercel sends `Authorization: Bearer <CRON_SECRET>` automatically.
 * We also accept `?secret=<value>` for local testing / manual curl.
 * When CRON_SECRET is not configured, all requests are allowed (dev).
 */
export function isAuthorizedCronRequest(request: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return true;

  const authHeader = request.headers.get('authorization');
  if (authHeader === `Bearer ${expected}`) return true;

  const { searchParams } = new URL(request.url);
  if (searchParams.get('secret') === expected) return true;

  return false;
}
