/**
 * Shared post-import learning logic.
 *
 * Extracted from /api/transactions/import/confirm to be reusable
 * in the new workspace finalize flow.
 */

import { prisma } from '@/lib/prisma';
import { superNormalizeMerchantName } from '@/lib/classificationUtils';

interface SavedTransaction {
  merchantName: string;
  category: string;
  isManualCategory?: boolean;
}

/**
 * Update the per-user MerchantCategoryMap cache after saving transactions.
 */
export async function updateMerchantCache(
  userId: string,
  transactions: SavedTransaction[]
): Promise<number> {
  const mappings = new Map<string, { category: string; isManual: boolean }>();

  for (const t of transactions) {
    const normalizedKey = t.merchantName.toLowerCase().trim();
    if (t.isManualCategory) {
      mappings.set(normalizedKey, { category: t.category, isManual: true });
    } else if (!mappings.has(normalizedKey)) {
      mappings.set(normalizedKey, { category: t.category, isManual: false });
    }
  }

  const ops = Array.from(mappings.entries()).map(
    ([name, { category, isManual }]) =>
      prisma.merchantCategoryMap.upsert({
        where: { userId_merchantName: { userId, merchantName: name } },
        create: { userId, merchantName: name, category, isManual },
        update: { category, isManual: isManual || undefined },
      })
  );

  if (ops.length > 0) {
    await prisma.$transaction(ops);
  }

  return mappings.size;
}

/**
 * Fire-and-forget global consensus update (votes + stats).
 */
export function updateGlobalConsensusBackground(
  userId: string,
  transactions: SavedTransaction[]
): void {
  void (async () => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { signupSource: true },
      });
      const isHarediContext = user?.signupSource === 'prog';

      const seenVoteKeys = new Set<string>();
      const votesToCast: { merchantName: string; category: string }[] = [];

      for (const t of transactions) {
        const normalized = superNormalizeMerchantName(t.merchantName);
        if (!normalized || !t.category) continue;
        const voteKey = `${normalized}||${t.category}`;
        if (seenVoteKeys.has(voteKey)) continue;
        seenVoteKeys.add(voteKey);
        votesToCast.push({ merchantName: normalized, category: t.category });
      }

      for (const { merchantName, category } of votesToCast) {
        const existingVote = await prisma.globalMerchantVote.findUnique({
          where: {
            merchantName_category_isHarediContext_userId: {
              merchantName,
              category,
              isHarediContext,
              userId,
            },
          },
        });

        if (existingVote) continue;

        try {
          await prisma.globalMerchantVote.create({
            data: { merchantName, category, isHarediContext, userId },
          });
          await prisma.globalMerchantStats.upsert({
            where: {
              merchantName_category_isHarediContext: {
                merchantName,
                category,
                isHarediContext,
              },
            },
            create: { merchantName, category, count: 1, isHarediContext },
            update: { count: { increment: 1 } },
          });
        } catch (voteErr) {
          console.error('[Global Stats] Vote error:', voteErr);
        }
      }

      console.log(`[Global Stats] Processed ${votesToCast.length} votes for user ${userId}`);
    } catch (bgError) {
      console.error('[Global Stats] Background update failed:', bgError);
    }
  })();
}
