/**
 * Populate Global Merchant Stats
 *
 * One-time migration script that reads all existing Transaction records,
 * normalizes merchant names, and populates the GlobalMerchantStats and
 * GlobalMerchantVote tables used by the consensus classification pipeline.
 *
 * Safety:
 * - Cursor-based pagination in batches of 1000
 * - Upserts in chunks of 200 to avoid oversized transactions
 * - Idempotent: safe to re-run (uses upserts + skipDuplicates)
 *
 * Usage:
 *   npx tsx scripts/populateGlobalStats.ts
 *   npx tsx scripts/populateGlobalStats.ts --limit 500   # dry-run first N records
 */

import { PrismaClient } from '@prisma/client';

// Import from compiled source using relative path (scripts are excluded from tsconfig)
// We duplicate the normalization logic here to avoid complex path aliasing in scripts.
// This MUST stay in sync with src/lib/classificationUtils.ts.

const BANK_PREFIXES = [
  'הו"ק ל', 'הו"ק', 'הוק', 'הוראת קבע',
  'חיוב כרטיס', 'חיוב אשראי', 'חיוב מ-', 'חיוב מ ',
  'זיכוי מ-', 'זיכוי מ ', 'זיכוי',
  'העברת ביט', 'העברה ל', 'העברה מ', 'העברת', 'העברה',
  'הפקדת שיק', 'שיק', "צ'ק",
  'תשלום ל', 'תשלום עבור',
  'משיכת מזומן', 'משיכה', 'הפקדה',
];

