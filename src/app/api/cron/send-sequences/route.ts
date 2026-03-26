import { NextRequest, NextResponse } from 'next/server';
import { processDueEnrollments } from '@/lib/marketing/workflows/engine';
import { isAuthorizedCronRequest } from '@/lib/cronAuth';

const ISRAEL_TZ = 'Asia/Jerusalem';

/**
 * Compute the next valid send time in UTC, given a desired Israel-time hour
 * and a number of days to add from now. Skips Friday and Saturday (Israel).
 * Exported for use by other routes (e.g. email-sequences/start).
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

function getIsraelDayOfWeek(date: Date): number {
  const dayName = new Intl.DateTimeFormat('en-US', {
    timeZone: ISRAEL_TZ,
    weekday: 'long',
  }).format(date);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days.indexOf(dayName);
}

/**
 * GET /api/cron/send-sequences
 *
 * Processes all ACTIVE workflow enrollments whose nextWakeupAt has arrived.
 * Skips execution entirely on Friday/Saturday (Israel time).
 * Protected by CRON_SECRET.
 */
export async function GET(request: NextRequest) {
  try {
    if (!isAuthorizedCronRequest(request)) {
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

    const workflowStats = await processDueEnrollments();

    return NextResponse.json({
      success: true,
      workflows: workflowStats,
    });
  } catch (error) {
    console.error('[Cron] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process workflows' },
      { status: 500 },
    );
  }
}
