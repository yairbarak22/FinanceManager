import { Asset, AssetValueHistory } from '@/lib/types';

/**
 * Get the current month key in YYYY-MM format
 */
export function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Get asset value for a specific month from history array
 * Returns the current value if no history exists for that month
 * 
 * @param asset - The asset object
 * @param history - Array of all asset history records
 * @param monthKey - The month key to look up (YYYY-MM format)
 */
export function getAssetValueForMonth(
  asset: Asset,
  history: AssetValueHistory[],
  monthKey: string
): number {
  // If it's the current month or 'all', return current value
  if (monthKey === 'all' || monthKey === getCurrentMonthKey()) {
    return asset.value;
  }
  
  // Find history record for this asset and month
  const historyRecord = history.find(
    h => h.assetId === asset.id && h.monthKey === monthKey
  );
  
  // Return historical value or fall back to current value
  return historyRecord ? historyRecord.value : asset.value;
}

/**
 * Calculate total assets value for a specific month
 * 
 * @param assets - Array of asset objects
 * @param history - Array of all asset history records
 * @param monthKey - The month key to calculate for (YYYY-MM format)
 */
export function getTotalAssetsForMonth(
  assets: Asset[],
  history: AssetValueHistory[],
  monthKey: string
): number {
  return assets.reduce(
    (sum, asset) => sum + getAssetValueForMonth(asset, history, monthKey),
    0
  );
}

