import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authHelpers';
import { prisma } from '@/lib/prisma';
import { createCalculatorInvite } from '@/lib/calculatorInvites';
import { sendCalculatorInviteEmail } from '@/lib/emails/calculatorInvite';
import { validateRequest } from '@/lib/validateRequest';
import { sendFriendInviteSchema } from '@/lib/validationSchemas';
import { checkRateLimitWithIp, getClientIp, RATE_LIMITS, IP_RATE_LIMITS } from '@/lib/rateLimit';
import { AuditAction, getRequestInfo, logAuditEvent } from '@/lib/auditLog';

/**
 * POST /api/calculators/invite
 * Send a calculator invite to a friend
 */
export async function POST(request: Request) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const { data, errorResponse } = await validateRequest(request, sendFriendInviteSchema);
    if (errorResponse) return errorResponse;
    const { email } = data;

    const ipAddress = getClientIp(request.headers);
    const rateLimitResult = await checkRateLimitWithIp(
      userId,
      ipAddress,
      RATE_LIMITS.inviteUserDaily,
      IP_RATE_LIMITS.inviteDaily,
      'calculator-invite'
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'הגעת למגבלת ההזמנות היומית. אפשר לנסות שוב מחר.' },
        { status: 429 }
      );
    }

    // Get current user info for the email
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: 'משתמש לא נמצא' },
        { status: 404 }
      );
    }

    // Create the invite
    const result = await createCalculatorInvite(
      userId,
      currentUser.email,
      email
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Send the email (don't fail if email fails - invite is already created)
    let emailSent = false;
    try {
      const inviterName = currentUser.name || currentUser.email.split('@')[0];
      emailSent = await sendCalculatorInviteEmail({
        to: email,
        inviterName,
        inviteToken: result.token!,
      });
    } catch (emailError) {
      console.error('[API] Failed to send invite email:', emailError);
      // Continue - invite was created successfully
    }

    const requestInfo = getRequestInfo(request.headers);
    void logAuditEvent({
      userId,
      action: AuditAction.INVITE_SENT,
      entityType: 'CalculatorInvite',
      entityId: result.inviteId,
      metadata: {
        channel: 'sidebar',
        inviteType: 'friend_signup_referral',
        emailDomain: email.split('@')[1] || 'unknown',
        emailSent,
      },
      ipAddress: requestInfo.ipAddress,
      userAgent: requestInfo.userAgent,
    });

    return NextResponse.json({
      success: true,
      message: emailSent ? 'ההזמנה נשלחה בהצלחה' : 'ההזמנה נוצרה (המייל לא נשלח)',
      inviteId: result.inviteId,
      emailSent,
    });
  } catch (error) {
    console.error('[API] Calculator invite error:', error);
    return NextResponse.json(
      { error: 'שגיאה בשליחת ההזמנה' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/calculators/invite
 * Get list of invites sent by the current user
 */
export async function GET() {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const invites = await prisma.calculatorInvite.findMany({
      where: { inviterId: userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        inviteeEmail: true,
        status: true,
        createdAt: true,
        expiresAt: true,
        acceptedAt: true,
      },
    });

    return NextResponse.json(invites);
  } catch (error) {
    console.error('[API] Get calculator invites error:', error);
    return NextResponse.json(
      { error: 'שגיאה בטעינת ההזמנות' },
      { status: 500 }
    );
  }
}

