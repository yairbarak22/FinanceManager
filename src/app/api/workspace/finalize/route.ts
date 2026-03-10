import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/authHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { z } from 'zod';

const bodySchema = z.object({
  monthKey: z.string().regex(/^\d{4}-\d{2}$/),
  assignments: z.array(
    z.object({
      transactionId: z.string().min(1),
      categoryId: z.string().min(1),
    })
  ),
});

export async function POST(request: NextRequest) {
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

    const { assignments } = parsed.data;

    if (assignments.length > 0) {
      const updates = assignments.map((a) =>
        prisma.transaction.updateMany({
          where: { id: a.transactionId, userId },
          data: { category: a.categoryId },
        })
      );
      await prisma.$transaction(updates);
    }

    return NextResponse.json({ success: true, finalized: assignments.length });
  } catch (err) {
    console.error('[Workspace Finalize] Error:', err);
    return NextResponse.json({ error: 'שגיאה בסגירת חודש' }, { status: 500 });
  }
}
