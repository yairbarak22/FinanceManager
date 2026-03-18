/**
 * Check Account Invite Script
 *
 * Checks whether a shared-account invite exists for a specific
 * inviter/invitee pair.
 *
 * Usage:
 *   npx tsx scripts/check-account-invite.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const INVITER_EMAIL = 'pini6092@gmail.com';
const INVITEE_EMAIL = 'mimweissfish@gmail.com';

async function main() {
  console.log('='.repeat(60));
  console.log('🔍  Account Invite Check');
  console.log('='.repeat(60));
  console.log(`\nInviter: ${INVITER_EMAIL}`);
  console.log(`Invitee: ${INVITEE_EMAIL}\n`);

  const inviter = await prisma.user.findUnique({
    where: { email: INVITER_EMAIL },
    select: { id: true, name: true, email: true },
  });

  if (!inviter) {
    console.log(`❌ Inviter "${INVITER_EMAIL}" not found in database.`);
    return;
  }

  console.log(`✅ Inviter found: ${inviter.name || '(no name)'} (${inviter.id})`);

  const membership = await prisma.sharedAccountMember.findFirst({
    where: { userId: inviter.id },
    select: { sharedAccountId: true, role: true },
  });

  if (!membership) {
    console.log('❌ Inviter has no shared account membership.');
    return;
  }

  console.log(`✅ Shared account: ${membership.sharedAccountId} (role: ${membership.role})\n`);

  const invites = await prisma.accountInvite.findMany({
    where: {
      sharedAccountId: membership.sharedAccountId,
      email: INVITEE_EMAIL.toLowerCase(),
    },
    orderBy: { createdAt: 'desc' },
  });

  if (invites.length === 0) {
    console.log(`❌ No invite found for "${INVITEE_EMAIL}" on this shared account.`);
    console.log('   The invite request may have failed before reaching the DB,');
    console.log('   or the email was entered differently.');

    const allInvites = await prisma.accountInvite.findMany({
      where: { sharedAccountId: membership.sharedAccountId },
      orderBy: { createdAt: 'desc' },
    });

    if (allInvites.length > 0) {
      console.log(`\n📋 All invites for this shared account (${allInvites.length}):`);
      for (const inv of allInvites) {
        const expired = inv.expiresAt < new Date() ? ' [EXPIRED]' : '';
        console.log(`   - ${inv.email} | created: ${inv.createdAt.toISOString()} | expires: ${inv.expiresAt.toISOString()}${expired}`);
      }
    } else {
      console.log('\n📋 No invites at all for this shared account.');
    }
    return;
  }

  console.log(`✅ Found ${invites.length} invite(s) for "${INVITEE_EMAIL}":\n`);
  for (const inv of invites) {
    const expired = inv.expiresAt < new Date();
    console.log(`   ID:        ${inv.id}`);
    console.log(`   Token:     ${inv.token}`);
    console.log(`   Created:   ${inv.createdAt.toISOString()}`);
    console.log(`   Expires:   ${inv.expiresAt.toISOString()} ${expired ? '⚠️  EXPIRED' : '✅ ACTIVE'}`);
    console.log(`   Link:      ${process.env.NEXTAUTH_URL || 'https://www.myneto.co.il'}/invite/${inv.token}`);
    console.log('');
  }
}

main()
  .catch((err) => {
    console.error('Script error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
