/**
 * Contact Form API Route
 * 
 * Security measures:
 * 1. Request size limit (10KB max)
 * 2. IP-based rate limiting (5/min)
 * 3. User-based rate limiting (10/5min) if authenticated
 * 4. CSRF protection (via middleware)
 * 5. Input validation and sanitization
 * 6. Honeypot field for bot detection
 * 7. Spam pattern detection
 * 8. Audit logging
 * 9. Consistent response times
 * 10. Email notification via Resend
 */

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { Resend } from 'resend';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rateLimit';
import { validateContactForm, ContactCategory, escapeHtml } from '@/lib/contactValidation';
import { logAuditEvent, AuditAction } from '@/lib/auditLog';
import { config } from '@/lib/config';

// Maximum request body size (10KB)
const MAX_BODY_SIZE = 10 * 1024;

// Minimum processing time to prevent timing attacks (ms)
const MIN_RESPONSE_TIME = 500;

// Support email address to receive contact form submissions
const SUPPORT_EMAIL = 'yairbarak22@gmail.com';

// Lazy initialization to avoid build-time errors when API key is not set
let resend: Resend | null = null;
function getResend(): Resend | null {
  if (!resend && config.resendApiKey) {
    resend = new Resend(config.resendApiKey);
  }
  return resend;
}

