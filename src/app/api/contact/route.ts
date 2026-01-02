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
 */

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rateLimit';
import { validateContactForm, ContactCategory } from '@/lib/contactValidation';
import { logAuditEvent, AuditAction } from '@/lib/auditLog';
import { config } from '@/lib/config';

// Maximum request body size (10KB)
const MAX_BODY_SIZE = 10 * 1024;

// Minimum processing time to prevent timing attacks (ms)
const MIN_RESPONSE_TIME = 500;

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

    // Log the submission (in production, you might want to:
    // - Save to database
    // - Send email notification
    // - Forward to support system)
    console.log('📧 Contact form submission:', {
      category: submission.category,
      subject: submission.subject,
      messageLength: submission.message.length,
      userId: submission.userId || 'anonymous',
      ip: submission.ipAddress,
      timestamp: submission.timestamp.toISOString(),
    });

    // Log successful submission to audit log
    logAuditEvent({
      userId,
      action: AuditAction.CREATE,
      entityType: 'contact_submission',
      metadata: {
        category: submission.category,
        subjectLength: submission.subject.length,
        messageLength: submission.message.length,
        ip: clientIp,
      },
    });

    // =========================================================================
    // 8. Return success response
    // =========================================================================
    // Simulate some processing time (realistic delay)
    await delayUntil(startTime, MIN_RESPONSE_TIME + 500);

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
