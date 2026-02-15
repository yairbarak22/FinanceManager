/**
 * Calculator Invite Email Template
 * Sends invitation emails using Resend
 */

import { Resend } from 'resend';
import { config } from '../config';

// Lazy initialization to avoid build-time errors when API key is not set
let resend: Resend | null = null;

function getResend(): Resend | null {
  if (!resend && config.resendApiKey) {
    resend = new Resend(config.resendApiKey);
  }
  return resend;
}

interface SendInviteEmailParams {
  to: string;
  inviterName: string;
  inviteToken: string;
}

/**
 * Send calculator invite email
 */
export async function sendCalculatorInviteEmail(params: SendInviteEmailParams): Promise<boolean> {
  const resendClient = getResend();
  
  if (!resendClient) {
    console.warn('[CalculatorInvite] Resend API key not configured, skipping email');
    return false;
  }

  const { to, inviterName, inviteToken } = params;
  const inviteUrl = `${config.nextAuthUrl}/?source=invite&ref=${inviteToken}`;

  try {
    await resendClient.emails.send({
      from: 'NETO <invite@myneto.co.il>',
      to: to.toLowerCase(),
      subject: `${inviterName} מזמין אותך ל-NETO`,
      html: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 16px; overflow: hidden;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #0DBACC 0%, #69ADFF 50%, #9F7FE0 100%); padding: 32px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 36px; font-weight: 800; letter-spacing: -1px;">NETO</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">ניהול הון חכם</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 32px;">
            <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
              <h2 style="color: #f1f5f9; margin: 0 0 16px 0; font-size: 20px;">🎉 הוזמנת ל-NETO!</h2>
              <p style="color: #94a3b8; line-height: 1.7; margin: 0 0 12px 0;">
                <strong style="color: #e2e8f0;">${inviterName}</strong> חושב שתאהב את NETO - הפלטפורמה החכמה לניהול הפיננסים שלך.
              </p>
              <p style="color: #94a3b8; line-height: 1.7; margin: 0;">
                עם NETO תוכל לעקוב אחרי ההוצאות וההכנסות שלך, לתכנן את העתיד הפיננסי, ולקבל תמונה ברורה של המצב הכלכלי שלך.
              </p>
            </div>
            
            <!-- Features -->
            <div style="margin-bottom: 24px;">
              <div style="display: flex; align-items: center; margin-bottom: 12px;">
                <span style="color: #0DBACC; margin-left: 8px;">✓</span>
                <span style="color: #e2e8f0;">מעקב הוצאות והכנסות חכם</span>
              </div>
              <div style="display: flex; align-items: center; margin-bottom: 12px;">
                <span style="color: #0DBACC; margin-left: 8px;">✓</span>
                <span style="color: #e2e8f0;">מחשבונים פיננסיים מתקדמים</span>
              </div>
              <div style="display: flex; align-items: center; margin-bottom: 12px;">
                <span style="color: #0DBACC; margin-left: 8px;">✓</span>
                <span style="color: #e2e8f0;">ניהול תיק השקעות</span>
              </div>
            </div>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin-bottom: 24px;">
              <a href="${inviteUrl}" style="display: inline-block; background: linear-gradient(135deg, #0DBACC, #69ADFF); color: white; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(13, 186, 204, 0.4);">
                הצטרף בחינם
              </a>
            </div>
            
            <p style="color: #64748b; font-size: 13px; text-align: center; margin: 0;">
              ההרשמה לוקחת פחות מדקה 🚀
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background: rgba(0,0,0,0.2); padding: 20px; text-align: center; border-top: 1px solid rgba(255,255,255,0.05);">
            <p style="color: #64748b; font-size: 12px; margin: 0;">
              אם לא ביקשת הזמנה זו, ניתן להתעלם ממייל זה.
            </p>
            <p style="color: #475569; font-size: 11px; margin: 12px 0 0 0;">
              © ${new Date().getFullYear()} NETO - ניהול הון חכם
            </p>
          </div>
        </div>
      `,
    });

    console.log(`[CalculatorInvite] Email sent successfully to ${to}`);
    return true;
  } catch (error) {
    console.error('[CalculatorInvite] Failed to send email:', error);
    return false;
  }
}

