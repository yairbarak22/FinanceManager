import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { Resend } from 'resend';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rateLimit';
import { escapeHtml } from '@/lib/contactValidation';
import { logAuditEvent, AuditAction } from '@/lib/auditLog';
import { config } from '@/lib/config';

const MAX_BODY_SIZE = 10 * 1024;
const MIN_RESPONSE_TIME = 500;
const SUPPORT_EMAIL = 'support@myneto.co.il';

let resend: Resend | null = null;
function getResend(): Resend | null {
  if (!resend && config.resendApiKey) {
    resend = new Resend(config.resendApiKey);
  }
  return resend;
}

async function delayUntil(startTime: number, minDuration: number): Promise<void> {
  const elapsed = Date.now() - startTime;
  if (elapsed < minDuration) {
    await new Promise(resolve => setTimeout(resolve, minDuration - elapsed));
  }
}

async function sendSupportEmail(params: {
  message: string;
  userEmail?: string;
  userName: string;
  clientIp: string;
}): Promise<boolean> {
  const resendClient = getResend();

  if (!resendClient) {
    console.warn('[Support] Resend not configured - email not sent');
    return false;
  }

  const safeMessage = escapeHtml(params.message);
  const safeUserEmail = escapeHtml(params.userEmail || 'אורח');
  const safeUserName = escapeHtml(params.userName || 'לא צוין');
  const safeTimestamp = escapeHtml(new Date().toLocaleString('he-IL'));
  const safeIp = escapeHtml(params.clientIp);

  try {
    const result = await resendClient.emails.send({
      from: 'NETO Support <support@myneto.co.il>',
      to: SUPPORT_EMAIL,
      replyTo: params.userEmail || undefined,
      subject: 'פנייה חדשה לתמיכה',
      html: `
        <div dir="rtl" style="font-family: 'Nunito', 'Segoe UI', Tahoma, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #F5F5F7; border-radius: 24px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #0DBACC, #69ADFF); padding: 32px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 800;">NETO</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">פנייה חדשה לתמיכה</p>
          </div>

          <div style="padding: 32px;">
            <div style="background: #FFFFFF; border-radius: 24px; padding: 24px; margin-bottom: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
              <h2 style="color: #303150; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">תוכן הפנייה</h2>
              <p style="color: #7E7F90; line-height: 1.8; margin: 0; white-space: pre-wrap;">${safeMessage}</p>
            </div>

            <div style="background: #FFFFFF; border-radius: 24px; padding: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
              <h3 style="color: #303150; font-size: 14px; font-weight: 600; margin: 0 0 12px 0;">פרטי השולח</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="color: #7E7F90; font-size: 13px; padding: 6px 0; width: 80px;">שם:</td>
                  <td style="color: #303150; font-size: 13px; padding: 6px 0;">${safeUserName}</td>
                </tr>
                <tr>
                  <td style="color: #7E7F90; font-size: 13px; padding: 6px 0;">אימייל:</td>
                  <td style="color: #303150; font-size: 13px; padding: 6px 0;">${safeUserEmail}</td>
                </tr>
                <tr>
                  <td style="color: #7E7F90; font-size: 13px; padding: 6px 0;">תאריך:</td>
                  <td style="color: #303150; font-size: 13px; padding: 6px 0;">${safeTimestamp}</td>
                </tr>
                <tr>
                  <td style="color: #7E7F90; font-size: 13px; padding: 6px 0;">IP:</td>
                  <td style="color: #303150; font-size: 13px; padding: 6px 0;">${safeIp}</td>
                </tr>
              </table>
            </div>
          </div>

          <div style="padding: 20px; text-align: center; border-top: 1px solid #F7F7F8;">
            <p style="color: #BDBDCB; font-size: 11px; margin: 0;">
              &copy; ${new Date().getFullYear()} NETO - ניהול הון חכם
            </p>
          </div>
        </div>
      `,
    });

    if (result?.error) {
      console.error('[Support] Resend returned error:', result.error);
      return false;
    }

    console.log('[Support] Email sent successfully to', SUPPORT_EMAIL, {
      resendId: result?.data?.id,
    });
    return true;
  } catch (error) {
    console.error('[Support] Failed to send email:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const clientIp = getClientIp(request.headers);

  try {
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) {
      await delayUntil(startTime, MIN_RESPONSE_TIME);
      return NextResponse.json({ error: 'הבקשה גדולה מדי' }, { status: 413 });
    }

    const ipLimit = await checkRateLimit(
      `support-contact:ip:${clientIp}`,
      RATE_LIMITS.contact
    );

    if (!ipLimit.success) {
      const retryAfter = Math.ceil((ipLimit.resetTime - Date.now()) / 1000);
      await delayUntil(startTime, MIN_RESPONSE_TIME);
      return NextResponse.json(
        { error: 'יותר מדי בקשות. נסו שוב בעוד דקה.' },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      );
    }

    const token = await getToken({
      req: request,
      secret: config.nextAuthSecret,
    });

    const userId = token?.sub;
    const userEmail = token?.email as string | undefined;
    const userName = (token?.name as string | undefined) || '';

    if (userId) {
      const userLimit = await checkRateLimit(
        `support-contact:user:${userId}`,
        RATE_LIMITS.contactUser
      );

      if (!userLimit.success) {
        const retryAfter = Math.ceil((userLimit.resetTime - Date.now()) / 1000);
        await delayUntil(startTime, MIN_RESPONSE_TIME);
        return NextResponse.json(
          { error: 'יותר מדי בקשות. נסו שוב בעוד מספר דקות.' },
          { status: 429, headers: { 'Retry-After': String(retryAfter) } }
        );
      }
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      await delayUntil(startTime, MIN_RESPONSE_TIME);
      return NextResponse.json({ error: 'נתונים לא תקינים' }, { status: 400 });
    }

    const { message } = body as { message?: string };

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      await delayUntil(startTime, MIN_RESPONSE_TIME);
      return NextResponse.json({ error: 'נא לכתוב הודעה' }, { status: 400 });
    }

    if (message.length > 5000) {
      await delayUntil(startTime, MIN_RESPONSE_TIME);
      return NextResponse.json({ error: 'ההודעה ארוכה מדי' }, { status: 400 });
    }

    const emailSent = await sendSupportEmail({
      message,
      userEmail,
      userName,
      clientIp,
    });

    logAuditEvent({
      userId,
      action: AuditAction.CREATE,
      entityType: 'support_contact_submission',
      metadata: {
        messageLength: message.length,
        emailSent,
        ip: clientIp,
      },
    });

    if (!emailSent) {
      await delayUntil(startTime, MIN_RESPONSE_TIME);
      return NextResponse.json(
        { error: 'שגיאה בשליחת ההודעה. נסו שוב מאוחר יותר.' },
        { status: 500 }
      );
    }

    await delayUntil(startTime, MIN_RESPONSE_TIME + 200);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Support] Server error:', error);
    await delayUntil(startTime, MIN_RESPONSE_TIME);
    return NextResponse.json(
      { error: 'שגיאה בשליחת ההודעה. נסו שוב מאוחר יותר.' },
      { status: 500 }
    );
  }
}
