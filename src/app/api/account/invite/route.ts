import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { MemberRole } from '@prisma/client';
import { requireAuth, getOrCreateSharedAccount } from '@/lib/authHelpers';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

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

    const inviteUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/invite/${invite.token}`;

    // Get inviter name
    const inviter = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });

    // Send email invitation
    try {
      await resend.emails.send({
        from: 'Finance Manager <onboarding@resend.dev>',
        to: email.toLowerCase(),
        subject: 'הוזמנת לשתף חשבון ב-Finance Manager',
        html: `
          <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #ec4899; margin: 0;">Finance Manager</h1>
              <p style="color: #6b7280; margin-top: 5px;">ניהול פיננסי חכם</p>
            </div>
            
            <div style="background: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
              <h2 style="color: #111827; margin-top: 0;">הוזמנת לשתף חשבון!</h2>
              <p style="color: #4b5563; line-height: 1.6;">
                <strong>${inviter?.name || inviter?.email || 'משתמש'}</strong> מזמין אותך להצטרף לחשבון המשותף שלו ב-Finance Manager.
              </p>
              <p style="color: #4b5563; line-height: 1.6;">
                שיתוף חשבון מאפשר לכם לנהל יחד את התקציב, לעקוב אחרי הוצאות והכנסות, ולצפות במצב הפיננסי המשותף.
              </p>
            </div>
            
            <div style="text-align: center; margin-bottom: 24px;">
              <a href="${inviteUrl}" style="display: inline-block; background: linear-gradient(135deg, #ec4899, #8b5cf6); color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: bold; font-size: 16px;">
                הצטרף לחשבון
              </a>
            </div>
            
            <p style="color: #9ca3af; font-size: 14px; text-align: center;">
              הקישור תקף עד ${new Date(invite.expiresAt).toLocaleDateString('he-IL')}
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">
              אם לא ביקשת הזמנה זו, ניתן להתעלם ממייל זה.
            </p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send invite email:', emailError);
      // Continue even if email fails - user can still copy the link
    }

    return NextResponse.json({
      ...invite,
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

