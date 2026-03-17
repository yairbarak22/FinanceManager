/**
 * Portfolio Asset Sync - Synchronizes a "תיק מסחר עצמאי" asset with portfolio holdings
 * Creates/updates an asset that reflects the total portfolio value
 */

import { prisma } from '@/lib/prisma';
import { saveAssetHistory } from '@/lib/assetHistory';
import { saveCurrentMonthNetWorth } from '@/lib/netWorthHistory';
import { detectAssetType } from '@/lib/finance/marketService';
import { eodProvider } from '@/lib/finance/providers/eod';
import { withSharedAccount } from '@/lib/authHelpers';
import {
  PORTFOLIO_SYNC_ASSET_NAME,
  PORTFOLIO_ASSET_CATEGORY,
  getCachedPortfolioValue,
  setCachedPortfolioValue,
  shouldUpdatePortfolioAsset,
  isPortfolioSyncAsset,
} from '@/lib/finance/portfolioCache';
import type { HybridHolding } from '@/lib/finance/types';

export { isPortfolioSyncAsset, PORTFOLIO_SYNC_ASSET_NAME };

/**
 * Sync portfolio asset for a user.
 * NOTE: invalidatePortfolioCache is NOT called here — it should only be
 * called from holding mutation endpoints (add/delete holding).
 */
export async function syncPortfolioAsset(
  userId: string,
  forceUpdate: boolean = false
): Promise<{ id: string; value: number } | null> {
  try {
    const sharedWhere = await withSharedAccount(userId);

    const holdingsCount = await prisma.holding.count({
      where: {
        ...sharedWhere,
        symbol: { not: null },
        currentValue: { gt: 0 },
      },
    });

    const existingAsset = await prisma.asset.findFirst({
      where: {
        userId,
        name: PORTFOLIO_SYNC_ASSET_NAME,
      },
    });

    if (holdingsCount === 0) {
      if (existingAsset) {
        await prisma.asset.delete({ where: { id: existingAsset.id } });
        await saveCurrentMonthNetWorth(userId);
      }
      return null;
    }

    if (existingAsset && !forceUpdate && !shouldUpdatePortfolioAsset(existingAsset.updatedAt)) {
      return { id: existingAsset.id, value: existingAsset.value };
    }

    // Try Redis/L1 cache first
    let portfolioValue = await getCachedPortfolioValue(userId);

    if (portfolioValue === null) {
      portfolioValue = await calculatePortfolioValueLightweight(userId);

      if (portfolioValue === null) {
        console.error('[PortfolioSync] Failed to calculate portfolio value');
        return existingAsset ? { id: existingAsset.id, value: existingAsset.value } : null;
      }

      await setCachedPortfolioValue(userId, portfolioValue);
    }

    if (existingAsset) {
      const updatedAsset = await prisma.asset.update({
        where: { id: existingAsset.id },
        data: { value: portfolioValue, category: PORTFOLIO_ASSET_CATEGORY },
      });
      await saveAssetHistory(updatedAsset.id, portfolioValue);
      await saveCurrentMonthNetWorth(userId);
      return { id: updatedAsset.id, value: portfolioValue };
    } else {
      const newAsset = await prisma.asset.create({
        data: {
          userId,
          name: PORTFOLIO_SYNC_ASSET_NAME,
          category: PORTFOLIO_ASSET_CATEGORY,
          value: portfolioValue,
          liquidity: 'immediate',
        },
      });
      await saveAssetHistory(newAsset.id, portfolioValue);
      await saveCurrentMonthNetWorth(userId);
      return { id: newAsset.id, value: portfolioValue };
    }
  } catch (error) {
    console.error('[PortfolioSync] Error syncing portfolio asset:', error);
    return null;
  }
}

/**
 * Lightweight portfolio value calculation — only fetches prices.
 * Skips beta, sparkline, and sector data that syncPortfolioAsset doesn't need.
 */
async function calculatePortfolioValueLightweight(userId: string): Promise<number | null> {
  try {
    const sharedWhere = await withSharedAccount(userId);

    const [dbHoldings, userProfile] = await Promise.all([
      prisma.holding.findMany({
        where: {
          ...sharedWhere,
          symbol: { not: null },
          currentValue: { gt: 0 },
        },
      }),
      prisma.userProfile.findUnique({
        where: { userId },
        select: { cashBalance: true },
      }),
    ]);

    const cashBalance = userProfile?.cashBalance ?? 0;
    if (dbHoldings.length === 0) return cashBalance;

    const exchangeRate = await eodProvider.getUsdIlsRate();

    const holdings: HybridHolding[] = dbHoldings
      .filter(h => h.symbol)
      .map(h => {
        const assetInfo = detectAssetType(h.symbol!);
        return {
          id: h.id,
          symbol: h.symbol!,
          quantity: h.currentValue,
          provider: 'EOD' as const,
          currency: (h.currency as 'USD' | 'ILS') || (assetInfo.isIsraeli ? 'ILS' : 'USD'),
          priceDisplayUnit: (h.priceDisplayUnit as 'ILS' | 'ILS_AGOROT' | 'USD') || 'ILS',
        };
      });

    // Only fetch prices — no beta, no sparkline, no sector
    const valuePromises = holdings.map(async (h) => {
      const quote = await eodProvider.getQuote(h.symbol);
      if (!quote || quote.price <= 0) return 0;
      const priceILS = quote.currency === 'ILS' ? quote.price : quote.price * exchangeRate;
      return priceILS * h.quantity;
    });

    const values = await Promise.all(valuePromises);
    const totalEquityILS = values.reduce((sum, v) => sum + v, 0);

    return totalEquityILS + cashBalance;
  } catch (error) {
    console.error('[PortfolioSync] Error calculating portfolio value (lightweight):', error);
    return null;
  }
}

export async function syncAllPortfolioAssets(): Promise<number> {
  try {
    const usersWithHoldings = await prisma.holding.findMany({
      where: {
        symbol: { not: null },
        currentValue: { gt: 0 },
      },
      select: { userId: true },
      distinct: ['userId'],
    });

    let syncedCount = 0;
    for (const { userId } of usersWithHoldings) {
      const result = await syncPortfolioAsset(userId);
      if (result) syncedCount++;
    }

    return syncedCount;
  } catch (error) {
    console.error('[PortfolioSync] Error syncing all portfolio assets:', error);
    return 0;
  }
}
