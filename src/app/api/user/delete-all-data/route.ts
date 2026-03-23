import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { executeFullDeletion } from '@/lib/userDataDeletion';
import { logAuditEvent, AuditAction, getRequestInfo } from '@/lib/auditLog';

export async function DELETE(request: Request) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const rateLimitResult = await checkRateLimit(`delete-all:${userId}`, RATE_LIMITS.auth);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'יותר מדי בקשות' }, { status: 429 });
    }

    const result = await executeFullDeletion(userId);

    const { ipAddress, userAgent } = getRequestInfo(request.headers);
    void logAuditEvent({
      userId,
      action: AuditAction.BULK_DELETE,
      entityType: 'UserData',
      metadata: { scope: 'all', blobErrors: result.blobErrors },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting all user data:', error);
    return NextResponse.json({ error: 'שגיאה במחיקת הנתונים' }, { status: 500 });
  }
}
