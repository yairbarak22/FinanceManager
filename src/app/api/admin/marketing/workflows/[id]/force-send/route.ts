import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { processDueEnrollments } from '@/lib/marketing/workflows/engine';

const ISRAEL_TZ = 'Asia/Jerusalem';

/**
 * Convert an Israel-timezone date string (YYYY-MM-DD) to a UTC start/end range.
 */
function israelDayToUtcRange(dateStr: string): { start: Date; end: Date } {
  // Create a date at midnight Israel time, then convert to UTC
  const midnightIsrael = new Date(`${dateStr}T00:00:00`);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: ISRAEL_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  // Get the offset by comparing UTC and Israel representations
  const testDate = new Date(`${dateStr}T12:00:00Z`);
  const israelParts = formatter.formatToParts(testDate);
  const israelHour = parseInt(
    israelParts.find((p) => p.type === 'hour')?.value ?? '12',
  );
  const offsetHours = israelHour - 12;

  const start = new Date(`${dateStr}T00:00:00Z`);
  start.setHours(start.getHours() - offsetHours);

  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  return { start, end };
}

/**
 * POST /api/admin/marketing/workflows/[id]/force-send
 *
 * Immediately processes a specific group of enrollments at a DELAY node,
 * skipping the remaining wait time. The engine will send the next EMAIL
 * and continue the workflow.
 *
 * Body: { delayNodeId: string, sendDate: string (YYYY-MM-DD) }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId, error: authError } = await requireAdmin();
    if (authError) return authError;

    const rateLimitResult = await checkRateLimit(`admin:${userId}`, RATE_LIMITS.admin);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'יותר מדי בקשות. נסה שוב בעוד דקה.' },
        { status: 429 },
      );
    }

    const { id: workflowId } = await params;
    const body = await request.json();
    const { delayNodeId, sendDate } = body;

    if (
      !delayNodeId ||
      typeof delayNodeId !== 'string' ||
      !sendDate ||
      !/^\d{4}-\d{2}-\d{2}$/.test(sendDate)
    ) {
      return NextResponse.json(
        { error: 'נדרש delayNodeId ו-sendDate בפורמט YYYY-MM-DD' },
        { status: 400 },
      );
    }

    // Convert sendDate to UTC range
    const { start, end } = israelDayToUtcRange(sendDate);

    // Set nextWakeupAt to the past for matching enrollments
    const updated = await prisma.workflowEnrollment.updateMany({
      where: {
        workflowId,
        status: 'ACTIVE',
        currentNodeId: delayNodeId,
        nextWakeupAt: {
          gte: start,
          lt: end,
        },
      },
      data: {
        nextWakeupAt: new Date(0), // Far past — engine will pick them up immediately
      },
    });

    if (updated.count === 0) {
      return NextResponse.json({
        success: true,
        message: 'לא נמצאו רשומות לשליחה',
        sent: 0,
      });
    }

    // Process immediately — engine sends emails and advances
    const stats = await processDueEnrollments();

    return NextResponse.json({
      success: true,
      message: `נשלחו ${updated.count} מיילים בהצלחה`,
      sent: updated.count,
      engineStats: stats,
    });
  } catch (error) {
    console.error('[ForceSend] Error:', error);
    return NextResponse.json(
      { error: 'שגיאה בשליחה מיידית' },
      { status: 500 },
    );
  }
}
