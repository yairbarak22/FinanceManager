/**
 * One-time migration: copy IvrPin.phoneNumber rows into ReportingPhone,
 * then clear the (now-removed) phoneNumber column via raw SQL if still present.
 *
 * Run AFTER `npx prisma db push` has added the ReportingPhone table and
 * removed the phoneNumber column from IvrPin.
 *
 * Usage:  npx tsx scripts/migrate-ivr-phones.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Read legacy rows that still have a phoneNumber in the old column.
  // After schema push the column may already be gone, so we use raw SQL.
  const legacyRows = await prisma.$queryRaw<
    { id: string; userId: string; phoneNumber: string }[]
  >`SELECT id, "userId", "phoneNumber" FROM "IvrPin" WHERE "phoneNumber" IS NOT NULL AND "phoneNumber" != ''`;

  console.log(`Found ${legacyRows.length} IvrPin rows with a phoneNumber to migrate.`);

  let created = 0;
  let skipped = 0;

  for (const row of legacyRows) {
    const exists = await prisma.reportingPhone.findUnique({
      where: { phoneNumber: row.phoneNumber },
    });

    if (exists) {
      console.log(`  skip ${row.phoneNumber} (already exists for user ${exists.userId})`);
      skipped++;
      continue;
    }

    await prisma.reportingPhone.create({
      data: {
        userId: row.userId,
        phoneNumber: row.phoneNumber,
      },
    });
    created++;
    console.log(`  migrated ${row.phoneNumber} → user ${row.userId}`);
  }

  console.log(`Done. Created: ${created}, Skipped: ${skipped}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
