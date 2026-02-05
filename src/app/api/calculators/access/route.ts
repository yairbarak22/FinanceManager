import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authHelpers';
import { getInviteStats } from '@/lib/calculatorInvites';

/**
 * GET /api/calculators/access
 * Check if current user has pro calculator access
 */
export async function GET() {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const stats = await getInviteStats(userId);

    return NextResponse.json({
      hasAccess: stats.hasAccess,
      pendingInvites: stats.pendingCount,
      acceptedInvites: stats.acceptedCount,
    });
  } catch (error) {
    console.error('[API] Calculator access check error:', error);
    return NextResponse.json(
      { error: 'שגיאה בבדיקת הגישה' },
      { status: 500 }
    );
  }
}

