/**
 * One-time script: Send the shared-account invite email
 * that mimweissfish@gmail.com never received.
 *
 * Usage:
 *   npx tsx scripts/send-account-invite-email.ts
 */

import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
if (!RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY not set. Load .env.local first.');
  process.exit(1);
}

const resend = new Resend(RESEND_API_KEY);

const TO = 'mimweissfish@gmail.com';
const INVITER_NAME = 'פיני שבקס';
const TOKEN = 'cmmtr5xyq000hdkuqfn0uxsqz';
const INVITE_URL = `https://www.myneto.co.il/invite/${TOKEN}`;
const EXPIRES_LABEL = new Date('2026-03-23T22:26:07.537Z').toLocaleDateString('he-IL');
const YEAR = new Date().getFullYear();

async function main() {
  console.log(`📧 Sending invite email to ${TO}...`);
  console.log(`   From: MyNeto <invite@myneto.co.il>`);
  console.log(`   Invite link: ${INVITE_URL}\n`);

  const { data, error } = await resend.emails.send({
    from: 'MyNeto <invite@myneto.co.il>',
    to: TO,
    subject: 'הוזמנת לשתף חשבון ב-MyNeto',
    html: `
      <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 16px; overflow: hidden;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #8b5cf6 100%); padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 36px; font-weight: 800; letter-spacing: -1px;">MyNeto</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">ניהול הון חכם</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 32px;">
          <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <h2 style="color: #f1f5f9; margin: 0 0 16px 0; font-size: 20px;">🎉 הוזמנת לשתף חשבון!</h2>
            <p style="color: #94a3b8; line-height: 1.7; margin: 0 0 12px 0;">
              <strong style="color: #e2e8f0;">${INVITER_NAME}</strong> מזמין אותך להצטרף לחשבון המשותף שלו ב-MyNeto.
            </p>
            <p style="color: #94a3b8; line-height: 1.7; margin: 0;">
              שיתוף חשבון מאפשר לכם לנהל יחד את התקציב, לעקוב אחרי הוצאות והכנסות, ולצפות במצב הפיננסי המשותף.
            </p>
          </div>
          
          <!-- CTA Button -->
          <div style="text-align: center; margin-bottom: 24px;">
            <a href="${INVITE_URL}" style="display: inline-block; background: linear-gradient(135deg, #06b6d4, #3b82f6); color: white; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);">
              הצטרף לחשבון
            </a>
          </div>
          
          <p style="color: #64748b; font-size: 13px; text-align: center; margin: 0;">
            הקישור תקף עד ${EXPIRES_LABEL}
          </p>
        </div>
        
        <!-- Footer -->
        <div style="background: rgba(0,0,0,0.2); padding: 20px; text-align: center; border-top: 1px solid rgba(255,255,255,0.05);">
          <p style="color: #64748b; font-size: 12px; margin: 0;">
            אם לא ביקשת הזמנה זו, ניתן להתעלם ממייל זה.
          </p>
          <p style="color: #475569; font-size: 11px; margin: 12px 0 0 0;">
            © ${YEAR} MyNeto - ניהול הון חכם
          </p>
        </div>
      </div>
    `,
  });

  if (error) {
    console.error('❌ Failed to send:', error);
    process.exit(1);
  }

  console.log('✅ Email sent successfully!');
  console.log(`   Resend ID: ${data?.id}`);
}

main().catch((err) => {
  console.error('Script error:', err);
  process.exit(1);
});
