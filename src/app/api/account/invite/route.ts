import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, getOrCreateSharedAccount } from '@/lib/authHelpers';

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
      where: { userId, sharedAccountId, role: 'owner' },
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

    return NextResponse.json({
      ...invite,
      inviteUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/invite/${invite.token}`,
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
      where: { userId, sharedAccountId, role: 'owner' },
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

