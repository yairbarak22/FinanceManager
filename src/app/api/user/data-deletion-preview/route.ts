import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { getDeletionPreview, DOMAIN_META, DATA_DOMAINS, DOMAIN_DEPENDENCIES } from '@/lib/userDataDeletion';

export async function GET() {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const rateLimitResult = await checkRateLimit(`deletion-preview:${userId}`, RATE_LIMITS.api);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'יותר מדי בקשות' }, { status: 429 });
    }

    const counts = await getDeletionPreview(userId);

    return NextResponse.json({
      counts,
      domains: DATA_DOMAINS,
      meta: DOMAIN_META,
      dependencies: DOMAIN_DEPENDENCIES,
    });
  } catch (error) {
    console.error('Error fetching deletion preview:', error);
    return NextResponse.json(
      { error: 'שגיאה בטעינת הנתונים' },
      { status: 500 }
    );
  }
}
