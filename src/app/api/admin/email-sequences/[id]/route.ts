import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { userId, error } = await requireAdmin();
    if (error) return error;

    const rateLimitResult = await checkRateLimit(`admin:${userId}`, RATE_LIMITS.admin);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'יותר מדי בקשות.' }, { status: 429 });
    }

    const sequence = await prisma.emailSequence.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!sequence) {
      return NextResponse.json({ error: 'סדרה לא נמצאה' }, { status: 404 });
    }

    return NextResponse.json({ sequence });
  } catch (err) {
    console.error('[Sequence GET] Error:', err);
    return NextResponse.json({ error: 'שגיאה בטעינת הסדרה' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { userId, error } = await requireAdmin();
    if (error) return error;

    const rateLimitResult = await checkRateLimit(`admin:${userId}`, RATE_LIMITS.admin);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'יותר מדי בקשות.' }, { status: 429 });
    }

    const body = await request.json();
    const { action } = body as { action?: string };

    const sequence = await prisma.emailSequence.findUnique({ where: { id } });
    if (!sequence) {
      return NextResponse.json({ error: 'סדרה לא נמצאה' }, { status: 404 });
    }

    switch (action) {
      case 'pause': {
        if (sequence.status !== 'ACTIVE') {
          return NextResponse.json(
            { error: 'ניתן להשהות רק סדרה פעילה' },
            { status: 400 },
          );
        }
        const updated = await prisma.emailSequence.update({
          where: { id },
          data: { status: 'PAUSED' },
        });
        return NextResponse.json({ sequence: updated });
      }

      case 'resume': {
        if (sequence.status !== 'PAUSED') {
          return NextResponse.json(
            { error: 'ניתן לחדש רק סדרה מושהית' },
            { status: 400 },
          );
        }
        const updated = await prisma.emailSequence.update({
          where: { id },
          data: {
            status: 'ACTIVE',
            nextSendAt: new Date(),
          },
        });
        return NextResponse.json({ sequence: updated });
      }

      case 'cancel': {
        if (sequence.status === 'COMPLETED' || sequence.status === 'CANCELLED') {
          return NextResponse.json(
            { error: 'הסדרה כבר הסתיימה או בוטלה' },
            { status: 400 },
          );
        }
        const updated = await prisma.emailSequence.update({
          where: { id },
          data: { status: 'CANCELLED', nextSendAt: null },
        });
        return NextResponse.json({ sequence: updated });
      }

      default:
        return NextResponse.json(
          { error: 'פעולה לא חוקית. השתמש ב-pause, resume, או cancel.' },
          { status: 400 },
        );
    }
  } catch (err) {
    console.error('[Sequence PATCH] Error:', err);
    return NextResponse.json({ error: 'שגיאה בעדכון הסדרה' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { userId, error } = await requireAdmin();
    if (error) return error;

    const rateLimitResult = await checkRateLimit(`admin:${userId}`, RATE_LIMITS.admin);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'יותר מדי בקשות.' }, { status: 429 });
    }

    const sequence = await prisma.emailSequence.findUnique({ where: { id } });
    if (!sequence) {
      return NextResponse.json({ error: 'סדרה לא נמצאה' }, { status: 404 });
    }

    await prisma.emailSequence.update({
      where: { id },
      data: { status: 'CANCELLED', nextSendAt: null },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Sequence DELETE] Error:', err);
    return NextResponse.json({ error: 'שגיאה בביטול הסדרה' }, { status: 500 });
  }
}
