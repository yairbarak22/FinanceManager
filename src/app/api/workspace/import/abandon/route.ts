import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/authHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { z } from 'zod';

const bodySchema = z.object({
  sessionId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const rateLimitResult = await checkRateLimit(userId, RATE_LIMITS.api);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'יותר מדי בקשות. אנא המתן.' }, { status: 429 });
    }

    const body = JSON.parse(await request.text());
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'נתונים לא תקינים' }, { status: 400 });
    }

    const { sessionId } = parsed.data;

    const session = await prisma.workspaceImportSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== userId) {
      return NextResponse.json({ success: true });
    }

    if (session.status === 'OPEN') {
      await prisma.workspaceImportSession.update({
        where: { id: sessionId },
        data: { status: 'ABANDONED' },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Workspace Import Abandon] Error:', err);
    return NextResponse.json({ error: 'שגיאה' }, { status: 500 });
  }
}
