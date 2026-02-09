/**
 * Delete User Script
 * 
 * Safely deletes a specific user and ALL related data from the database.
 * Also cleans up documents from Vercel Blob storage.
 * 
 * Safety features:
 * - Hardcoded email to prevent accidental deletion of wrong user
 * - Prints a full summary of data to be deleted before proceeding
 * - Handles Vercel Blob document cleanup
 * - Handles SharedAccount membership cleanup
 * - All other related data is deleted automatically via onDelete: Cascade
 * 
 * Usage:
 *   npx tsx scripts/delete-user.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================
// SAFETY: Hardcoded email — change this to the user you want to delete
// ============================================================
const TARGET_EMAIL = 'oran8585@gmail.com';

async function main() {
  console.log('='.repeat(60));
  console.log('🗑️  User Deletion Script');
  console.log('='.repeat(60));
  console.log(`\nTarget email: ${TARGET_EMAIL}\n`);

  // ── Step 1: Find the user ──────────────────────────────────
  const user = await prisma.user.findUnique({
    where: { email: TARGET_EMAIL },
    select: {
      id: true,
      name: true,
      email: true,
      signupSource: true,
      hasSeenOnboarding: true,
      createdAt: true,
    },
  });

  if (!user) {
    console.log('❌ User not found. Nothing to delete.');
    return;
  }

  console.log('👤 User found:');
  console.log(`   ID:              ${user.id}`);
  console.log(`   Name:            ${user.name ?? '(none)'}`);
  console.log(`   Email:           ${user.email}`);
  console.log(`   Signup Source:    ${user.signupSource ?? '(none)'}`);
  console.log(`   Onboarding seen: ${user.hasSeenOnboarding}`);
  console.log(`   Created at:      ${user.createdAt.toISOString()}`);

  // ── Step 2: Count all related data ─────────────────────────
  console.log('\n📊 Related data summary:');

  const [
    accountCount,
    sessionCount,
    transactionCount,
    recurringCount,
    goalCount,
    assetCount,
    liabilityCount,
    netWorthCount,
    holdingCount,
    documentCount,
    customCategoryCount,
    profileCount,
    merchantMapCount,
    calculatorInviteCount,
    sharedMemberCount,
  ] = await Promise.all([
    prisma.account.count({ where: { userId: user.id } }),
    prisma.session.count({ where: { userId: user.id } }),
    prisma.transaction.count({ where: { userId: user.id } }),
    prisma.recurringTransaction.count({ where: { userId: user.id } }),
    prisma.financialGoal.count({ where: { userId: user.id } }),
    prisma.asset.count({ where: { userId: user.id } }),
    prisma.liability.count({ where: { userId: user.id } }),
    prisma.netWorthHistory.count({ where: { userId: user.id } }),
    prisma.holding.count({ where: { userId: user.id } }),
    prisma.document.count({ where: { userId: user.id } }),
    prisma.customCategory.count({ where: { userId: user.id } }),
    prisma.userProfile.count({ where: { userId: user.id } }),
    prisma.merchantCategoryMap.count({ where: { userId: user.id } }),
    prisma.calculatorInvite.count({ where: { inviterId: user.id } }),
    prisma.sharedAccountMember.count({ where: { userId: user.id } }),
  ]);

  // Also count audit logs (these are NOT cascade-deleted, just informational)
  const auditLogCount = await prisma.auditLog.count({ where: { userId: user.id } });

  console.log(`   OAuth Accounts:        ${accountCount}`);
  console.log(`   Sessions:              ${sessionCount}`);
  console.log(`   Transactions:          ${transactionCount}`);
  console.log(`   Recurring Trans:       ${recurringCount}`);
  console.log(`   Financial Goals:       ${goalCount}`);
  console.log(`   Assets:                ${assetCount}`);
  console.log(`   Liabilities:           ${liabilityCount}`);
  console.log(`   Net Worth History:     ${netWorthCount}`);
  console.log(`   Holdings:              ${holdingCount}`);
  console.log(`   Documents:             ${documentCount}`);
  console.log(`   Custom Categories:     ${customCategoryCount}`);
  console.log(`   User Profile:          ${profileCount}`);
  console.log(`   Merchant Mappings:     ${merchantMapCount}`);
  console.log(`   Calculator Invites:    ${calculatorInviteCount}`);
  console.log(`   Shared Account Memberships: ${sharedMemberCount}`);
  console.log(`   Audit Logs:            ${auditLogCount} (will NOT be deleted)`);

  // ── Step 3: Handle Documents (Vercel Blob cleanup) ─────────
  if (documentCount > 0) {
    console.log('\n📄 Cleaning up Vercel Blob documents...');
    const documents = await prisma.document.findMany({
      where: { userId: user.id },
      select: { id: true, filename: true, url: true },
    });

    for (const doc of documents) {
      if (doc.url) {
        try {
          // Dynamic import of @vercel/blob since it may need env vars
          const { del } = await import('@vercel/blob');
          await del(doc.url);
          console.log(`   ✅ Deleted blob: ${doc.filename}`);
        } catch (blobError) {
          console.error(`   ⚠️  Failed to delete blob for ${doc.filename}:`, blobError);
          // Continue even if blob deletion fails — DB record will still be deleted via cascade
        }
      } else {
        console.log(`   ⏭️  No blob URL for: ${doc.filename} (skipped)`);
      }
    }
  }

  // ── Step 4: Handle Shared Account Memberships ──────────────
  if (sharedMemberCount > 0) {
    console.log('\n👥 Handling shared account memberships...');
    const memberships = await prisma.sharedAccountMember.findMany({
      where: { userId: user.id },
      include: {
        sharedAccount: {
          include: {
            members: true,
          },
        },
      },
    });

    for (const membership of memberships) {
      const otherMembers = membership.sharedAccount.members.filter(
        (m) => m.userId !== user.id
      );

      if (otherMembers.length === 0) {
        // User is the only member — delete the entire shared account
        console.log(`   🗑️  Deleting shared account "${membership.sharedAccount.name}" (no other members)`);
        // Delete invites first, then the shared account
        await prisma.accountInvite.deleteMany({
          where: { sharedAccountId: membership.sharedAccount.id },
        });
        await prisma.sharedAccountMember.deleteMany({
          where: { sharedAccountId: membership.sharedAccount.id },
        });
        await prisma.sharedAccount.delete({
          where: { id: membership.sharedAccount.id },
        });
      } else {
        // Other members exist — just remove this user from the shared account
        console.log(`   👋 Removing user from shared account "${membership.sharedAccount.name}" (${otherMembers.length} other members remain)`);
        await prisma.sharedAccountMember.delete({
          where: { id: membership.id },
        });
      }
    }
  }

  // ── Step 5: Delete the user (cascade deletes everything else) ──
  console.log('\n🔥 Deleting user and all cascade-related data...');

  await prisma.user.delete({
    where: { id: user.id },
  });

  console.log('\n' + '='.repeat(60));
  console.log('✅ User and all related data deleted successfully!');
  console.log('='.repeat(60));
  console.log(`\nThe email ${TARGET_EMAIL} can now register again as a new user.`);
  console.log(`Use: https://neto.co.il/login?source=prog to register as Haredi.\n`);
}

main()
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

