/**
 * Analyze Global Consensus Results
 *
 * Queries GlobalMerchantStats + GlobalMerchantVote to produce a report
 * showing how the "Wisdom of the Crowds" performed on real data.
 *
 * Usage:
 *   npx tsx scripts/analyzeConsensus.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function pct(n: number, total: number): string {
  return total === 0 ? '0%' : `${((n / total) * 100).toFixed(1)}%`;
}

function pad(s: string, len: number): string {
  // RTL-safe: pad with spaces on the right
  if (s.length >= len) return s.slice(0, len);
  return s + ' '.repeat(len - s.length);
}

// ─────────────────────────────────────────────
// Section 1: Top Strongest Consensuses
// ─────────────────────────────────────────────

async function strongestConsensuses(limit = 5) {
  // Get all stats, grouped by merchant
  const allStats = await prisma.globalMerchantStats.findMany({
    orderBy: { count: 'desc' },
  });

  // Count unique voters per merchant (across all categories/contexts)
  const allVotes = await prisma.globalMerchantVote.findMany({
    select: { merchantName: true, userId: true },
  });

  const uniqueUsersPerMerchant = new Map<string, Set<string>>();
  for (const v of allVotes) {
    const set = uniqueUsersPerMerchant.get(v.merchantName) || new Set();
    set.add(v.userId);
    uniqueUsersPerMerchant.set(v.merchantName, set);
  }

  // Group stats by merchant
  const byMerchant = new Map<string, { category: string; count: number }[]>();
  for (const s of allStats) {
    const arr = byMerchant.get(s.merchantName) || [];
    arr.push({ category: s.category, count: s.count });
    byMerchant.set(s.merchantName, arr);
  }

  // Score each merchant
  interface ConsensusResult {
    merchantName: string;
    topCategory: string;
    topCount: number;
    totalVotes: number;
    confidence: number;
    uniqueUsers: number;
  }

  const results: ConsensusResult[] = [];

  for (const [merchant, categories] of byMerchant) {
    const uniqueUsers = uniqueUsersPerMerchant.get(merchant)?.size || 0;
    if (uniqueUsers < 3) continue;

    const totalVotes = categories.reduce((s, c) => s + c.count, 0);
    let topCategory = categories[0];
    for (const c of categories) {
      if (c.count > topCategory.count) topCategory = c;
    }

    const confidence = topCategory.count / totalVotes;
    if (confidence < 0.75) continue;

    results.push({
      merchantName: merchant,
      topCategory: topCategory.category,
      topCount: topCategory.count,
      totalVotes,
      confidence,
      uniqueUsers,
    });
  }

  // Sort by unique users desc, then confidence desc
  results.sort((a, b) => b.uniqueUsers - a.uniqueUsers || b.confidence - a.confidence);

  return results.slice(0, limit);
}

// ─────────────────────────────────────────────
// Section 2: Most Disputed Merchants
// ─────────────────────────────────────────────

async function mostDisputed(limit = 5) {
  const allStats = await prisma.globalMerchantStats.findMany();
  const allVotes = await prisma.globalMerchantVote.findMany({
    select: { merchantName: true, userId: true },
  });

  const uniqueUsersPerMerchant = new Map<string, Set<string>>();
  for (const v of allVotes) {
    const set = uniqueUsersPerMerchant.get(v.merchantName) || new Set();
    set.add(v.userId);
    uniqueUsersPerMerchant.set(v.merchantName, set);
  }

  const byMerchant = new Map<string, { category: string; count: number }[]>();
  for (const s of allStats) {
    const arr = byMerchant.get(s.merchantName) || [];
    arr.push({ category: s.category, count: s.count });
    byMerchant.set(s.merchantName, arr);
  }

  interface DisputedResult {
    merchantName: string;
    uniqueUsers: number;
    totalVotes: number;
    topConfidence: number;
    breakdown: { category: string; count: number }[];
  }

  const results: DisputedResult[] = [];

  for (const [merchant, categories] of byMerchant) {
    const uniqueUsers = uniqueUsersPerMerchant.get(merchant)?.size || 0;
    if (uniqueUsers < 4) continue;

    const totalVotes = categories.reduce((s, c) => s + c.count, 0);
    let topCount = 0;
    for (const c of categories) {
      if (c.count > topCount) topCount = c.count;
    }
    const topConfidence = topCount / totalVotes;
    if (topConfidence >= 0.75) continue; // Skip consensuses

    // Sort categories by count desc
    const breakdown = [...categories].sort((a, b) => b.count - a.count);

    results.push({
      merchantName: merchant,
      uniqueUsers,
      totalVotes,
      topConfidence,
      breakdown,
    });
  }

  // Sort by unique users desc, then by number of categories desc
  results.sort((a, b) => b.uniqueUsers - a.uniqueUsers || b.breakdown.length - a.breakdown.length);

  return results.slice(0, limit);
}

// ─────────────────────────────────────────────
// Section 3: Community Context Differences
// ─────────────────────────────────────────────

async function contextDifferences(limit = 5) {
  const allStats = await prisma.globalMerchantStats.findMany();

  // Group by (merchantName, isHarediContext)
  const grouped = new Map<string, Map<boolean, { category: string; count: number }[]>>();
  for (const s of allStats) {
    let contextMap = grouped.get(s.merchantName);
    if (!contextMap) {
      contextMap = new Map();
      grouped.set(s.merchantName, contextMap);
    }
    const arr = contextMap.get(s.isHarediContext) || [];
    arr.push({ category: s.category, count: s.count });
    contextMap.set(s.isHarediContext, arr);
  }

  interface ContextDiff {
    merchantName: string;
    harediTop: string;
    harediCount: number;
    generalTop: string;
    generalCount: number;
  }

  const results: ContextDiff[] = [];

  for (const [merchant, contextMap] of grouped) {
    const harediStats = contextMap.get(true);
    const generalStats = contextMap.get(false);
    if (!harediStats || !generalStats) continue;

    // Find top category for each context
    let harediTop = harediStats[0];
    for (const s of harediStats) {
      if (s.count > harediTop.count) harediTop = s;
    }

    let generalTop = generalStats[0];
    for (const s of generalStats) {
      if (s.count > generalTop.count) generalTop = s;
    }

    // Only include if the top categories are different
    if (harediTop.category === generalTop.category) continue;

    // Require some minimum votes
    const totalHaredi = harediStats.reduce((s, c) => s + c.count, 0);
    const totalGeneral = generalStats.reduce((s, c) => s + c.count, 0);
    if (totalHaredi < 2 || totalGeneral < 2) continue;

    results.push({
      merchantName: merchant,
      harediTop: harediTop.category,
      harediCount: totalHaredi,
      generalTop: generalTop.category,
      generalCount: totalGeneral,
    });
  }

  // Sort by total votes (both contexts combined) desc
  results.sort((a, b) => (b.harediCount + b.generalCount) - (a.harediCount + a.generalCount));

  return results.slice(0, limit);
}

// ─────────────────────────────────────────────
// Section 4: Overall Summary Stats
// ─────────────────────────────────────────────

async function overallSummary() {
  const totalStats = await prisma.globalMerchantStats.count();
  const totalVotes = await prisma.globalMerchantVote.count();
  const uniqueMerchants = await prisma.globalMerchantStats.findMany({
    distinct: ['merchantName'],
    select: { merchantName: true },
  });
  const uniqueVoters = await prisma.globalMerchantVote.findMany({
    distinct: ['userId'],
    select: { userId: true },
  });

  return {
    totalStatEntries: totalStats,
    totalVoteEntries: totalVotes,
    uniqueMerchants: uniqueMerchants.length,
    uniqueVoters: uniqueVoters.length,
  };
}

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────

async function main() {
  console.log('\n' + '═'.repeat(70));
  console.log('  GLOBAL CONSENSUS ANALYSIS REPORT');
  console.log('═'.repeat(70));

  // Overall summary
  const summary = await overallSummary();
  console.log('\n📊 OVERALL SUMMARY');
  console.log('─'.repeat(50));
  console.log(`  Unique merchants:      ${summary.uniqueMerchants.toLocaleString()}`);
  console.log(`  Stat entries (rows):   ${summary.totalStatEntries.toLocaleString()}`);
  console.log(`  Vote entries (unique): ${summary.totalVoteEntries.toLocaleString()}`);
  console.log(`  Unique voters (users): ${summary.uniqueVoters.toLocaleString()}`);

  // Section 1
  console.log('\n\n🏆 TOP 5 STRONGEST CONSENSUSES');
  console.log('  (>= 3 unique users, >= 75% confidence)');
  console.log('─'.repeat(70));
  console.log(`  ${pad('Merchant', 30)} ${pad('Category', 16)} Users  Votes  Conf.`);
  console.log('─'.repeat(70));

  const strong = await strongestConsensuses(5);
  if (strong.length === 0) {
    console.log('  (No merchants met the consensus threshold)');
  } else {
    for (const r of strong) {
      console.log(
        `  ${pad(r.merchantName, 30)} ${pad(r.topCategory, 16)} ${String(r.uniqueUsers).padStart(5)}  ${String(r.totalVotes).padStart(5)}  ${pct(r.topCount, r.totalVotes).padStart(6)}`
      );
    }
  }

  // Section 2
  console.log('\n\n⚔️  TOP 5 MOST DISPUTED MERCHANTS');
  console.log('  (>= 4 unique users, NO category >= 75%)');
  console.log('─'.repeat(70));

  const disputed = await mostDisputed(5);
  if (disputed.length === 0) {
    console.log('  (No disputed merchants found with >= 4 users)');
  } else {
    for (const r of disputed) {
      const breakdownStr = r.breakdown
        .map(b => `${b.category}(${b.count})`)
        .join(', ');
      console.log(
        `  ${pad(r.merchantName, 30)} [${r.uniqueUsers} users, ${r.totalVotes} votes]`
      );
      console.log(`    → ${breakdownStr}`);
    }
  }

  // Section 3
  console.log('\n\n🔀 COMMUNITY CONTEXT DIFFERENCES');
  console.log('  (Top category differs between Haredi vs General)');
  console.log('─'.repeat(70));
  console.log(`  ${pad('Merchant', 30)} ${pad('Haredi Top', 16)} ${pad('General Top', 16)} H.Votes G.Votes`);
  console.log('─'.repeat(70));

  const diffs = await contextDifferences(5);
  if (diffs.length === 0) {
    console.log('  (No context differences found)');
  } else {
    for (const r of diffs) {
      console.log(
        `  ${pad(r.merchantName, 30)} ${pad(r.harediTop, 16)} ${pad(r.generalTop, 16)} ${String(r.harediCount).padStart(7)} ${String(r.generalCount).padStart(7)}`
      );
    }
  }

  // Coverage estimate
  console.log('\n\n📈 CONSENSUS COVERAGE ESTIMATE');
  console.log('─'.repeat(50));
  const allStatsForCoverage = await prisma.globalMerchantStats.findMany();
  const allVotesForCoverage = await prisma.globalMerchantVote.findMany({
    select: { merchantName: true, userId: true },
  });

  const uniqueUsersMap = new Map<string, Set<string>>();
  for (const v of allVotesForCoverage) {
    const set = uniqueUsersMap.get(v.merchantName) || new Set();
    set.add(v.userId);
    uniqueUsersMap.set(v.merchantName, set);
  }

  const byMerchantCov = new Map<string, { category: string; count: number }[]>();
  for (const s of allStatsForCoverage) {
    const arr = byMerchantCov.get(s.merchantName) || [];
    arr.push({ category: s.category, count: s.count });
    byMerchantCov.set(s.merchantName, arr);
  }

  let consensusHits = 0;
  let totalWithEnoughUsers = 0;

  for (const [merchant, categories] of byMerchantCov) {
    const uniqueUsers = uniqueUsersMap.get(merchant)?.size || 0;
    if (uniqueUsers < 3) continue;
    totalWithEnoughUsers++;

    const totalVotes = categories.reduce((s, c) => s + c.count, 0);
    let topCount = 0;
    for (const c of categories) {
      if (c.count > topCount) topCount = c.count;
    }
    if (topCount / totalVotes >= 0.75) {
      consensusHits++;
    }
  }

  console.log(`  Total unique merchants:            ${summary.uniqueMerchants}`);
  console.log(`  Merchants with >= 3 unique users:   ${totalWithEnoughUsers}`);
  console.log(`  Of those, with >= 75% consensus:    ${consensusHits} (${pct(consensusHits, totalWithEnoughUsers)} of eligible)`);
  console.log(`  Overall consensus coverage:         ${pct(consensusHits, summary.uniqueMerchants)} of all merchants`);

  console.log('\n' + '═'.repeat(70));
  console.log('  END OF REPORT');
  console.log('═'.repeat(70) + '\n');
}

main()
  .catch((error) => {
    console.error('\nFatal error:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
