/**
 * Guide Request API Route
 *
 * Allows authenticated users to request new knowledge center guides.
 * Reuses contact form security patterns: rate limiting, honeypot, sanitization.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/authHelpers';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rateLimit';
import { sanitizeInput, detectSpam } from '@/lib/contactValidation';
import { logAuditEvent, AuditAction } from '@/lib/auditLog';
import { Resend } from 'resend';
import { config } from '@/lib/config';

const guideRequestSchema = z.object({
  message: z.string().min(5, 'הודעה קצרה מדי').max(500, 'הודעה ארוכה מדי'),
  honeypot: z.string().max(0, 'Invalid'),
});

const SUPPORT_EMAIL = 'yairbarak22@gmail.com';

let resend: Resend | null = null;
function getResend(): Resend | null {
  if (!resend && config.resendApiKey) {
    resend = new Resend(config.resendApiKey);
  }
  return resend;
}

export async function POST(request: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  // Rate limiting
  const ip = getClientIp(request.headers);
  const ipLimit = await checkRateLimit(`guide-req:ip:${ip}`, RATE_LIMITS.contact);
  if (!ipLimit.success) {
    return NextResponse.json(
      { error: 'נסו שוב מאוחר יותר' },
      { status: 429 }
    );
  }

  const userLimit = await checkRateLimit(`guide-req:user:${userId}`, RATE_LIMITS.contact);
  if (!userLimit.success) {
    return NextResponse.json(
      { error: 'נסו שוב מאוחר יותר' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const parsed = guideRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'נתונים לא תקינים' },
        { status: 400 }
      );
    }

    // Honeypot check
    if (parsed.data.honeypot) {
      return NextResponse.json({ success: true }); // silent fail for bots
    }

    const message = sanitizeInput(parsed.data.message);

    // Spam detection
    if (detectSpam(message, 'guide request').isSpam) {
      return NextResponse.json({ success: true }); // silent fail
    }

    // Send email notification
    const resendClient = getResend();
    if (resendClient) {
      try {
        await resendClient.emails.send({
          from: 'MyNeto <noreply@myneto.co.il>',
          to: SUPPORT_EMAIL,
          subject: `בקשת מדריך חדש מ-${userId}`,
          html: `
            <div dir="rtl" style="font-family: Arial, sans-serif;">
              <h2>בקשת מדריך חדש</h2>
              <p><strong>משתמש:</strong> ${userId}</p>
              <p><strong>בקשה:</strong></p>
              <blockquote style="border-right: 3px solid #69ADFF; padding-right: 12px; color: #333;">
                ${message}
              </blockquote>
            </div>
          `,
        });
      } catch {
        // Email failure shouldn't block the response
      }
    }

    // Audit log
    await logAuditEvent({
      userId: userId!,
      action: AuditAction.UPDATE,
      metadata: {
        type: 'guide_request',
        messageLength: message.length,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'שגיאה בשרת' },
      { status: 500 }
    );
  }
}
