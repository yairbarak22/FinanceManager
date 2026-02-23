import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { computeNextSendAt } from '@/app/api/cron/send-sequences/route';
import { sendSequenceStepEmail } from '@/lib/emails/courseSequenceSender';

const INTERVAL_DAYS = 3;

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
    const { userIds, sequenceType, sendHour, subjectOverrides, contentOverrides, sendFirstImmediately } = body as {
      userIds?: string[];
      sequenceType?: string;
      sendHour?: number;
      subjectOverrides?: Record<string, string>;
      contentOverrides?: Record<string, string>;
      sendFirstImmediately?: boolean;
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

    const hasSubjectOverrides = subjectOverrides && Object.keys(subjectOverrides).length > 0;
    const hasContentOverrides = contentOverrides && Object.keys(contentOverrides).length > 0;

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
      },
      select: { userId: true, status: true, id: true },
    });

    const activeUserIds = new Set(
      existing.filter((e) => e.status === 'ACTIVE').map((e) => e.userId),
    );
    const inactiveIds = existing
      .filter((e) => e.status !== 'ACTIVE')
      .map((e) => e.id);

    if (inactiveIds.length > 0) {
      await prisma.emailSequence.deleteMany({
        where: { id: { in: inactiveIds } },
      });
    }

    const newUsers = users.filter((u) => !activeUserIds.has(u.id));

    if (newUsers.length === 0) {
      return NextResponse.json(
        { error: 'לכל המשתמשים שנבחרו כבר קיימת סדרה פעילה מסוג זה' },
        { status: 400 },
      );
    }

    const now = new Date();
    const firstSendAt = sendFirstImmediately
      ? computeNextSendAt(hour, INTERVAL_DAYS)
      : computeNextSendAt(hour, 0);

    const created = await prisma.emailSequence.createMany({
      data: newUsers.map((u) => ({
        userId: u.id,
        sequenceType,
        currentStep: sendFirstImmediately ? 1 : 0,
        status: 'ACTIVE' as const,
        sendHour: hour,
        nextSendAt: firstSendAt,
        lastSentAt: sendFirstImmediately ? now : null,
        ...(hasSubjectOverrides ? { subjectOverrides } : {}),
        ...(hasContentOverrides ? { contentOverrides } : {}),
      })),
      skipDuplicates: true,
    });

    let immediatelySent = 0;
    let immediatelyFailed = 0;

    if (sendFirstImmediately && created.count > 0) {
      for (const u of newUsers) {
        if (activeUserIds.has(u.id)) continue;
        const result = await sendSequenceStepEmail({
          to: u.email,
          userId: u.id,
          step: 0,
          userName: u.name || 'משתמש',
          subjectOverride: hasSubjectOverrides ? subjectOverrides['0'] : undefined,
          contentOverride: hasContentOverrides ? contentOverrides['0'] : undefined,
        });
        if ('error' in result) {
          immediatelyFailed++;
          console.error(`[Sequence] Immediate send failed for ${u.email}: ${result.error}`);
        } else {
          immediatelySent++;
        }
      }
    }

    console.log(
      `[Sequence] Admin ${userId} started ${created.count} sequences (type: ${sequenceType}, sendHour: ${hour}, immediate: ${sendFirstImmediately ?? false})`,
    );

    return NextResponse.json({
      created: created.count,
      skippedExisting: activeUserIds.size,
      total: users.length,
      ...(sendFirstImmediately ? { immediatelySent, immediatelyFailed } : {}),
    });
  } catch (err) {
    console.error('[Sequence Start] Error:', err);
    return NextResponse.json(
      { error: 'שגיאה ביצירת הסדרה' },
      { status: 500 },
    );
  }
}
