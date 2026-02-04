/**
 * Script to clean up duplicate NetWorthHistory records
 * Keeps only the most recent record (by createdAt) for each userId + month combination
 * 
 * Run with: npx tsx scripts/cleanup-networth-duplicates.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupDuplicates() {
  console.log('Starting NetWorthHistory duplicates cleanup...\n');

  // Get all records grouped by userId and month
  const allRecords = await prisma.netWorthHistory.findMany({
    orderBy: [
      { userId: 'asc' },
      { date: 'asc' },
      { createdAt: 'desc' }, // Most recent first within same date
    ],
  });

  console.log(`Found ${allRecords.length} total records`);

  // Group by userId + month
  const groupedRecords = new Map<string, typeof allRecords>();
  
  for (const record of allRecords) {
    const monthKey = `${record.userId}-${record.date.getFullYear()}-${String(record.date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!groupedRecords.has(monthKey)) {
      groupedRecords.set(monthKey, []);
    }
    groupedRecords.get(monthKey)!.push(record);
  }

  console.log(`Found ${groupedRecords.size} unique user-month combinations\n`);

  // Find and delete duplicates (keep most recent by createdAt)
  const idsToDelete: string[] = [];
  
  for (const [key, records] of groupedRecords) {
    if (records.length > 1) {
      // Sort by createdAt descending (most recent first)
      records.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      const [keep, ...duplicates] = records;
      console.log(`Month ${key}:`);
      console.log(`  Keeping: id=${keep.id}, netWorth=${keep.netWorth}, createdAt=${keep.createdAt.toISOString()}`);
      
      for (const dup of duplicates) {
        console.log(`  Deleting: id=${dup.id}, netWorth=${dup.netWorth}, createdAt=${dup.createdAt.toISOString()}`);
        idsToDelete.push(dup.id);
      }
      console.log('');
    }
  }

  if (idsToDelete.length === 0) {
    console.log('No duplicates found. Database is clean.');
    return;
  }

  console.log(`\nDeleting ${idsToDelete.length} duplicate records...`);
  
  const result = await prisma.netWorthHistory.deleteMany({
    where: {
      id: { in: idsToDelete },
    },
  });

  console.log(`Deleted ${result.count} records.`);
  
  // Verify cleanup
  const remainingCount = await prisma.netWorthHistory.count();
  console.log(`\nRemaining records: ${remainingCount}`);
}

cleanupDuplicates()
  .catch(console.error)
  .finally(() => prisma.$disconnect());


