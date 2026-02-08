/**
 * Investment Contact API Route
 * Sends inquiry emails to admin@myneto.co.il
 *
 * Security measures:
 * 1. Request size limit (10KB max)
 * 2. IP-based rate limiting (5/min)
 * 3. User-based rate limiting (10/5min) if authenticated
 * 4. CSRF protection (via middleware)
 * 5. Input validation and sanitization
 * 6. Audit logging
 * 7. Consistent response times (timing attack prevention)
 * 8. Email notification via Resend
 */

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { Resend } from 'resend';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rateLimit';
import { escapeHtml } from '@/lib/contactValidation';
import { logAuditEvent, AuditAction } from '@/lib/auditLog';
import { config } from '@/lib/config';

// Maximum request body size (10KB)
const MAX_BODY_SIZE = 10 * 1024;

// Minimum processing time to prevent timing attacks (ms)
const MIN_RESPONSE_TIME = 500;

// Support email address to receive investment inquiries
const ADMIN_EMAIL = 'admin@myneto.co.il';

// Lazy initialization to avoid build-time errors when API key is not set
let resend: Resend | null = null;
function getResend(): Resend | null {
  if (!resend && config.resendApiKey) {
    resend = new Resend(config.resendApiKey);
  }
  return resend;
}

/**
 * Ensure consistent response time to prevent timing attacks
 */
async function delayUntil(startTime: number, minDuration: number): Promise<void> {
  const elapsed = Date.now() - startTime;
  if (elapsed < minDuration) {
    await new Promise(resolve => setTimeout(resolve, minDuration - elapsed));
  }
}

/**
 * Send investment contact email via Resend
 * Returns true if email was sent successfully, false otherwise
 */
