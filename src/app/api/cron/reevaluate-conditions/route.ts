import { NextRequest, NextResponse } from 'next/server';
import { reevaluateConditions } from '@/lib/marketing/workflows/engine';
import { isAuthorizedCronRequest } from '@/lib/cronAuth';

/**
 * GET /api/cron/reevaluate-conditions
 *
 * Hourly cron that re-evaluates all workflow enrollments parked at CONDITION
 * nodes. Users who have since opened/clicked get routed to the "true" branch;
 * users who have waited longer than the condition's waitHours timeout get
 * routed to the "false" branch.
 *
 * Unlike the send-sequences cron, this runs every day including Friday/Saturday
 * because it only evaluates conditions — it doesn't send emails directly.
 * (If the next node after the condition is an EMAIL, the normal engine will
 * respect the Friday/Saturday send block.)
 */
export async function GET(request: NextRequest) {
  try {
    if (!isAuthorizedCronRequest(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = await reevaluateConditions();

    return NextResponse.json({
      success: true,
      ...stats,
    });
  } catch (error) {
    console.error('[Cron] reevaluate-conditions error:', error);
    return NextResponse.json(
      { error: 'Failed to reevaluate conditions' },
      { status: 500 },
    );
  }
}
