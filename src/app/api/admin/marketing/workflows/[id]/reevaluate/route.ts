import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { reevaluateConditions } from '@/lib/marketing/workflows/engine';

/**
 * POST /api/admin/marketing/workflows/[id]/reevaluate
 *
 * Manually trigger condition re-evaluation for a specific workflow,
 * optionally filtered to a single condition node.
 *
 * Body (optional): { nodeId?: string }
 */
export async function POST(
  _request: NextRequest,
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
    const body = await _request.json().catch(() => ({}));
    const nodeId = typeof body.nodeId === 'string' ? body.nodeId : undefined;

    const stats = await reevaluateConditions({ workflowId, nodeId });

    return NextResponse.json({
      success: true,
      message: `בוצע: ${stats.advanced} לכן, ${stats.timedOut} ללא, ${stats.reclaimed} תוקנו, ${stats.processed} נבדקו`,
      ...stats,
    });
  } catch (error) {
    console.error('[Reevaluate] Error:', error);
    return NextResponse.json(
      { error: 'שגיאה בהרצת בדיקת תנאים' },
      { status: 500 },
    );
  }
}