async function sendInvestmentContactEmail(params: {
  message: string;
  userEmail?: string;
  userName: string;
  clientIp: string;
}): Promise<boolean> {
  const resendClient = getResend();

  if (!resendClient) {
    console.warn('[InvestmentContact] Resend not configured - email not sent');
    return false;
  }

  // Escape all user-provided data before inserting into HTML
  const safeMessage = escapeHtml(params.message);
  const safeUserEmail = escapeHtml(params.userEmail || 'אורח');
  const safeUserName = escapeHtml(params.userName || 'לא צוין');
  const safeTimestamp = escapeHtml(new Date().toLocaleString('he-IL'));
  const safeIp = escapeHtml(params.clientIp);

  try {
    const result = await resendClient.emails.send({
      from: 'NETO Investments <invest@myneto.co.il>',
      to: ADMIN_EMAIL,
      replyTo: params.userEmail || undefined,
      subject: 'פתיחת תיק מסחר - שאלה חדשה',
      html: `
        <div dir="rtl" style="font-family: 'Nunito', 'Segoe UI', Tahoma, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #F5F5F7; border-radius: 24px; overflow: hidden;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #0DBACC, #69ADFF); padding: 32px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 800;">NETO</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">שאלה חדשה - פתיחת תיק מסחר</p>
          </div>

          <!-- Content -->
          <div style="padding: 32px;">
            <!-- Message -->
            <div style="background: #FFFFFF; border-radius: 24px; padding: 24px; margin-bottom: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
              <h2 style="color: #303150; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">תוכן השאלה</h2>
              <p style="color: #7E7F90; line-height: 1.8; margin: 0; white-space: pre-wrap;">${safeMessage}</p>
            </div>

            <!-- User Info -->
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

          <!-- Footer -->
          <div style="padding: 20px; text-align: center; border-top: 1px solid #F7F7F8;">
            <p style="color: #BDBDCB; font-size: 11px; margin: 0;">
              &copy; ${new Date().getFullYear()} NETO - ניהול הון חכם
            </p>
          </div>
        </div>
      `,
    });

    // Check if Resend returned an error in the response (not thrown)
    if (result?.error) {
      console.error('[InvestmentContact] Resend returned error:', result.error);
      return false;
    }

    console.log('[InvestmentContact] Email sent successfully to', ADMIN_EMAIL, {
      resendId: result?.data?.id,
    });
    return true;
  } catch (error) {
    console.error('[InvestmentContact] Failed to send email:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const clientIp = getClientIp(request.headers);

  try {
    // =========================================================================
    // 1. Check request size limit
    // =========================================================================
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) {
      console.warn('[InvestmentContact] Request too large:', {
        size: contentLength,
        ip: clientIp,
      });

      await delayUntil(startTime, MIN_RESPONSE_TIME);
      return NextResponse.json(
        { error: 'הבקשה גדולה מדי' },
        { status: 413 }
      );
    }

    // =========================================================================
    // 2. Check IP-based rate limit
    // =========================================================================
    const ipLimit = await checkRateLimit(
      `invest-contact:ip:${clientIp}`,
      RATE_LIMITS.contact
    );

    if (!ipLimit.success) {
      const retryAfter = Math.ceil((ipLimit.resetTime - Date.now()) / 1000);
      console.warn('[InvestmentContact] IP rate limited:', { ip: clientIp });

      await delayUntil(startTime, MIN_RESPONSE_TIME);
      return NextResponse.json(
        { error: 'יותר מדי בקשות. נסו שוב בעוד דקה.' },
        {
          status: 429,
          headers: { 'Retry-After': String(retryAfter) },
        }
      );
    }

    // =========================================================================
    // 3. Get user session (optional, for authenticated users)
    // =========================================================================
    const token = await getToken({
      req: request,
      secret: config.nextAuthSecret,
    });

    const userId = token?.sub;
    const userEmail = token?.email as string | undefined;
    const userName = (token?.name as string | undefined) || '';

    // =========================================================================
    // 4. Check user-based rate limit (if authenticated)
    // =========================================================================
    if (userId) {
      const userLimit = await checkRateLimit(
        `invest-contact:user:${userId}`,
        RATE_LIMITS.contactUser
      );

      if (!userLimit.success) {
        const retryAfter = Math.ceil((userLimit.resetTime - Date.now()) / 1000);
        console.warn('[InvestmentContact] User rate limited:', { userId });

        await delayUntil(startTime, MIN_RESPONSE_TIME);
        return NextResponse.json(
          { error: 'יותר מדי בקשות. נסו שוב בעוד מספר דקות.' },
          {
            status: 429,
            headers: { 'Retry-After': String(retryAfter) },
          }
        );
      }
    }

    // =========================================================================
    // 5. Parse and validate request body
    // =========================================================================
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      await delayUntil(startTime, MIN_RESPONSE_TIME);
      return NextResponse.json(
        { error: 'נתונים לא תקינים' },
        { status: 400 }
      );
    }

    const { message } = body as { message?: string };

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      await delayUntil(startTime, MIN_RESPONSE_TIME);
      return NextResponse.json(
        { error: 'נא לכתוב הודעה' },
        { status: 400 }
      );
    }

    if (message.length > 5000) {
      await delayUntil(startTime, MIN_RESPONSE_TIME);
      return NextResponse.json(
        { error: 'ההודעה ארוכה מדי' },
        { status: 400 }
      );
    }

    // =========================================================================
    // 6. Send email via Resend
    // =========================================================================
    const emailSent = await sendInvestmentContactEmail({
      message,
      userEmail,
      userName,
      clientIp,
    });

    // =========================================================================
    // 7. Audit log
    // =========================================================================
    logAuditEvent({
      userId,
      action: AuditAction.CREATE,
      entityType: 'investment_contact_submission',
      metadata: {
        messageLength: message.length,
        emailSent,
        ip: clientIp,
      },
    });

    // =========================================================================
    // 8. Return response
    // =========================================================================
    if (!emailSent) {
      console.error('[InvestmentContact] Email failed to send', {
        userId: userId || 'anonymous',
        ip: clientIp,
      });

      await delayUntil(startTime, MIN_RESPONSE_TIME);
      return NextResponse.json(
        { error: 'שגיאה בשליחת ההודעה. נסו שוב מאוחר יותר.' },
        { status: 500 }
      );
    }

    await delayUntil(startTime, MIN_RESPONSE_TIME + 200);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[InvestmentContact] Server error:', error);

    await delayUntil(startTime, MIN_RESPONSE_TIME);
    return NextResponse.json(
      { error: 'שגיאה בשליחת ההודעה. נסו שוב מאוחר יותר.' },
      { status: 500 }
    );
  }
}
