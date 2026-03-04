/**
 * Export Haredi Users to CSV
 *
 * Exports all users with signupSource === 'prog' to a CSV file
 * with name, email, and registration date.
 *
 * Usage:
 *   npx tsx scripts/export-haredi-users.ts
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

function escapeCsvField(field: string | null | undefined): string {
  if (field === null || field === undefined) return '';
  const str = String(field);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

async function main() {
  console.log('='.repeat(60));
  console.log('  Export Haredi Users to CSV');
  console.log('='.repeat(60));

  const harediUsers = await prisma.user.findMany({
    where: { signupSource: 'prog' },
    select: {
      name: true,
      email: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (harediUsers.length === 0) {
    console.log('\nNo Haredi users found (signupSource === "prog").');
    return;
  }

  console.log(`\nFound ${harediUsers.length} Haredi users.\n`);

  const BOM = '\uFEFF';
  const headers = 'שם,אימייל,תאריך הרשמה';
  const rows = harediUsers.map((user) => {
    const date = user.createdAt.toISOString().split('T')[0];
    return [
      escapeCsvField(user.name),
      escapeCsvField(user.email),
      date,
    ].join(',');
  });

  const csvContent = BOM + [headers, ...rows].join('\n');

  const date = new Date().toISOString().split('T')[0];
  const filename = `haredi-users-export-${date}.csv`;
  const outputPath = path.join(__dirname, filename);

  fs.writeFileSync(outputPath, csvContent, 'utf-8');

  console.log(`CSV saved to: ${outputPath}`);
  console.log(`Total users exported: ${harediUsers.length}`);
  console.log('='.repeat(60));
}

main()
  .catch((error) => {
    console.error('\nFatal error:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
