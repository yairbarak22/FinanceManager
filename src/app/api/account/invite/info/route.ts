import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { MemberRole } from '@prisma/client';

/**
 * GET /api/account/invite/info?token=xxx
 *
 * Public endpoint (no auth required).
 * Returns minimal, non-sensitive info about an invite so the
 * invite landing page can render before the user signs in.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ status: 'not_found' }, { status: 400 });
    }

    const invite = await prisma.accountInvite.findUnique({
      where: { token },
      select: {
        expiresAt: true,
        sharedAccount: {
          select: {
            members: {
              where: { role: MemberRole.OWNER },
              select: {
                user: { select: { name: true } },
              },
              take: 1,
            },
          },
        },
      },
    });

    if (!invite) {
      return NextResponse.json({ status: 'not_found' });
    }

    if (invite.expiresAt < new Date()) {
      return NextResponse.json({ status: 'expired' });
    }

    const ownerName =
      invite.sharedAccount.members[0]?.user?.name ?? 'משתמש';

    return NextResponse.json({
      status: 'valid',
      inviterName: ownerName,
    });
  } catch (error) {
    console.error('Error fetching invite info:', error);
    return NextResponse.json(
      { status: 'error' },
      { status: 500 },
    );
  }
}
