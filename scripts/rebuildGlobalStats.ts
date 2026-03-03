/**
 * Rebuild Global Merchant Stats
 *
 * Wipes and repopulates GlobalMerchantStats + GlobalMerchantVote using the
 * updated superNormalizeMerchantName logic. Skips blacklisted merchants so
 * ambiguous names never pollute the consensus tables.
 *
 * Usage:
 *   npx tsx scripts/rebuildGlobalStats.ts
 */

import { PrismaClient } from '@prisma/client';

// ─────────────────────────────────────────────────────────────
// Duplicated normalization + blacklist logic (scripts/ is excluded
// from tsconfig path aliases). MUST stay in sync with
// src/lib/classificationUtils.ts.
// ─────────────────────────────────────────────────────────────

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
  // Replace punctuation separators with space (merges "רב-קו" → "רב קו")
  s = s.replace(/[-_.,]/g, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  s = s.replace(/[*x]{1,4}\d{4}\b/gi, '');
  s = s.replace(/\s+\d{1,2}[\/\.]\d{1,2}([\/\.]\d{2,4})?\s*$/g, '');
  s = s.replace(/\s+\d{1,2}:\d{2}(:\d{2})?\s*$/g, '');
  s = s.replace(/\s+\d{1,5}\s*$/g, '');
  s = s.replace(/\s*\([^)]*\)\s*$/g, '');
  s = s.replace(/[–—]/g, ' ');
  s = s.replace(/["'`״׳]/g, '');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

const BLACKLISTED_MERCHANTS = [
  'bit', 'ביט', 'paybox', 'פייבוקס', 'paypal', 'פייפאל',
  'apple pay', 'אפל פיי', 'google pay', 'גוגל פיי',
  'pepper', 'פפר', 'פיי', 'pay',
  'קניות', 'משנת יוסף',
];

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isBlacklistedMerchant(name: string): boolean {
  const normalized = superNormalizeMerchantName(name);
  if (!normalized) return false;
  for (const keyword of BLACKLISTED_MERCHANTS) {
    if (normalized === keyword) return true;
    const regex = new RegExp(`(?:^|\\s)${escapeRegex(keyword)}(?:\\s|$)`);
    if (regex.test(normalized)) return true;
  }
  return false;
}

// ─────────────────────────────────────────────────────────────

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
  console.log('='.repeat(60));
  console.log('  Rebuild GlobalMerchantStats + GlobalMerchantVote');
  console.log('  (updated normalization + blacklist filtering)');
  console.log('='.repeat(60));

  // Step 1: Wipe existing data
  console.log('\n  Deleting existing GlobalMerchantVote rows...');
  const deletedVotes = await prisma.globalMerchantVote.deleteMany({});
  console.log(`  Deleted ${deletedVotes.count} vote rows`);

  console.log('  Deleting existing GlobalMerchantStats rows...');
  const deletedStats = await prisma.globalMerchantStats.deleteMany({});
  console.log(`  Deleted ${deletedStats.count} stat rows`);

  // Step 2: Pre-fetch user context mapping
  const users = await prisma.user.findMany({
    select: { id: true, signupSource: true },
  });
  const harediUsers = new Set(users.filter(u => u.signupSource === 'prog').map(u => u.id));
  console.log(`\n  Users: ${users.length} total, ${harediUsers.size} haredi`);

  // Step 3: Scan all transactions in batches
  const statsMap = new Map<string, { key: AggKey; count: number }>();
  const voteSet = new Set<string>();
  const votes: VoteKey[] = [];

  let cursor: string | undefined;
  let processed = 0;
  let skippedBlacklist = 0;
  let skippedEmpty = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const batch = await prisma.transaction.findMany({
      take: BATCH_SIZE,
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
      if (!normalized || !tx.category) {
        skippedEmpty++;
        continue;
      }

      // Skip blacklisted merchants
      if (isBlacklistedMerchant(normalized)) {
        skippedBlacklist++;
        continue;
      }

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
    process.stdout.write(`  Scanned ${processed} transactions...\r`);
  }

  console.log(`\n\n  Scan complete: ${processed} transactions processed`);
  console.log(`  Skipped (blacklisted):  ${skippedBlacklist}`);
  console.log(`  Skipped (empty/no cat): ${skippedEmpty}`);
  console.log(`  Unique stat entries:    ${statsMap.size}`);
  console.log(`  Unique vote entries:    ${votes.length}\n`);

  // Step 4: Insert GlobalMerchantStats
  const statsEntries = Array.from(statsMap.values());
  let statsInserted = 0;

  for (let i = 0; i < statsEntries.length; i += UPSERT_CHUNK) {
    const chunk = statsEntries.slice(i, i + UPSERT_CHUNK);
    await prisma.globalMerchantStats.createMany({
      data: chunk.map(({ key, count }) => ({
        merchantName: key.merchantName,
        category: key.category,
        count,
        isHarediContext: key.isHarediContext,
      })),
    });
    statsInserted += chunk.length;
    process.stdout.write(`  Stats inserted: ${statsInserted}/${statsEntries.length}\r`);
  }
  console.log(`\n  GlobalMerchantStats: ${statsInserted} entries inserted`);

  // Step 5: Insert GlobalMerchantVote
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
    });
    votesInserted += result.count;
    process.stdout.write(`  Votes inserted: ${votesInserted} (chunk ${Math.floor(i / UPSERT_CHUNK) + 1})\r`);
  }

  console.log(`\n  GlobalMerchantVote: ${votesInserted} entries inserted`);
  console.log('\n' + '='.repeat(60));
  console.log('  Rebuild complete!');
  console.log('='.repeat(60));
}

main()
  .catch((error) => {
    console.error('\nFatal error:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
