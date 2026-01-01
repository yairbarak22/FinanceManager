import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { MemberRole } from '@prisma/client';
import { requireAuth, getOrCreateSharedAccount } from '@/lib/authHelpers';
import { config } from '@/lib/config';
import { Resend } from 'resend';

// Lazy initialization to avoid build-time errors when API key is not set
let resend: Resend | null = null;
function getResend(): Resend | null {
  if (!resend && config.resendApiKey) {
    resend = new Resend(config.resendApiKey);
  }
  return resend;
}

// GET - Get all invites for the user's shared account
export async function GET() {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const sharedAccountId = await getOrCreateSharedAccount(userId);

    // Get all pending invites
    const invites = await prisma.accountInvite.findMany({
      where: {
        sharedAccountId,
        expiresAt: { gt: new Date() }, // Only active invites
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(invites);
  } catch (error) {
    console.error('Error fetching invites:', error);
    return NextResponse.json({ error: 'Failed to fetch invites' }, { status: 500 });
  }
}

// POST - Create a new invite
export async function POST(request: Request) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const { email } = await request.json();

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const sharedAccountId = await getOrCreateSharedAccount(userId);

    // Check if user is owner
    const membership = await prisma.sharedAccountMember.findFirst({
      where: { userId, sharedAccountId, role: MemberRole.OWNER },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Only owners can invite members' }, { status: 403 });
    }

    // Check if email is already a member
    const existingMember = await prisma.user.findFirst({
      where: { email },
      include: {
        sharedAccountMembers: {
          where: { sharedAccountId },
        },
      },
    });

    if (existingMember?.sharedAccountMembers.length) {
      return NextResponse.json({ error: 'User is already a member' }, { status: 400 });
    }

    // Check for existing invite
    const existingInvite = await prisma.accountInvite.findFirst({
      where: {
        sharedAccountId,
        email,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvite) {
      return NextResponse.json({ error: 'Invite already exists for this email' }, { status: 400 });
    }

    // Create invite (expires in 7 days)
    const invite = await prisma.accountInvite.create({
      data: {
        sharedAccountId,
        email: email.toLowerCase(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const inviteUrl = `${config.nextAuthUrl}/invite/${invite.token}`;

    // Get inviter name
    const inviter = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });

    // Send email invitation
    const resendClient = getResend();
    try {
      if (resendClient) {
        await resendClient.emails.send({
        from: 'NETO <onboarding@resend.dev>',
        to: email.toLowerCase(),
        subject: 'הוזמנת לשתף חשבון ב-NETO',
        html: `
          <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 16px; overflow: hidden;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #8b5cf6 100%); padding: 32px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 36px; font-weight: 800; letter-spacing: -1px;">NETO</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">ניהול הון חכם</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 32px;">
              <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <h2 style="color: #f1f5f9; margin: 0 0 16px 0; font-size: 20px;">🎉 הוזמנת לשתף חשבון!</h2>
                <p style="color: #94a3b8; line-height: 1.7; margin: 0 0 12px 0;">
                  <strong style="color: #e2e8f0;">${inviter?.name || inviter?.email || 'משתמש'}</strong> מזמין אותך להצטרף לחשבון המשותף שלו ב-NETO.
                </p>
                <p style="color: #94a3b8; line-height: 1.7; margin: 0;">
                  שיתוף חשבון מאפשר לכם לנהל יחד את התקציב, לעקוב אחרי הוצאות והכנסות, ולצפות במצב הפיננסי המשותף.
                </p>
              </div>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin-bottom: 24px;">
                <a href="${inviteUrl}" style="display: inline-block; background: linear-gradient(135deg, #06b6d4, #3b82f6); color: white; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);">
                  הצטרף לחשבון
                </a>
              </div>
              
              <p style="color: #64748b; font-size: 13px; text-align: center; margin: 0;">
                הקישור תקף עד ${new Date(invite.expiresAt).toLocaleDateString('he-IL')}
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
      }
    } catch (emailError) {
      console.error('Failed to send invite email:', emailError);
      // Continue even if email fails - user can still copy the link
    }

    // Return invite data including token (needed for copy link functionality)
    // Note: token is already exposed via inviteUrl, so including it separately is not a security issue
    return NextResponse.json({
      id: invite.id,
      sharedAccountId: invite.sharedAccountId,
      email: invite.email,
      token: invite.token,  // Needed for copyInviteLink in frontend
      expiresAt: invite.expiresAt,
      createdAt: invite.createdAt,
      inviteUrl,
    });
  } catch (error) {
    console.error('Error creating invite:', error);
    return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 });
  }
}

// DELETE - Delete an invite
export async function DELETE(request: Request) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const inviteId = searchParams.get('id');

    if (!inviteId) {
      return NextResponse.json({ error: 'Invite ID required' }, { status: 400 });
    }

    const sharedAccountId = await getOrCreateSharedAccount(userId);

    // Check if user is owner
    const membership = await prisma.sharedAccountMember.findFirst({
      where: { userId, sharedAccountId, role: MemberRole.OWNER },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Only owners can delete invites' }, { status: 403 });
    }

    // Delete the invite
    await prisma.accountInvite.deleteMany({
      where: { id: inviteId, sharedAccountId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting invite:', error);
    return NextResponse.json({ error: 'Failed to delete invite' }, { status: 500 });
  }
}

