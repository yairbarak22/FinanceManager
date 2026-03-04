/**
 * Update User Signup Source Script
 *
 * Updates a user's signupSource to mark them as Haredi (signupSource = 'prog').
 *
 * Safety features:
 * - Hardcoded email to prevent accidental updates
 * - Displays user info before and after the update
 *
 * Usage:
 *   npx tsx scripts/update-user-signup-source.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TARGET_EMAIL = 'orimaman127@gmail.com';
const NEW_SIGNUP_SOURCE = 'prog';

async function main() {
  console.log('='.repeat(60));
  console.log('🔄  Update User Signup Source');
  console.log('='.repeat(60));
  console.log(`\nTarget email: ${TARGET_EMAIL}`);
  console.log(`New signupSource: ${NEW_SIGNUP_SOURCE}\n`);

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
    console.log('❌ User not found. Aborting.');
    return;
  }

  console.log('👤 User found:');
  console.log(`   ID:              ${user.id}`);
  console.log(`   Name:            ${user.name ?? '(none)'}`);
  console.log(`   Email:           ${user.email}`);
  console.log(`   Current source:  ${user.signupSource ?? '(none)'}`);
  console.log(`   Onboarding seen: ${user.hasSeenOnboarding}`);
  console.log(`   Created at:      ${user.createdAt.toISOString()}`);

  if (user.signupSource === NEW_SIGNUP_SOURCE) {
    console.log(`\n✅ User already has signupSource="${NEW_SIGNUP_SOURCE}". No update needed.`);
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { signupSource: NEW_SIGNUP_SOURCE },
  });

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Updated signupSource: "${user.signupSource ?? '(none)'}" → "${NEW_SIGNUP_SOURCE}"`);
  console.log('='.repeat(60));
}

main()
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
