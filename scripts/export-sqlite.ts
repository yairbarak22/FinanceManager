/**
 * Export SQLite data to JSON
 * 
 * Usage:
 * 1. Make sure the SQLite database exists at prisma/finance.db
 * 2. Run: npx ts-node scripts/export-sqlite.ts
 * 3. Data will be saved to scripts/backup.json
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

// Create a separate Prisma client for SQLite
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./prisma/finance.db',
    },
  },
});

async function exportData() {
  console.log('🔄 Starting SQLite export...\n');

  try {
    // Export all tables
    const [
      transactions,
      recurringTransactions,
      assets,
      assetValueHistory,
      liabilities,
      netWorthHistory,
      holdings,
      documents,
    ] = await Promise.all([
      prisma.transaction.findMany(),
      prisma.recurringTransaction.findMany(),
      prisma.asset.findMany(),
      prisma.assetValueHistory.findMany(),
      prisma.liability.findMany(),
      prisma.netWorthHistory.findMany(),
      prisma.holding.findMany(),
      prisma.document.findMany(),
    ]);

    const data = {
      exportedAt: new Date().toISOString(),
      transactions,
      recurringTransactions,
      assets,
      assetValueHistory,
      liabilities,
      netWorthHistory,
      holdings,
      documents,
    };

    // Write to file
    const outputPath = path.join(__dirname, 'backup.json');
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));

    console.log('✅ Export complete!\n');
    console.log(`📊 Statistics:`);
    console.log(`   - Transactions: ${transactions.length}`);
    console.log(`   - Recurring Transactions: ${recurringTransactions.length}`);
    console.log(`   - Assets: ${assets.length}`);
    console.log(`   - Asset Value History: ${assetValueHistory.length}`);
    console.log(`   - Liabilities: ${liabilities.length}`);
    console.log(`   - Net Worth History: ${netWorthHistory.length}`);
    console.log(`   - Holdings: ${holdings.length}`);
    console.log(`   - Documents: ${documents.length}`);
    console.log(`\n📁 Saved to: ${outputPath}`);
  } catch (error) {
    console.error('❌ Export failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

exportData();

