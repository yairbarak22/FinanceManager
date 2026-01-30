/**
 * Portfolio Asset Sync - Synchronizes a "תיק מסחר עצמאי" asset with portfolio holdings
 * Creates/updates an asset that reflects the total portfolio value
 */

import { prisma } from '@/lib/prisma';
import { saveAssetHistory } from '@/lib/assetHistory';
import { saveCurrentMonthNetWorth } from '@/lib/netWorthHistory';
import { analyzePortfolio, detectAssetType } from '@/lib/finance/marketService';
import { withSharedAccount } from '@/lib/authHelpers';
import {
  PORTFOLIO_SYNC_ASSET_NAME,
  PORTFOLIO_ASSET_CATEGORY,
  getCachedPortfolioValue,
  setCachedPortfolioValue,
  invalidatePortfolioCache,
  shouldUpdatePortfolioAsset,
  isPortfolioSyncAsset,
} from '@/lib/finance/portfolioCache';
import type { HybridHolding } from '@/lib/finance/types';

// Re-export for convenience
export { isPortfolioSyncAsset, PORTFOLIO_SYNC_ASSET_NAME };

/**
 * Sync portfolio asset for a user
 * Creates or updates the "תיק מסחר עצמאי" asset based on holdings
 * 
 * @param userId - The user ID to sync for
 * @param forceUpdate - If true, ignores the 5-hour update threshold
 * @returns The synced asset or null if no holdings exist
 */
export async function syncPortfolioAsset(
  userId: string,
  forceUpdate: boolean = false
): Promise<{ id: string; value: number } | null> {
  try {
    // Invalidate cache since holdings changed
    invalidatePortfolioCache(userId);

    // Use shared account to include holdings from all members
    const sharedWhere = await withSharedAccount(userId);

    // Check if user has any holdings (including shared accounts)
    const holdingsCount = await prisma.holding.count({
      where: {
        ...sharedWhere,
        symbol: { not: null },
        currentValue: { gt: 0 },
      },
    });

    // Find existing portfolio sync asset
    const existingAsset = await prisma.asset.findFirst({
      where: {
        userId,
        name: PORTFOLIO_SYNC_ASSET_NAME,
      },
    });

    // If no holdings, delete the sync asset if it exists
    if (holdingsCount === 0) {
      if (existingAsset) {
        await prisma.asset.delete({
          where: { id: existingAsset.id },
        });
        // Update net worth after deletion
        await saveCurrentMonthNetWorth(userId);
      }
      return null;
    }

    // If asset exists and wasn't updated more than 5 hours ago, skip update (unless forced)
    if (existingAsset && !forceUpdate && !shouldUpdatePortfolioAsset(existingAsset.updatedAt)) {
      return { id: existingAsset.id, value: existingAsset.value };
    }

    // Get portfolio value (from cache or calculate)
    let portfolioValue = getCachedPortfolioValue(userId);

    if (portfolioValue === null) {
      // Need to calculate portfolio value
      portfolioValue = await calculatePortfolioValue(userId);
      
      if (portfolioValue === null) {
        console.error('[PortfolioSync] Failed to calculate portfolio value');
        return existingAsset ? { id: existingAsset.id, value: existingAsset.value } : null;
      }

      // Cache the value
      setCachedPortfolioValue(userId, portfolioValue);
    }

    // Create or update the asset
    if (existingAsset) {
      // Update existing asset
      const updatedAsset = await prisma.asset.update({
        where: { id: existingAsset.id },
        data: {
          value: portfolioValue,
          category: PORTFOLIO_ASSET_CATEGORY,
        },
      });

      // Save to history
      await saveAssetHistory(updatedAsset.id, portfolioValue);
      
      // Update net worth
      await saveCurrentMonthNetWorth(userId);

      return { id: updatedAsset.id, value: portfolioValue };
    } else {
      // Create new asset
      const newAsset = await prisma.asset.create({
        data: {
          userId,
          name: PORTFOLIO_SYNC_ASSET_NAME,
          category: PORTFOLIO_ASSET_CATEGORY,
          value: portfolioValue,
          liquidity: 'immediate', // Stock portfolio is liquid
        },
      });

      // Save to history
      await saveAssetHistory(newAsset.id, portfolioValue);
      
      // Update net worth
      await saveCurrentMonthNetWorth(userId);

      return { id: newAsset.id, value: portfolioValue };
    }
  } catch (error) {
    console.error('[PortfolioSync] Error syncing portfolio asset:', error);
    return null;
  }
}

/**
 * Calculate portfolio value by analyzing holdings
 * @param userId - The user ID
 * @returns The total portfolio value in ILS or null if failed
 */
async function calculatePortfolioValue(userId: string): Promise<number | null> {
  try {
    // Use shared account to include holdings from all members
    const sharedWhere = await withSharedAccount(userId);
    
    // Fetch holdings and cash balance
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

    if (dbHoldings.length === 0) {
      return cashBalance;
    }

    // Convert to HybridHolding format
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

    // Analyze portfolio
    const analysis = await analyzePortfolio(holdings);
    
    // Total value = equity in ILS + cash balance
    return analysis.equityILS + cashBalance;
  } catch (error) {
    console.error('[PortfolioSync] Error calculating portfolio value:', error);
    return null;
  }
}

/**
 * Sync portfolio assets for all users who have holdings
 * Used for scheduled updates
 * @returns Number of users synced
 */
export async function syncAllPortfolioAssets(): Promise<number> {
  try {
    // Get all unique user IDs with holdings
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
      if (result) {
        syncedCount++;
      }
    }

    return syncedCount;
  } catch (error) {
    console.error('[PortfolioSync] Error syncing all portfolio assets:', error);
    return 0;
  }
}