function superNormalizeMerchantName(name: string): string {
  if (!name) return '';
  let s = name.trim();
  s = s.replace(/[\s\u00A0]+/g, ' ');
  s = s.replace(/[A-Z]/g, c => c.toLowerCase());
  for (const prefix of BANK_PREFIXES) {
    if (s.startsWith(prefix)) {
      s = s.slice(prefix.length).trim();
      break;
    }
  }
  s = s.replace(/[*x]{1,4}\d{4}\b/gi, '');
  s = s.replace(/\s+\d{1,2}[\/\.]\d{1,2}([\/\.]\d{2,4})?\s*$/g, '');
  s = s.replace(/\s+\d{1,2}:\d{2}(:\d{2})?\s*$/g, '');
  s = s.replace(/\s+\d{1,5}\s*$/g, '');
  s = s.replace(/\s*\([^)]*\)\s*$/g, '');
  s = s.replace(/\s*[-–—]\s*/g, ' ');
  s = s.replace(/["'`״׳]/g, '');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

// ============================================

const prisma = new PrismaClient();

const BATCH_SIZE = 1000;
const UPSERT_CHUNK = 200;

interface AggKey {
  merchantName: string;
  category: string;
  isHarediContext: boolean;
}

function aggKeyStr(k: AggKey): string {
  return `${k.merchantName}||${k.category}||${k.isHarediContext}`;
}

interface VoteKey extends AggKey {
  userId: string;
}

function voteKeyStr(k: VoteKey): string {
  return `${k.merchantName}||${k.category}||${k.isHarediContext}||${k.userId}`;
}

async function main() {
  const limitArg = process.argv.find(a => a.startsWith('--limit'));
  const limitVal = limitArg ? parseInt(limitArg.split('=')[1] || process.argv[process.argv.indexOf(limitArg) + 1], 10) : undefined;
  const hasLimit = limitVal && !isNaN(limitVal) && limitVal > 0;

  console.log('='.repeat(60));
  console.log('  Populate GlobalMerchantStats + GlobalMerchantVote');
  console.log('='.repeat(60));
  if (hasLimit) {
    console.log(`  Limit mode: processing first ${limitVal} transactions\n`);
  }

  // Pre-fetch userId -> isHaredi mapping
  const users = await prisma.user.findMany({
    select: { id: true, signupSource: true },
  });
  const harediUsers = new Set(users.filter(u => u.signupSource === 'prog').map(u => u.id));
  console.log(`  Users: ${users.length} total, ${harediUsers.size} haredi\n`);

  // Aggregation maps
  const statsMap = new Map<string, { key: AggKey; count: number }>();
  const voteSet = new Set<string>();
  const votes: VoteKey[] = [];

  let cursor: string | undefined;
  let processed = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const take = hasLimit ? Math.min(BATCH_SIZE, limitVal! - processed) : BATCH_SIZE;
    if (take <= 0) break;

    const batch = await prisma.transaction.findMany({
      take,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: 'asc' },
      select: {
        id: true,
        userId: true,
        description: true,
        category: true,
      },
    });

    if (batch.length === 0) break;
    cursor = batch[batch.length - 1].id;

    for (const tx of batch) {
      const normalized = superNormalizeMerchantName(tx.description);
      if (!normalized || !tx.category) continue;

      const isHarediContext = harediUsers.has(tx.userId);

      const aggKey: AggKey = {
        merchantName: normalized,
        category: tx.category,
        isHarediContext,
      };

      const ks = aggKeyStr(aggKey);
      const existing = statsMap.get(ks);
      if (existing) {
        existing.count++;
      } else {
        statsMap.set(ks, { key: aggKey, count: 1 });
      }

      const vk: VoteKey = { ...aggKey, userId: tx.userId };
      const vks = voteKeyStr(vk);
      if (!voteSet.has(vks)) {
        voteSet.add(vks);
        votes.push(vk);
      }
    }

    processed += batch.length;
    process.stdout.write(`  Processed ${processed} transactions...\r`);

    if (hasLimit && processed >= limitVal!) break;
  }

  console.log(`\n  Scan complete: ${processed} transactions processed`);
  console.log(`  Unique stat entries: ${statsMap.size}`);
  console.log(`  Unique vote entries: ${votes.length}\n`);

  // Upsert GlobalMerchantStats in chunks
  const statsEntries = Array.from(statsMap.values());
  let statsUpserted = 0;

  for (let i = 0; i < statsEntries.length; i += UPSERT_CHUNK) {
    const chunk = statsEntries.slice(i, i + UPSERT_CHUNK);
    const ops = chunk.map(({ key, count }) =>
      prisma.globalMerchantStats.upsert({
        where: {
          merchantName_category_isHarediContext: {
            merchantName: key.merchantName,
            category: key.category,
            isHarediContext: key.isHarediContext,
          },
        },
        create: {
          merchantName: key.merchantName,
          category: key.category,
          count,
          isHarediContext: key.isHarediContext,
        },
        update: {
          count: { increment: count },
        },
      })
    );
    await prisma.$transaction(ops);
    statsUpserted += chunk.length;
    process.stdout.write(`  Stats upserted: ${statsUpserted}/${statsEntries.length}\r`);
  }
  console.log(`\n  GlobalMerchantStats: ${statsUpserted} entries upserted`);

  // Insert GlobalMerchantVote in chunks (skipDuplicates for idempotency)
  let votesInserted = 0;
  for (let i = 0; i < votes.length; i += UPSERT_CHUNK) {
    const chunk = votes.slice(i, i + UPSERT_CHUNK);
    const result = await prisma.globalMerchantVote.createMany({
      data: chunk.map(v => ({
        merchantName: v.merchantName,
        category: v.category,
        isHarediContext: v.isHarediContext,
        userId: v.userId,
      })),
      skipDuplicates: true,
    });
    votesInserted += result.count;
    process.stdout.write(`  Votes inserted: ${votesInserted} (chunk ${Math.floor(i / UPSERT_CHUNK) + 1})\r`);
  }

  console.log(`\n  GlobalMerchantVote: ${votesInserted} new entries inserted`);
  console.log('\n' + '='.repeat(60));
  console.log('  Done!');
  console.log('='.repeat(60));
}

main()
  .catch((error) => {
    console.error('\nFatal error:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
