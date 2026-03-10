import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/authHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { z } from 'zod';

const bodySchema = z.object({
  transactionIds: z.array(z.string().min(1)).min(1).max(200),
});

export async function DELETE(request: NextRequest) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const rateLimitResult = await checkRateLimit(userId, RATE_LIMITS.api);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'יותר מדי בקשות. אנא המתן.' }, { status: 429 });
    }

    const body = await request.json();
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'נתונים לא תקינים' }, { status: 400 });
    }

    const { transactionIds } = parsed.data;

    const result = await prisma.transaction.deleteMany({
      where: {
        id: { in: transactionIds },
        userId,
      },
    });

    return NextResponse.json({ success: true, deleted: result.count });
  } catch (err) {
    console.error('[Workspace Delete] Error:', err);
    return NextResponse.json({ error: 'שגיאה במחיקת עסקאות' }, { status: 500 });
  }
}
