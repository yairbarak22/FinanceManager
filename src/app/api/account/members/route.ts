import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, getOrCreateSharedAccount } from '@/lib/authHelpers';

// GET - Get all members of the shared account
export async function GET() {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const sharedAccountId = await getOrCreateSharedAccount(userId);

    const sharedAccount = await prisma.sharedAccount.findUnique({
      where: { id: sharedAccountId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
      },
    });

    if (!sharedAccount) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    return NextResponse.json({
      accountId: sharedAccount.id,
      accountName: sharedAccount.name,
      members: sharedAccount.members.map((m) => ({
        id: m.id,
        userId: m.userId,
        role: m.role,
        joinedAt: m.joinedAt,
        user: m.user,
      })),
    });
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }
}

// DELETE - Remove a member from the shared account
export async function DELETE(request: Request) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');

    if (!memberId) {
      return NextResponse.json({ error: 'Member ID required' }, { status: 400 });
    }

    const sharedAccountId = await getOrCreateSharedAccount(userId);

    // Check if user is owner
    const ownerMembership = await prisma.sharedAccountMember.findFirst({
      where: { userId, sharedAccountId, role: 'owner' },
    });

    if (!ownerMembership) {
      return NextResponse.json({ error: 'Only owners can remove members' }, { status: 403 });
    }

    // Get the member to be removed
    const memberToRemove = await prisma.sharedAccountMember.findUnique({
      where: { id: memberId },
    });

    if (!memberToRemove || memberToRemove.sharedAccountId !== sharedAccountId) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Can't remove the owner
    if (memberToRemove.role === 'owner') {
      return NextResponse.json({ error: 'Cannot remove account owner' }, { status: 400 });
    }

    // Remove the member
    await prisma.sharedAccountMember.delete({
      where: { id: memberId },
    });

    // Create a new shared account for the removed user
    await prisma.sharedAccount.create({
      data: {
        name: 'החשבון שלי',
        members: {
          create: {
            userId: memberToRemove.userId,
            role: 'owner',
          },
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing member:', error);
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
  }
}

