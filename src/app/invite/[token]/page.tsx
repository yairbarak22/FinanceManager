import { prisma } from '@/lib/prisma';
import { MemberRole } from '@prisma/client';
import InviteClient from './InviteClient';

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;

  let inviteStatus: 'valid' | 'expired' | 'not_found' = 'not_found';
  let inviterName = '';

  try {
    const invite = await prisma.accountInvite.findUnique({
      where: { token },
      select: {
        expiresAt: true,
        sharedAccount: {
          select: {
            members: {
              where: { role: MemberRole.OWNER },
              select: { user: { select: { name: true } } },
              take: 1,
            },
          },
        },
      },
    });

    if (!invite) {
      inviteStatus = 'not_found';
    } else if (invite.expiresAt < new Date()) {
      inviteStatus = 'expired';
    } else {
      inviteStatus = 'valid';
      inviterName = invite.sharedAccount.members[0]?.user?.name ?? 'משתמש';
    }
  } catch (error) {
    console.error('Error loading invite:', error);
    inviteStatus = 'not_found';
  }

  return (
    <InviteClient
      inviteStatus={inviteStatus}
      inviterName={inviterName}
      token={token}
    />
  );
}
