import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { MemberRole } from '@prisma/client';
import { requireAuth, getOrCreateSharedAccount, invalidateSharedMembersCache } from '@/lib/authHelpers';
import { logAuditEvent, AuditAction, getRequestInfo } from '@/lib/auditLog';

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
      currentUserId: userId, // Include current user ID for permission checks
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
      where: { userId, sharedAccountId, role: MemberRole.OWNER },
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
    if (memberToRemove.role === MemberRole.OWNER) {
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
            role: MemberRole.OWNER,
          },
        },
      },
    });

    // Invalidate cache for all members of the shared account
    // (their shared members list has changed)
    const remainingMembers = await prisma.sharedAccountMember.findMany({
      where: { sharedAccountId },
      select: { userId: true },
    });
    await Promise.all(
      remainingMembers.map((m) => invalidateSharedMembersCache(m.userId))
    );
    // Also invalidate for the removed user
    await invalidateSharedMembersCache(memberToRemove.userId);

    // Audit log: member removed
    const { ipAddress, userAgent } = getRequestInfo(request.headers);
    void logAuditEvent({
      userId,
      action: AuditAction.MEMBER_REMOVED,
      entityType: 'SharedAccountMember',
      entityId: memberId,
      metadata: {
        removedUserId: memberToRemove.userId,
        sharedAccountId,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing member:', error);
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
  }
}

