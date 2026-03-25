/**
 * One-time / ops: set signupSource to 'prog' for every user who is not already 'prog'.
 *
 * IMPORTANT: Prisma `where: { signupSource: { not: 'prog' } }` does NOT match NULL
 * (SQL: NULL <> 'prog' is unknown). Always include `{ signupSource: null }` in OR.
 *
 * Usage: npx tsx scripts/backfill-signup-source-all-prog.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const pending = await prisma.user.count({
    where: {
      OR: [{ signupSource: null }, { signupSource: { not: 'prog' } }],
    },
  });
  console.log(`Users to update (null or not prog): ${pending}`);
  if (pending === 0) {
    return;
  }
  const result = await prisma.user.updateMany({
    where: {
      OR: [{ signupSource: null }, { signupSource: { not: 'prog' } }],
    },
    data: { signupSource: 'prog' },
  });
  console.log(`Updated ${result.count} users.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
