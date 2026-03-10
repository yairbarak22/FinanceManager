import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/authHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { z } from 'zod';

const bodySchema = z.object({
  assignments: z.array(
    z.object({
      transactionId: z.string().min(1),
      categoryId: z.string().min(1),
    })
  ).min(1),
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

    const updates = assignments.map((a) =>
      prisma.transaction.updateMany({
        where: { id: a.transactionId, userId },
        data: { category: a.categoryId },
      })
    );

    await prisma.$transaction(updates);

    return NextResponse.json({ success: true, updated: assignments.length });
  } catch (err) {
    console.error('[Workspace Categorize] Error:', err);
    return NextResponse.json({ error: 'שגיאה בעדכון סיווג' }, { status: 500 });
  }
}
