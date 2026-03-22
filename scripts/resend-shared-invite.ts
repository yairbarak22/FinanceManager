/**
 * Replace an existing pending invite with a new token and resend the email.
 * Use when the invitee needs a fresh link / login flow.
 *
 * Invite links in the email use (first non-empty wins):
 *   1. INVITE_PUBLIC_URL — set this when NEXTAUTH_URL is localhost but DB is production
 *   2. NEXT_PUBLIC_APP_URL — usually the real site in .env
 *   3. NEXTAUTH_URL — fallback (often http://localhost:3000 in dev; avoid for real emails)
 *
 * Usage:
 *   INVITE_PUBLIC_URL="https://www.myneto.co.il" npx tsx --env-file=.env.local scripts/resend-shared-invite.ts
 *
 * Requires: DATABASE_URL, RESEND_API_KEY, and at least one base URL above.
 */

import { PrismaClient } from '@prisma/client';
import { Resend } from 'resend';

const prisma = new PrismaClient();

const OWNER_EMAIL = 'pini6092@gmail.com';
const INVITEE_EMAIL = 'mimweissfish@gmail.com';

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

/**
 * Public URL for links inside emails (must NOT be localhost when sending to real users).
 */
function resolveInvitePublicBaseUrl(): string {
  const raw =
    process.env.INVITE_PUBLIC_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim();
  if (!raw) {
    throw new Error(
      'Set one of: INVITE_PUBLIC_URL, NEXT_PUBLIC_APP_URL, or NEXTAUTH_URL (for invite links in email)'
    );
  }
  return stripTrailingSlash(raw);
}

function isLocalhostUrl(url: string): boolean {
  try {
    const h = new URL(url).hostname;
    return h === 'localhost' || h === '127.0.0.1' || h === '[::1]';
  } catch {
    return false;
  }
}

function buildInviteHtml(inviterName: string, inviteUrl: string, expiresAt: Date): string {
  const year = new Date().getFullYear();
  const expiresLabel = expiresAt.toLocaleDateString('he-IL');
  return `
      <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #8b5cf6 100%); padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 36px; font-weight: 800; letter-spacing: -1px;">MyNeto</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">ניהול הון חכם</p>
        </div>
        <div style="padding: 32px;">
          <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <h2 style="color: #f1f5f9; margin: 0 0 16px 0; font-size: 20px;">הוזמנת לשתף חשבון!</h2>
            <p style="color: #94a3b8; line-height: 1.7; margin: 0 0 12px 0;">
              <strong style="color: #e2e8f0;">${inviterName}</strong> מזמין אותך להצטרף לחשבון המשותף שלו ב-MyNeto.
            </p>
            <p style="color: #94a3b8; line-height: 1.7; margin: 0;">
              שיתוף חשבון מאפשר לכם לנהל יחד את התקציב, לעקוב אחרי הוצאות והכנסות, ולצפות במצב הפיננסי המשותף.
            </p>
          </div>
          <div style="text-align: center; margin-bottom: 24px;">
            <a href="${inviteUrl}" style="display: inline-block; background: linear-gradient(135deg, #06b6d4, #3b82f6); color: white; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);">
              הצטרף לחשבון
            </a>
          </div>
          <p style="color: #64748b; font-size: 13px; text-align: center; margin: 0;">
            הקישור תקף עד ${expiresLabel}
          </p>
        </div>
        <div style="background: rgba(0,0,0,0.2); padding: 20px; text-align: center; border-top: 1px solid rgba(255,255,255,0.05);">
          <p style="color: #64748b; font-size: 12px; margin: 0;">
            אם לא ביקשת הזמנה זו, ניתן להתעלם ממייל זה.
          </p>
          <p style="color: #475569; font-size: 11px; margin: 12px 0 0 0;">
            © ${year} MyNeto - ניהול הון חכם
          </p>
        </div>
      </div>
    `;
}

async function main() {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.error('RESEND_API_KEY is required');
    process.exit(1);
  }

  let publicBaseUrl: string;
  try {
    publicBaseUrl = resolveInvitePublicBaseUrl();
  } catch (e) {
    console.error((e as Error).message);
    process.exit(1);
  }

  if (isLocalhostUrl(publicBaseUrl) && process.env.ALLOW_LOCALHOST_INVITE_EMAIL !== '1') {
    console.error(
      'Refusing to send invite email with a localhost link (recipients cannot open it).\n' +
        'Fix: run with INVITE_PUBLIC_URL="https://www.myneto.co.il" (your real domain)\n' +
        '     or set NEXT_PUBLIC_APP_URL to the production URL in .env.local\n' +
        'Override (dev only): ALLOW_LOCALHOST_INVITE_EMAIL=1'
    );
    process.exit(1);
  }

  const source =
    process.env.INVITE_PUBLIC_URL?.trim()
      ? 'INVITE_PUBLIC_URL'
      : process.env.NEXT_PUBLIC_APP_URL?.trim()
        ? 'NEXT_PUBLIC_APP_URL'
        : 'NEXTAUTH_URL';
  console.log(`Using invite link base (${source}): ${publicBaseUrl}\n`);

  const ownerEmail = OWNER_EMAIL.trim().toLowerCase();
  const inviteeEmail = INVITEE_EMAIL.trim().toLowerCase();

  const owner = await prisma.user.findUnique({
    where: { email: ownerEmail },
    select: { id: true, name: true, email: true },
  });
  if (!owner) {
    console.error(`Owner not found: ${ownerEmail}`);
    process.exit(1);
  }

  const membership = await prisma.sharedAccountMember.findFirst({
    where: { userId: owner.id },
    select: { sharedAccountId: true },
  });
  if (!membership) {
    console.error('Owner has no shared account');
    process.exit(1);
  }

  const sharedAccountId = membership.sharedAccountId;

  const deleted = await prisma.accountInvite.deleteMany({
    where: { sharedAccountId, email: inviteeEmail },
  });
  console.log(`Removed ${deleted.count} previous invite(s) for ${inviteeEmail}`);

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const invite = await prisma.accountInvite.create({
    data: {
      sharedAccountId,
      email: inviteeEmail,
      expiresAt,
    },
  });

  const inviteUrl = `${publicBaseUrl}/invite/${invite.token}`;
  const inviterName = owner.name || owner.email || 'משתמש';

  const resend = new Resend(resendKey);
  const { data, error } = await resend.emails.send({
    from: 'MyNeto <invite@myneto.co.il>',
    to: inviteeEmail,
    subject: 'הוזמנת לשתף חשבון ב-MyNeto',
    html: buildInviteHtml(inviterName, inviteUrl, expiresAt),
  });

  if (error) {
    console.error('Resend error:', error);
    console.log('Invite was created in DB. Link:', inviteUrl);
    process.exit(1);
  }

  console.log('Done.');
  console.log(`  New invite id: ${invite.id}`);
  console.log(`  Link: ${inviteUrl}`);
  console.log(`  Resend message id: ${data?.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
