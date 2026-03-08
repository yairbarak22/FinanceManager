import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { getUsdIlsRate } from '@/lib/finance/marketService';

export async function GET() {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const rateLimitResult = await checkRateLimit(`api:${userId}`, RATE_LIMITS.api);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'יותר מדי בקשות' }, { status: 429 });
    }

    const rate = await getUsdIlsRate();

    return NextResponse.json({ rate });
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    return NextResponse.json({ rate: 3.65 });
  }
}
