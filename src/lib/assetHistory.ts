import { prisma } from '@/lib/prisma';

/**
 * Get the current month key in YYYY-MM format
 */
export function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Save asset value history for a specific month
 * Uses upsert to avoid duplicates (unique constraint on [assetId, monthKey])
 * 
 * @param assetId - The asset ID
 * @param value - The asset value to save
 * @param monthKey - Optional month key (defaults to current month)
 */
export async function saveAssetHistory(
  assetId: string,
  value: number,
  monthKey?: string
): Promise<void> {
  const month = monthKey || getCurrentMonthKey();
  
  await prisma.assetValueHistory.upsert({
    where: {
      assetId_monthKey: {
        assetId,
        monthKey: month,
      },
    },
    update: {
      value,
    },
    create: {
      assetId,
      value,
      monthKey: month,
    },
  });
}

/**
 * Save asset history only if value has changed from the previous value
 * This is an optimization to avoid unnecessary writes
 * 
 * @param assetId - The asset ID
 * @param newValue - The new asset value
 * @param previousValue - The previous asset value
 * @param monthKey - Optional month key (defaults to current month)
 */
export async function saveAssetHistoryIfChanged(
  assetId: string,
  newValue: number,
  previousValue: number,
  monthKey?: string
): Promise<void> {
  if (newValue !== previousValue) {
    await saveAssetHistory(assetId, newValue, monthKey);
  }
}

/**
 * Get asset value for a specific month from history
 * Returns the current value if no history exists for that month
 * 
 * @param assetId - The asset ID
 * @param monthKey - The month key to look up
 * @param currentValue - The current asset value (fallback)
 */
export async function getAssetValueForMonth(
  assetId: string,
  monthKey: string,
  currentValue: number
): Promise<number> {
  const history = await prisma.assetValueHistory.findUnique({
    where: {
      assetId_monthKey: {
        assetId,
        monthKey,
      },
    },
  });
  
  return history ? history.value : currentValue;
}

