import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { computeNextSendAt } from '@/app/api/cron/send-sequences/route';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { userIds, sequenceType, sendHour } = body as {
      userIds?: string[];
      sequenceType?: string;
      sendHour?: number;
    };

    if (!sequenceType) {
      return NextResponse.json({ error: 'חסר סוג סדרה' }, { status: 400 });
    }

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'חסרים משתמשים' }, { status: 400 });
    }

    if (userIds.length > 200) {
      return NextResponse.json(
        { error: 'ניתן להפעיל סדרה עבור עד 200 משתמשים בבת אחת' },
        { status: 400 },
      );
    }

    const hour = typeof sendHour === 'number' && sendHour >= 0 && sendHour <= 23
      ? sendHour
      : 10;

    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds },
        isMarketingSubscribed: true,
      },
      select: { id: true, email: true, name: true },
    });

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'לא נמצאו משתמשים מתאימים (ייתכן שביטלו מנוי)' },
        { status: 400 },
      );
    }

    const existing = await prisma.emailSequence.findMany({
      where: {
        userId: { in: users.map((u) => u.id) },
        sequenceType,
        status: 'ACTIVE',
      },
      select: { userId: true },
    });
    const existingUserIds = new Set(existing.map((e) => e.userId));

    const newUsers = users.filter((u) => !existingUserIds.has(u.id));

    if (newUsers.length === 0) {
      return NextResponse.json(
        { error: 'לכל המשתמשים שנבחרו כבר קיימת סדרה פעילה מסוג זה' },
        { status: 400 },
      );
    }

    const firstSendAt = computeNextSendAt(hour, 0);

    const created = await prisma.emailSequence.createMany({
      data: newUsers.map((u) => ({
        userId: u.id,
        sequenceType,
        currentStep: 0,
        status: 'ACTIVE' as const,
        sendHour: hour,
        nextSendAt: firstSendAt,
      })),
      skipDuplicates: true,
    });

    console.log(
      `[Sequence] Admin ${userId} started ${created.count} sequences (type: ${sequenceType}, sendHour: ${hour})`,
    );

    return NextResponse.json({
      created: created.count,
      skippedExisting: existingUserIds.size,
      total: users.length,
    });
  } catch (err) {
    console.error('[Sequence Start] Error:', err);
    return NextResponse.json(
      { error: 'שגיאה ביצירת הסדרה' },
      { status: 500 },
    );
  }
}
