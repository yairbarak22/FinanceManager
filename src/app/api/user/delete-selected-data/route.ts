import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import {
  dataDeletionSchema,
  executeSelectiveDeletion,
  DOMAIN_DEPENDENCIES,
  type DataDomain,
} from '@/lib/userDataDeletion';
import { logAuditEvent, AuditAction, getRequestInfo } from '@/lib/auditLog';

export async function POST(request: Request) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const rateLimitResult = await checkRateLimit(
      `delete-data:${userId}`,
      RATE_LIMITS.auth
    );
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'יותר מדי בקשות' }, { status: 429 });
    }

    const body = await request.json();
    const parsed = dataDeletionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'בחירה לא תקינה', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { domains } = parsed.data;

    // Enforce dependency rules: if a domain requires co-deletion of dependants,
    // verify all dependants are included in the selection.
    for (const domain of domains) {
      const deps = DOMAIN_DEPENDENCIES[domain as DataDomain];
      if (deps) {
        const missing = deps.filter((d) => !domains.includes(d));
        if (missing.length > 0) {
          return NextResponse.json(
            {
              error: `כדי למחוק ${domain} יש למחוק גם: ${missing.join(', ')}`,
              missingDependencies: missing,
            },
            { status: 400 }
          );
        }
      }
    }

    const result = await executeSelectiveDeletion(userId, domains);

    const { ipAddress, userAgent } = getRequestInfo(request.headers);
    void logAuditEvent({
      userId,
      action: AuditAction.BULK_DELETE,
      entityType: 'UserData',
      metadata: {
        scope: 'selective',
        domains,
        blobErrors: result.blobErrors,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      deleted: result.deleted,
    });
  } catch (error) {
    console.error('Error deleting selected user data:', error);
    return NextResponse.json(
      { error: 'שגיאה במחיקת הנתונים' },
      { status: 500 }
    );
  }
}
