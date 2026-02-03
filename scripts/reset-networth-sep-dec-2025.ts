/**
 * One-Time Script: Reset NetWorth to Zero for Sep-Dec 2025
 * 
 * This script updates netWorth to 0 for all users for the months
 * September, October, November, and December 2025.
 * 
 * The platform was inactive during these months, so the values
 * were incorrectly initialized.
 * 
 * Usage:
 *   Dry-run (default - shows what would be updated):
 *     npx tsx scripts/reset-networth-sep-dec-2025.ts
 * 
 *   Execute (actually updates the database):
 *     npx tsx scripts/reset-networth-sep-dec-2025.ts --execute
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Target months: September, October, November, December 2025
// Note: Database has dates stored in two formats:
//   1. UTC midnight (e.g., 2025-09-01T00:00:00.000Z)
//   2. Local timezone shifted (e.g., 2025-08-31T21:00:00.000Z = Sep 1 Israel time)
//
// Actual dates in DB for each month (from database inspection):
//   Sep: 2025-08-31T21:00:00.000Z, 2025-09-01T00:00:00.000Z
//   Oct: 2025-09-30T21:00:00.000Z, 2025-10-01T00:00:00.000Z
//   Nov: 2025-10-31T22:00:00.000Z, 2025-11-01T00:00:00.000Z
//   Dec: 2025-11-30T22:00:00.000Z, 2025-12-01T00:00:00.000Z

// All possible dates that represent Sep 1 - Dec 1 2025
const TARGET_DATES_UTC = [
  // September 2025
  new Date('2025-08-31T21:00:00.000Z'),  // Sep 1 Israel (DST)
  new Date('2025-09-01T00:00:00.000Z'),  // Sep 1 UTC
  // October 2025  
  new Date('2025-09-30T21:00:00.000Z'),  // Oct 1 Israel (DST)
  new Date('2025-10-01T00:00:00.000Z'),  // Oct 1 UTC
  // November 2025
  new Date('2025-10-31T22:00:00.000Z'),  // Nov 1 Israel (no DST)
  new Date('2025-11-01T00:00:00.000Z'),  // Nov 1 UTC
  // December 2025
  new Date('2025-11-30T22:00:00.000Z'),  // Dec 1 Israel
  new Date('2025-12-01T00:00:00.000Z'),  // Dec 1 UTC
];

function formatDate(date: Date): string {
  return date.toISOString();
}

function getLocalMonth(date: Date): string {
  // Determine the "logical" month based on both UTC and local interpretations
  // For dates like 2025-08-31T21:00:00Z (which is Sep 1 in Israel), return September
  const months = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 
                  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
  
  // Check if this is a timezone-shifted date (hour >= 21 or 22)
  const hour = date.getUTCHours();
  const day = date.getUTCDate();
  
  // If it's late on the last day of month (21:00 or 22:00 UTC), it's the 1st of next month in Israel
  if ((day >= 28 && day <= 31) && (hour >= 21)) {
    // This is actually the 1st of the next month in Israel timezone
    const nextMonth = new Date(date);
    nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);
    return `${months[nextMonth.getUTCMonth()]} ${nextMonth.getUTCFullYear()}`;
  }
  
  return `${months[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

async function main() {
  const isExecute = process.argv.includes('--execute');
  
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  Reset NetWorth to Zero - September-December 2025');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  
  if (isExecute) {
    console.log('⚠️  מצב: EXECUTE - העדכונים יבוצעו בפועל!');
  } else {
    console.log('ℹ️  מצב: DRY-RUN - לא יבוצעו שינויים');
    console.log('   להרצה בפועל, הוסף את הדגל --execute');
  }
  console.log('');
  
  // Target months display
  console.log('📅 חודשים לעדכון: ספטמבר, אוקטובר, נובמבר, דצמבר 2025');
  console.log('');
  console.log('📌 תאריכים מדויקים בבסיס הנתונים:');
  for (const date of TARGET_DATES_UTC) {
    console.log(`   - ${formatDate(date)} → ${getLocalMonth(date)}`);
  }
  console.log('');

  // Find all records matching the exact target dates
  const affectedRecords = await prisma.netWorthHistory.findMany({
    where: {
      date: {
        in: TARGET_DATES_UTC,
      },
    },
    include: {
      user: {
        select: {
          email: true,
        },
      },
    },
    orderBy: [
      { userId: 'asc' },
      { date: 'asc' },
    ],
  });

  if (affectedRecords.length === 0) {
    console.log('✅ לא נמצאו רשומות לעדכון בטווח התאריכים הזה.');
    return;
  }

  console.log(`📊 נמצאו ${affectedRecords.length} רשומות לעדכון:`);
  console.log('');

  // Group by user for display
  const byUser = new Map<string, typeof affectedRecords>();
  for (const record of affectedRecords) {
    const email = record.user.email;
    if (!byUser.has(email)) {
      byUser.set(email, []);
    }
    byUser.get(email)!.push(record);
  }

  // Display records to be updated
  for (const [email, records] of byUser) {
    console.log(`👤 ${email}:`);
    for (const record of records) {
      const status = record.netWorth === 0 ? '✓ (כבר 0)' : `${record.netWorth.toLocaleString()} ₪ → 0`;
      console.log(`   ${getLocalMonth(record.date)}: netWorth: ${status}`);
      console.log(`      assets: ${record.assets.toLocaleString()} ₪, liabilities: ${record.liabilities.toLocaleString()} ₪`);
    }
    console.log('');
  }

  // Count records that actually need updating (netWorth != 0)
  const needsUpdate = affectedRecords.filter(r => r.netWorth !== 0);
  console.log(`📈 סיכום:`);
  console.log(`   - סה"כ רשומות בטווח: ${affectedRecords.length}`);
  console.log(`   - רשומות שצריכות עדכון (netWorth ≠ 0): ${needsUpdate.length}`);
  console.log(`   - רשומות שכבר 0: ${affectedRecords.length - needsUpdate.length}`);
  console.log('');

  if (!isExecute) {
    console.log('───────────────────────────────────────────────────────────────');
    console.log('ℹ️  זה היה DRY-RUN. לא בוצעו שינויים.');
    console.log('   להרצה בפועל: npx tsx scripts/reset-networth-sep-dec-2025.ts --execute');
    console.log('───────────────────────────────────────────────────────────────');
    return;
  }

  // Execute the update
  console.log('🔄 מבצע עדכון...');
  console.log('');

  try {
    const result = await prisma.netWorthHistory.updateMany({
      where: {
        date: {
          in: TARGET_DATES_UTC,
        },
      },
      data: {
        netWorth: 0,
      },
    });

    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`✅ העדכון הושלם בהצלחה!`);
    console.log(`   עודכנו ${result.count} רשומות`);
    console.log('═══════════════════════════════════════════════════════════════');

    // Verify the update
    const verifyRecords = await prisma.netWorthHistory.findMany({
      where: {
        date: {
          in: TARGET_DATES_UTC,
        },
        netWorth: {
          not: 0,
        },
      },
    });

    if (verifyRecords.length > 0) {
      console.log(`⚠️  אזהרה: נמצאו ${verifyRecords.length} רשומות שלא עודכנו כראוי!`);
    } else {
      console.log('✅ אימות: כל הרשומות בטווח כעת עם netWorth = 0');
    }

  } catch (error) {
    console.error('❌ שגיאה בביצוע העדכון:', error);
    throw error;
  }
}

main()
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

