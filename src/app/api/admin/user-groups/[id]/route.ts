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

    const group = await prisma.userGroup.findUnique({
      where: { id },
      include: {
        _count: { select: { members: true } },
        creator: { select: { id: true, name: true, email: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { addedAt: 'desc' },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: 'קבוצה לא נמצאה' }, { status: 404 });
    }

    return NextResponse.json({ group });
  } catch (err) {
    console.error('[UserGroup GET] Error:', err);
    return NextResponse.json({ error: 'שגיאה בטעינת הקבוצה' }, { status: 500 });
  }
}

export async function PUT(
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

    const existing = await prisma.userGroup.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'קבוצה לא נמצאה' }, { status: 404 });
    }

    const body = await request.json();
    const { name, description } = body as { name?: string; description?: string };

    const group = await prisma.userGroup.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(description !== undefined ? { description: description?.trim() || null } : {}),
      },
      include: {
        _count: { select: { members: true } },
      },
    });

    return NextResponse.json({ group });
  } catch (err) {
    console.error('[UserGroup PUT] Error:', err);
    return NextResponse.json({ error: 'שגיאה בעדכון הקבוצה' }, { status: 500 });
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

    const existing = await prisma.userGroup.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'קבוצה לא נמצאה' }, { status: 404 });
    }

    await prisma.userGroup.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[UserGroup DELETE] Error:', err);
    return NextResponse.json({ error: 'שגיאה במחיקת הקבוצה' }, { status: 500 });
  }
}
