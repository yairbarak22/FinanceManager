/**
 * Import JSON data to PostgreSQL with userId
 * 
 * Usage:
 * 1. Make sure you've exported data first using export-sqlite.ts
 * 2. Make sure you've logged in via the UI to create your User record
 * 3. Get your userId from the User table
 * 4. Run: USER_ID=your-user-id npx ts-node scripts/import-postgres.ts
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface BackupData {
  exportedAt: string;
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    category: string;
    description: string;
    date: string;
    createdAt: string;
    updatedAt: string;
  }>;
  recurringTransactions: Array<{
    id: string;
    type: string;
    amount: number;
    category: string;
    name: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
  assets: Array<{
    id: string;
    name: string;
    category: string;
    value: number;
    createdAt: string;
    updatedAt: string;
  }>;
  assetValueHistory: Array<{
    id: string;
    assetId: string;
    value: number;
    monthKey: string;
    createdAt: string;
  }>;
  liabilities: Array<{
    id: string;
    name: string;
    type: string;
    totalAmount: number;
    monthlyPayment: number;
    interestRate: number;
    loanTermMonths: number;
    startDate: string;
    remainingAmount: number | null;
    loanMethod: string;
    hasInterestRebate: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
  netWorthHistory: Array<{
    id: string;
    date: string;
    netWorth: number;
    assets: number;
    liabilities: number;
    createdAt: string;
  }>;
  holdings: Array<{
    id: string;
    name: string;
    symbol: string | null;
    type: string;
    currentValue: number;
    targetAllocation: number;
    createdAt: string;
    updatedAt: string;
  }>;
  documents: Array<{
    id: string;
    filename: string;
    storedName: string;
    mimeType: string;
    size: number;
    entityType: string;
    entityId: string;
    createdAt: string;
  }>;
}

async function importData() {
  const userId = process.env.USER_ID;

  if (!userId) {
    console.error('❌ Error: USER_ID environment variable is required');
    console.log('\nUsage: USER_ID=your-user-id npx ts-node scripts/import-postgres.ts');
    console.log('\nTo get your userId:');
    console.log('1. Login to the app via Google');
    console.log('2. Run: SELECT id, email FROM "User";');
    process.exit(1);
  }

  console.log(`🔄 Starting import for user: ${userId}\n`);

  // Verify user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    console.error(`❌ User not found with id: ${userId}`);
    console.log('Please login via the UI first to create your user account.');
    process.exit(1);
  }

  console.log(`✅ Found user: ${user.email}\n`);

  // Read backup file
  const backupPath = path.join(__dirname, 'backup.json');
  
  if (!fs.existsSync(backupPath)) {
    console.error('❌ Backup file not found at:', backupPath);
    console.log('Please run export-sqlite.ts first.');
    process.exit(1);
  }

  const data: BackupData = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));
  console.log(`📁 Loaded backup from: ${data.exportedAt}\n`);

  try {
    // Create a mapping from old asset IDs to new asset IDs
    const assetIdMap = new Map<string, string>();

    // Import assets first (they're needed for assetValueHistory)
    console.log('📥 Importing assets...');
    for (const asset of data.assets) {
      const newAsset = await prisma.asset.create({
        data: {
          userId,
          name: asset.name,
          category: asset.category,
          value: asset.value,
          createdAt: new Date(asset.createdAt),
          updatedAt: new Date(asset.updatedAt),
        },
      });
      assetIdMap.set(asset.id, newAsset.id);
    }
    console.log(`   ✅ Imported ${data.assets.length} assets`);

    // Import asset value history with mapped asset IDs
    console.log('📥 Importing asset value history...');
    for (const history of data.assetValueHistory) {
      const newAssetId = assetIdMap.get(history.assetId);
      if (newAssetId) {
        await prisma.assetValueHistory.create({
          data: {
            assetId: newAssetId,
            value: history.value,
            monthKey: history.monthKey,
            createdAt: new Date(history.createdAt),
          },
        });
      }
    }
    console.log(`   ✅ Imported ${data.assetValueHistory.length} asset history records`);

    // Import transactions
    console.log('📥 Importing transactions...');
    for (const tx of data.transactions) {
      await prisma.transaction.create({
        data: {
          userId,
          type: tx.type,
          amount: tx.amount,
          category: tx.category,
          description: tx.description,
          date: new Date(tx.date),
          createdAt: new Date(tx.createdAt),
          updatedAt: new Date(tx.updatedAt),
        },
      });
    }
    console.log(`   ✅ Imported ${data.transactions.length} transactions`);

    // Import recurring transactions
    console.log('📥 Importing recurring transactions...');
    for (const rec of data.recurringTransactions) {
      await prisma.recurringTransaction.create({
        data: {
          userId,
          type: rec.type,
          amount: rec.amount,
          category: rec.category,
          name: rec.name,
          isActive: rec.isActive,
          createdAt: new Date(rec.createdAt),
          updatedAt: new Date(rec.updatedAt),
        },
      });
    }
    console.log(`   ✅ Imported ${data.recurringTransactions.length} recurring transactions`);

    // Import liabilities
    console.log('📥 Importing liabilities...');
    for (const liability of data.liabilities) {
      await prisma.liability.create({
        data: {
          userId,
          name: liability.name,
          type: liability.type,
          totalAmount: liability.totalAmount,
          monthlyPayment: liability.monthlyPayment,
          interestRate: liability.interestRate,
          loanTermMonths: liability.loanTermMonths,
          startDate: new Date(liability.startDate),
          remainingAmount: liability.remainingAmount,
          loanMethod: liability.loanMethod,
          hasInterestRebate: liability.hasInterestRebate,
          createdAt: new Date(liability.createdAt),
          updatedAt: new Date(liability.updatedAt),
        },
      });
    }
    console.log(`   ✅ Imported ${data.liabilities.length} liabilities`);

    // Import net worth history
    console.log('📥 Importing net worth history...');
    for (const nw of data.netWorthHistory) {
      await prisma.netWorthHistory.create({
        data: {
          userId,
          date: new Date(nw.date),
          netWorth: nw.netWorth,
          assets: nw.assets,
          liabilities: nw.liabilities,
          createdAt: new Date(nw.createdAt),
        },
      });
    }
    console.log(`   ✅ Imported ${data.netWorthHistory.length} net worth history records`);

    // Import holdings
    console.log('📥 Importing holdings...');
    for (const holding of data.holdings) {
      await prisma.holding.create({
        data: {
          userId,
          name: holding.name,
          symbol: holding.symbol,
          type: holding.type,
          currentValue: holding.currentValue,
          targetAllocation: holding.targetAllocation,
          createdAt: new Date(holding.createdAt),
          updatedAt: new Date(holding.updatedAt),
        },
      });
    }
    console.log(`   ✅ Imported ${data.holdings.length} holdings`);

    // Import documents (note: actual files need to be copied manually)
    console.log('📥 Importing documents...');
    for (const doc of data.documents) {
      await prisma.document.create({
        data: {
          userId,
          filename: doc.filename,
          storedName: doc.storedName,
          mimeType: doc.mimeType,
          size: doc.size,
          entityType: doc.entityType,
          entityId: doc.entityId,
          createdAt: new Date(doc.createdAt),
        },
      });
    }
    console.log(`   ✅ Imported ${data.documents.length} documents`);

    console.log('\n✅ Import complete!');
    console.log('\n⚠️  Note: Document files need to be copied manually from public/uploads/');
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

importData();

