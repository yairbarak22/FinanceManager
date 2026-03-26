/**
 * Investment Guide Email API Route
 * Sends a styled guide email to the user from invest@myneto.co.il
 *
 * Security measures:
 * 1. Authentication required
 * 2. IP-based rate limiting (5/min)
 * 3. User-based rate limiting (3/hour - strict, sends email to user)
 * 4. Consistent response times (timing attack prevention)
 * 5. Input sanitization
 * 6. Email notification via Resend
 */

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { Resend } from 'resend';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rateLimit';
import { escapeHtml } from '@/lib/contactValidation';
import { config } from '@/lib/config';

// Minimum processing time to prevent timing attacks (ms)
const MIN_RESPONSE_TIME = 500;

// User rate limit uses the guideUser preset from RATE_LIMITS (3 per hour)

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

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const clientIp = getClientIp(request.headers);

  try {
    // =========================================================================
    // 1. Check IP-based rate limit
    // =========================================================================
    const ipLimit = await checkRateLimit(
      `invest-guide:ip:${clientIp}`,
      RATE_LIMITS.contact
    );

    if (!ipLimit.success) {
      const retryAfter = Math.ceil((ipLimit.resetTime - Date.now()) / 1000);
      console.warn('[InvestmentGuide] IP rate limited:', { ip: clientIp });
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
    // 2. Require authentication
    // =========================================================================
    const token = await getToken({
      req: request,
      secret: config.nextAuthSecret,
    });

    if (!token?.email) {
      await delayUntil(startTime, MIN_RESPONSE_TIME);
      return NextResponse.json(
        { error: 'נא להתחבר כדי לקבל את המדריך' },
        { status: 401 }
      );
    }

    const userId = token.sub!;
    const userEmail = token.email as string;
    const userName = (token.name as string) || '';

    // =========================================================================
    // 3. Check user-based rate limit (strict: 3 per hour)
    // =========================================================================
    const userLimit = await checkRateLimit(
      `invest-guide:user:${userId}`,
      RATE_LIMITS.guideUser
    );

    if (!userLimit.success) {
      const retryAfter = Math.ceil((userLimit.resetTime - Date.now()) / 1000);
      console.warn('[InvestmentGuide] User rate limited:', { userId });
      await delayUntil(startTime, MIN_RESPONSE_TIME);
      return NextResponse.json(
        { error: 'המדריך כבר נשלח אליך. בדוק את תיבת המייל שלך.' },
        {
          status: 429,
          headers: { 'Retry-After': String(retryAfter) },
        }
      );
    }

    // =========================================================================
    // 4. Send email via Resend
    // =========================================================================
    const resendClient = getResend();
    if (!resendClient) {
      console.warn('[InvestmentGuide] Resend not configured');
      await delayUntil(startTime, MIN_RESPONSE_TIME);
      return NextResponse.json(
        { error: 'שירות המייל אינו זמין כרגע' },
        { status: 503 }
      );
    }

    const safeUserName = escapeHtml(userName);
    const greeting = safeUserName ? `שלום ${safeUserName},` : 'שלום,';

    await resendClient.emails.send({
      from: 'MyNeto Investments <invest@myneto.co.il>',
      to: userEmail.toLowerCase(),
      replyTo: 'invest@myneto.co.il',
      subject: 'מדריך מפורט לפתיחת תיק מסחר - MyNeto',
      html: `
        <div dir="rtl" style="font-family: 'Nunito', 'Segoe UI', Tahoma, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #F5F5F7; border-radius: 24px; overflow: hidden;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #0DBACC, #69ADFF); padding: 40px 32px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -1px;">MyNeto</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 12px 0 0 0; font-size: 16px; font-weight: 600;">מדריך מפורט לפתיחת תיק מסחר</p>
          </div>

          <!-- Content -->
          <div style="padding: 32px;">
            <!-- Greeting -->
            <div style="background: #FFFFFF; border-radius: 24px; padding: 28px; margin-bottom: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
              <h2 style="color: #303150; margin: 0 0 16px 0; font-size: 20px; font-weight: 700;">${greeting}</h2>
              <p style="color: #7E7F90; line-height: 1.8; margin: 0 0 16px 0; font-size: 15px;">
                תודה שבחרת להתחיל את המסע להשקעה חכמה עם MyNeto!
              </p>
              <p style="color: #7E7F90; line-height: 1.8; margin: 0; font-size: 15px;">
                כדי שנוכל לבנות עבורך מדריך מותאם אישית לפתיחת תיק מסחר, חשוב קודם כל להשלים את השלבים הבסיסיים במערכת.
              </p>
            </div>

            <!-- Steps -->
            <div style="background: #FFFFFF; border-radius: 24px; padding: 28px; margin-bottom: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
              <h3 style="color: #303150; margin: 0 0 20px 0; font-size: 16px; font-weight: 700;">מה צריך לעשות?</h3>
              
              <div style="margin-bottom: 16px; display: flex; align-items: flex-start;">
                <div style="width: 28px; height: 28px; background: #0DBACC; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-left: 12px; flex-shrink: 0;">
                  <span style="color: white; font-size: 13px; font-weight: 700;">1</span>
                </div>
                <div>
                  <p style="color: #303150; font-size: 14px; font-weight: 600; margin: 0 0 4px 0;">מיפוי נכסים והתחייבויות</p>
                  <p style="color: #7E7F90; font-size: 13px; margin: 0; line-height: 1.6;">הזינו את כל הנכסים שלכם (חסכונות, דירה, רכב) ואת ההתחייבויות (הלוואות, משכנתא).</p>
                </div>
              </div>

              <div style="margin-bottom: 16px; display: flex; align-items: flex-start;">
                <div style="width: 28px; height: 28px; background: #69ADFF; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-left: 12px; flex-shrink: 0;">
                  <span style="color: white; font-size: 13px; font-weight: 700;">2</span>
                </div>
                <div>
                  <p style="color: #303150; font-size: 14px; font-weight: 600; margin: 0 0 4px 0;">מיפוי הכנסות</p>
                  <p style="color: #7E7F90; font-size: 13px; margin: 0; line-height: 1.6;">הזינו את כל מקורות ההכנסה שלכם – משכורת, עבודה עצמאית, הכנסות פסיביות.</p>
                </div>
              </div>

              <div style="display: flex; align-items: flex-start;">
                <div style="width: 28px; height: 28px; background: #0DBACC; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-left: 12px; flex-shrink: 0;">
                  <span style="color: white; font-size: 13px; font-weight: 700;">3</span>
                </div>
                <div>
                  <p style="color: #303150; font-size: 14px; font-weight: 600; margin: 0 0 4px 0;">מיפוי הוצאות</p>
                  <p style="color: #7E7F90; font-size: 13px; margin: 0; line-height: 1.6;">הזינו את ההוצאות הקבועות והמשתנות שלכם כדי שנדע כמה ניתן להקצות להשקעה.</p>
                </div>
              </div>
            </div>

            <!-- Timeline -->
            <div style="background: #FFFFFF; border-radius: 24px; padding: 28px; margin-bottom: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
              <div style="display: flex; align-items: center; margin-bottom: 12px;">
                <span style="font-size: 24px; margin-left: 12px;">📅</span>
                <h3 style="color: #303150; margin: 0; font-size: 16px; font-weight: 700;">מה הלאה?</h3>
              </div>
              <p style="color: #7E7F90; line-height: 1.8; margin: 0; font-size: 15px;">
                לאחר השלמת השלבים, 
                <strong style="color: #303150;">בעוד 7 ימים</strong> 
                יישלח אליך מדריך מלא ומפורט לפתיחת תיק מסחר, מותאם אישית למצב הפיננסי שלך.
              </p>
            </div>

            <!-- Support -->
            <div style="background: linear-gradient(135deg, #0DBACC, #69ADFF); border-radius: 24px; padding: 28px; text-align: center;">
              <h3 style="color: white; margin: 0 0 12px 0; font-size: 16px; font-weight: 700;">יש שאלות?</h3>
              <p style="color: rgba(255,255,255,0.9); line-height: 1.8; margin: 0; font-size: 14px;">
                לכל שאלה, פשוט לחצו על <strong>&quot;השב&quot;</strong> והשיבו למייל הזה. 
                <br />נחזור אליכם בהקדם האפשרי.
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div style="padding: 24px; text-align: center; border-top: 1px solid #F7F7F8;">
            <p style="color: #7E7F90; font-size: 12px; margin: 0 0 8px 0;">
              המייל נשלח מ-MyNeto – פלטפורמה לניהול הון חכם
            </p>
            <p style="color: #BDBDCB; font-size: 11px; margin: 0;">
              &copy; ${new Date().getFullYear()} MyNeto - ניהול הון חכם
            </p>
          </div>
        </div>
      `,
    });

    console.log(`[InvestmentGuide] Guide email sent to ${userEmail}`, {
      userId,
      ip: clientIp,
    });

    // =========================================================================
    // 5. Return success response with consistent timing
    // =========================================================================
    await delayUntil(startTime, MIN_RESPONSE_TIME + 200);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[InvestmentGuide] Server error:', error);
    await delayUntil(startTime, MIN_RESPONSE_TIME);
    return NextResponse.json(
      { error: 'שגיאה בשליחת המדריך. נסו שוב מאוחר יותר.' },
      { status: 500 }
    );
  }
}
