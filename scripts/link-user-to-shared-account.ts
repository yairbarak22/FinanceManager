/**
 * One-off: attach a user to another user's shared account (same effect as accepting an invite).
 *
 * Usage (from repo root, with DATABASE_URL in env):
 *   npx tsx scripts/link-user-to-shared-account.ts
 *
 * Requires only DATABASE_URL (no full app config). After running in production,
 * shared-member cache keys `shared:members:<userId>` expire by TTL; sign out/in if needed.
 */

import { PrismaClient, MemberRole } from '@prisma/client';

const prisma = new PrismaClient();

const OWNER_EMAIL = 'pini6092@gmail.com';
const MEMBER_EMAIL = 'mimweissfish@gmail.com';

async function main() {
  const ownerEmail = OWNER_EMAIL.trim().toLowerCase();
  const memberEmail = MEMBER_EMAIL.trim().toLowerCase();

  console.log('Linking shared account:');
  console.log(`  Owner (target shared account): ${ownerEmail}`);
  console.log(`  Member (user to move):         ${memberEmail}\n`);

  const owner = await prisma.user.findUnique({
    where: { email: ownerEmail },
    select: { id: true, name: true },
  });

  if (!owner) {
    console.error(`ERROR: Owner user not found: ${ownerEmail}`);
    process.exit(1);
  }

  const ownerMembership = await prisma.sharedAccountMember.findFirst({
    where: { userId: owner.id },
    select: { sharedAccountId: true, role: true },
  });

  if (!ownerMembership) {
    console.error(`ERROR: Owner has no shared account membership (unexpected): ${ownerEmail}`);
    process.exit(1);
  }

  const targetSharedAccountId = ownerMembership.sharedAccountId;

  const member = await prisma.user.findUnique({
    where: { email: memberEmail },
    select: { id: true, name: true },
  });

  if (!member) {
    console.error(`ERROR: Member user not found: ${memberEmail}`);
    console.error(
      'The member must sign in to the app at least once with Google using this email (so a User row exists). Then re-run this script.'
    );
    process.exit(1);
  }

  if (member.id === owner.id) {
    console.error('ERROR: Owner and member are the same user.');
    process.exit(1);
  }

  const already = await prisma.sharedAccountMember.findFirst({
    where: { userId: member.id, sharedAccountId: targetSharedAccountId },
  });

  if (already) {
    console.log(`OK: ${memberEmail} is already a member of this shared account. Nothing to do.`);
    return;
  }

  const currentMembership = await prisma.sharedAccountMember.findFirst({
    where: { userId: member.id },
    select: { sharedAccountId: true },
  });

  await prisma.$transaction(async (tx) => {
    await tx.sharedAccountMember.deleteMany({
      where: { userId: member.id },
    });

    if (currentMembership) {
      const remaining = await tx.sharedAccountMember.count({
        where: { sharedAccountId: currentMembership.sharedAccountId },
      });

      if (remaining === 0) {
        await tx.accountInvite.deleteMany({
          where: { sharedAccountId: currentMembership.sharedAccountId },
        });
        await tx.sharedAccount.delete({
          where: { id: currentMembership.sharedAccountId },
        });
      }
    }

    await tx.sharedAccountMember.create({
      data: {
        userId: member.id,
        sharedAccountId: targetSharedAccountId,
        role: MemberRole.MEMBER,
      },
    });
  });

  console.log('Done.');
  console.log(`  ${memberEmail} joined shared account ${targetSharedAccountId} (owner: ${ownerEmail}).`);
  console.log(
    '\nNote: Redis cache keys shared:members:* may be stale briefly; users can refresh or re-login.'
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
