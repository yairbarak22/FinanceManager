import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendSequenceStepEmail } from '@/lib/emails/courseSequenceSender';

const TOTAL_STEPS = 5;
const INTERVAL_DAYS = 3;
const ISRAEL_TZ = 'Asia/Jerusalem';

function getIsraelDayOfWeek(date: Date): number {
  const dayName = new Intl.DateTimeFormat('en-US', {
    timeZone: ISRAEL_TZ,
    weekday: 'long',
  }).format(date);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days.indexOf(dayName);
}

/**
 * Compute the next valid send time in UTC, given a desired Israel-time hour
 * and a number of days to add from now. Skips Friday and Saturday (Israel).
 */
export function computeNextSendAt(sendHour: number, intervalDays: number): Date {
  const now = new Date();
  const futureMs = now.getTime() + intervalDays * 24 * 60 * 60 * 1000;
  const futureDate = new Date(futureMs);

  const dateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: ISRAEL_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(futureDate);

  const candidateAsUTC = new Date(`${dateStr}T${String(sendHour).padStart(2, '0')}:00:00Z`);
  const testUtc = candidateAsUTC.toLocaleString('en-US', { timeZone: 'UTC' });
  const testIsrael = candidateAsUTC.toLocaleString('en-US', { timeZone: ISRAEL_TZ });
  const offsetMs = new Date(testIsrael).getTime() - new Date(testUtc).getTime();

  let result = new Date(candidateAsUTC.getTime() - offsetMs);

  while (getIsraelDayOfWeek(result) === 5 || getIsraelDayOfWeek(result) === 6) {
    result = new Date(result.getTime() + 24 * 60 * 60 * 1000);
  }

  return result;
}

/**
 * GET /api/cron/send-sequences
 *
 * Processes all ACTIVE email sequences whose nextSendAt has arrived.
 * Skips execution entirely on Friday/Saturday (Israel time).
 * Protected by CRON_SECRET.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cronSecret = searchParams.get('secret');
    const expectedSecret = process.env.CRON_SECRET;

    if (expectedSecret && cronSecret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const israelDay = getIsraelDayOfWeek(now);

    if (israelDay === 5 || israelDay === 6) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: 'שישי/שבת — לא נשלחים מיילים',
      });
    }

    const sequences = await prisma.emailSequence.findMany({
      where: {
        status: 'ACTIVE',
        nextSendAt: { lte: now },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            isMarketingSubscribed: true,
          },
        },
      },
    });

    let sent = 0;
    let failed = 0;
    let cancelled = 0;

    for (const seq of sequences) {
      if (!seq.user.isMarketingSubscribed) {
        await prisma.emailSequence.update({
          where: { id: seq.id },
          data: { status: 'CANCELLED', nextSendAt: null },
        });
        cancelled++;
        console.log(`[Sequence Cron] Cancelled ${seq.id} — user unsubscribed`);
        continue;
      }

      const subjectOvr = seq.subjectOverrides as Record<string, string> | null;
      const subjectOverride = subjectOvr?.[String(seq.currentStep)] || undefined;
      const contentOvr = seq.contentOverrides as Record<string, string> | null;
      const contentOverride = contentOvr?.[String(seq.currentStep)] || undefined;

      const result = await sendSequenceStepEmail({
        to: seq.user.email,
        userId: seq.user.id,
        step: seq.currentStep,
        userName: seq.user.name || 'משתמש',
        subjectOverride,
        contentOverride,
      });

      if ('error' in result) {
        failed++;
        console.error(
          `[Sequence Cron] Failed step ${seq.currentStep} for ${seq.user.email}: ${result.error}`,
        );
        continue;
      }

      sent++;
      const nextStep = seq.currentStep + 1;
      const isComplete = nextStep >= TOTAL_STEPS;

      const nextSendAt = isComplete
        ? null
        : computeNextSendAt(seq.sendHour, INTERVAL_DAYS);

      await prisma.emailSequence.update({
        where: { id: seq.id },
        data: {
          currentStep: nextStep,
          lastSentAt: now,
          ...(isComplete
            ? {
                status: 'COMPLETED',
                completedAt: now,
                nextSendAt: null,
              }
            : {
                nextSendAt,
              }),
        },
      });

      console.log(
        `[Sequence Cron] Sent step ${seq.currentStep} to ${seq.user.email} (resendId: ${result.id})${isComplete ? ' — COMPLETED' : ''}`,
      );
    }

    return NextResponse.json({
      success: true,
      processed: sequences.length,
      sent,
      failed,
      cancelled,
    });
  } catch (error) {
    console.error('[Sequence Cron] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process sequences' },
      { status: 500 },
    );
  }
}
