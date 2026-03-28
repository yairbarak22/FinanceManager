import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { executeFullReset, fullResetSchema } from '@/lib/userDataDeletion';
import { logAuditEvent, AuditAction, getRequestInfo } from '@/lib/auditLog';

export async function POST(request: Request) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const rateLimitResult = await checkRateLimit(`reset-all:${userId}`, RATE_LIMITS.auth);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'יותר מדי בקשות' }, { status: 429 });
    }

    const body = await request.json();
    const parsed = fullResetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'יש להקליד "אפס הכל" לאישור' },
        { status: 400 }
      );
    }

    const result = await executeFullReset(userId);

    const { ipAddress, userAgent } = getRequestInfo(request.headers);
    void logAuditEvent({
      userId,
      action: AuditAction.BULK_DELETE,
      entityType: 'UserData',
      metadata: {
        scope: 'full_reset',
        totalDeleted: result.totalDeleted,
        blobErrors: result.blobErrors,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      totalDeleted: result.totalDeleted,
    });
  } catch (error) {
    console.error('Error resetting all user data:', error);
    return NextResponse.json(
      { error: 'שגיאה באיפוס הנתונים' },
      { status: 500 }
    );
  }
}
