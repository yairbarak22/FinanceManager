import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';

export async function GET(request: NextRequest) {
  try {
    const { userId, error } = await requireAdmin();
    if (error) return error;

    const rateLimitResult = await checkRateLimit(`admin:${userId}`, RATE_LIMITS.admin);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'יותר מדי בקשות. נסה שוב בעוד דקה.' },
        { status: 429 },
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const sequences = await prisma.emailSequence.findMany({
      where: status ? { status: status as never } : undefined,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { startedAt: 'desc' },
      take: 200,
    });

    return NextResponse.json({ sequences });
  } catch (err) {
    console.error('[Sequences List] Error:', err);
    return NextResponse.json(
      { error: 'שגיאה בטעינת הסדרות' },
      { status: 500 },
    );
  }
}