interface ContactSubmission {
  category: ContactCategory;
  subject: string;
  message: string;
  userId?: string;
  userEmail?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
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
 * Get category display name in Hebrew
 */
function getCategoryLabel(category: ContactCategory): string {
  const labels: Record<ContactCategory, string> = {
    bug: '🐛 דיווח על באג',
    feature: '💡 בקשת תכונה',
    general: '💬 פנייה כללית',
  };
  return labels[category];
}

/**
 * Send email notification via Resend
 */
async function sendContactEmail(submission: ContactSubmission): Promise<boolean> {
  const resendClient = getResend();
  
  if (!resendClient) {
    console.warn('[Contact] Resend not configured - email not sent');
    return false;
  }

  // SECURITY: Escape all user-provided data before inserting into HTML
  const safeSubject = escapeHtml(submission.subject);
  const safeMessage = escapeHtml(submission.message);
  const safeUserEmail = escapeHtml(submission.userEmail);
  const safeUserId = escapeHtml(submission.userId || 'אורח');
  const safeTimestamp = escapeHtml(submission.timestamp.toLocaleString('he-IL'));
  const safeIpAddress = escapeHtml(submission.ipAddress);

  try {
    await resendClient.emails.send({
      from: 'NETO Contact <onboarding@resend.dev>',
      to: SUPPORT_EMAIL,
      replyTo: submission.userEmail || undefined,
      subject: `[NETO צור קשר] ${getCategoryLabel(submission.category)}: ${submission.subject}`,
      html: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 16px; overflow: hidden;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #8b5cf6 100%); padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 800;">NETO</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">פנייה חדשה</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 24px;">
            <!-- Category Badge -->
            <div style="background: rgba(255,255,255,0.1); border-radius: 8px; padding: 8px 16px; display: inline-block; margin-bottom: 16px;">
              <span style="color: #e2e8f0; font-size: 14px;">${getCategoryLabel(submission.category)}</span>
            </div>

            <!-- Subject -->
            <h2 style="color: #f1f5f9; margin: 0 0 16px 0; font-size: 20px;">${safeSubject}</h2>
            
            <!-- Message -->
            <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <p style="color: #cbd5e1; line-height: 1.8; margin: 0; white-space: pre-wrap;">${safeMessage}</p>
            </div>
            
            <!-- User Info -->
            <div style="background: rgba(255,255,255,0.03); border-radius: 8px; padding: 16px;">
              <h3 style="color: #94a3b8; font-size: 12px; text-transform: uppercase; margin: 0 0 12px 0;">פרטי השולח</h3>
              <table style="width: 100%; border-collapse: collapse;">
                ${submission.userEmail ? `
                <tr>
                  <td style="color: #64748b; font-size: 13px; padding: 4px 0;">אימייל:</td>
                  <td style="color: #e2e8f0; font-size: 13px; padding: 4px 0;"><a href="mailto:${safeUserEmail}" style="color: #60a5fa;">${safeUserEmail}</a></td>
                </tr>
                ` : ''}
                <tr>
                  <td style="color: #64748b; font-size: 13px; padding: 4px 0;">מזהה משתמש:</td>
                  <td style="color: #e2e8f0; font-size: 13px; padding: 4px 0;">${safeUserId}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; font-size: 13px; padding: 4px 0;">תאריך:</td>
                  <td style="color: #e2e8f0; font-size: 13px; padding: 4px 0;">${safeTimestamp}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; font-size: 13px; padding: 4px 0;">IP:</td>
                  <td style="color: #e2e8f0; font-size: 13px; padding: 4px 0;">${safeIpAddress}</td>
                </tr>
              </table>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background: rgba(0,0,0,0.2); padding: 16px; text-align: center; border-top: 1px solid rgba(255,255,255,0.05);">
            <p style="color: #475569; font-size: 11px; margin: 0;">
              © ${new Date().getFullYear()} NETO - ניהול הון חכם
            </p>
          </div>
        </div>
      `,
    });

    console.log('[Contact] Email sent successfully to', SUPPORT_EMAIL);
    return true;
  } catch (error) {
    console.error('[Contact] Failed to send email:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const clientIp = getClientIp(request.headers);
  const userAgent = request.headers.get('user-agent') || 'unknown';

  try {
    // =========================================================================
    // 1. Check request size limit
    // =========================================================================
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) {
      console.warn('[Contact] Request too large:', {
        endpoint: '/api/contact',
        reason: 'request_too_large',
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
      `contact:ip:${clientIp}`,
      RATE_LIMITS.contact
    );

    if (!ipLimit.success) {
      const retryAfter = Math.ceil((ipLimit.resetTime - Date.now()) / 1000);

      await delayUntil(startTime, MIN_RESPONSE_TIME);
      return NextResponse.json(
        { error: 'יותר מדי בקשות. נסה שוב בעוד דקה.' },
        { 
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
          },
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

    // =========================================================================
    // 4. Check user-based rate limit (if authenticated)
    // =========================================================================
    if (userId) {
      const userLimit = await checkRateLimit(
        `contact:user:${userId}`,
        RATE_LIMITS.contactUser
      );

      if (!userLimit.success) {
        const retryAfter = Math.ceil((userLimit.resetTime - Date.now()) / 1000);

        await delayUntil(startTime, MIN_RESPONSE_TIME);
        return NextResponse.json(
          { error: 'יותר מדי בקשות. נסה שוב בעוד מספר דקות.' },
          { 
            status: 429,
            headers: {
              'Retry-After': String(retryAfter),
            },
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

    // =========================================================================
    // 6. Validate and sanitize form data
    // =========================================================================
    const validation = validateContactForm(body);

    // Honeypot triggered - silently accept to not reveal it's a trap
    if (validation.errors.honeypot === 'bot_detected') {
      console.warn('[Contact] Honeypot triggered:', {
        endpoint: '/api/contact',
        reason: 'honeypot_triggered',
        ip: clientIp,
      });

      // Delay to simulate normal processing
      await delayUntil(startTime, MIN_RESPONSE_TIME + 500);
      return NextResponse.json({ success: true });
    }

    // Validation failed
    if (!validation.isValid) {
      console.warn('[Contact] Validation failed:', {
        endpoint: '/api/contact',
        errors: validation.errors,
        ip: clientIp,
      });

      await delayUntil(startTime, MIN_RESPONSE_TIME);
      return NextResponse.json(
        { error: Object.values(validation.errors)[0] || 'נתונים לא תקינים' },
        { status: 400 }
      );
    }

    // =========================================================================
    // 7. Process the contact submission
    // =========================================================================
    const submission: ContactSubmission = {
      category: validation.sanitizedData!.category,
      subject: validation.sanitizedData!.subject,
      message: validation.sanitizedData!.message,
      userId,
      userEmail,
      ipAddress: clientIp,
      userAgent,
      timestamp: new Date(),
    };

    // Log the submission
    console.log('📧 Contact form submission:', {
      category: submission.category,
      subject: submission.subject,
      messageLength: submission.message.length,
      userId: submission.userId || 'anonymous',
      ip: submission.ipAddress,
      timestamp: submission.timestamp.toISOString(),
    });

    // =========================================================================
    // 8. Send email notification via Resend
    // =========================================================================
    const emailSent = await sendContactEmail(submission);

    // Log successful submission to audit log
    logAuditEvent({
      userId,
      action: AuditAction.CREATE,
      entityType: 'contact_submission',
      metadata: {
        category: submission.category,
        subjectLength: submission.subject.length,
        messageLength: submission.message.length,
        emailSent,
        ip: clientIp,
      },
    });

    // =========================================================================
    // 9. Return success response
    // =========================================================================
    // Ensure minimum response time
    await delayUntil(startTime, MIN_RESPONSE_TIME + 200);

    return NextResponse.json({ success: true });

  } catch (error) {
    // Log the error
    console.error('[Contact] Server error:', error);

    // Consistent response time even for errors
    await delayUntil(startTime, MIN_RESPONSE_TIME);

    return NextResponse.json(
      { error: 'שגיאה בשליחת ההודעה. נסה שוב מאוחר יותר.' },
      { status: 500 }
    );
  }
}
