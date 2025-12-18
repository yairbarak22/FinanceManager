import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/authHelpers';

// POST - Accept an invite
export async function POST(request: Request) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    // Find the invite
    const invite = await prisma.accountInvite.findUnique({
      where: { token },
      include: { sharedAccount: true },
    });

    if (!invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    if (invite.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invite has expired' }, { status: 400 });
    }

    // Check if user's email matches the invite
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
      return NextResponse.json(
        { error: 'This invite is for a different email address' },
        { status: 403 }
      );
    }

    // Check if already a member
    const existingMembership = await prisma.sharedAccountMember.findFirst({
      where: { userId, sharedAccountId: invite.sharedAccountId },
    });

    if (existingMembership) {
      return NextResponse.json({ error: 'Already a member of this account' }, { status: 400 });
    }

    // Remove user from their current shared account (if they have one)
    await prisma.sharedAccountMember.deleteMany({
      where: { userId },
    });

    // Add user to the invited shared account
    await prisma.sharedAccountMember.create({
      data: {
        userId,
        sharedAccountId: invite.sharedAccountId,
        role: 'member',
      },
    });

    // Delete the used invite
    await prisma.accountInvite.delete({
      where: { id: invite.id },
    });

    return NextResponse.json({
      success: true,
      sharedAccountName: invite.sharedAccount.name,
    });
  } catch (error) {
    console.error('Error accepting invite:', error);
    return NextResponse.json({ error: 'Failed to accept invite' }, { status: 500 });
  }
}

