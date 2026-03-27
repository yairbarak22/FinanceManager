// ---------------------------------------------------------------------------
// Tips Report Builder – Orchestrator
// ---------------------------------------------------------------------------
//
// Coordinates: data aggregation → scoring → tip selection.
// Returns the complete TipsReportData ready for PDF rendering.
// ---------------------------------------------------------------------------

import type { DateRange } from '@/lib/periodicReport/types';
import type { TipsReportData } from '../types';
import { aggregateForTips } from './aggregateForTips';
import { calculateFinancialHealthScore } from '../score/engine';
import { selectTips } from '../selection/engine';
import { allTips } from '../catalog/registry';

interface ExistingReportData {
  totalIncome: number;
  totalExpenses: number;
  netCashflow: number;
  fixedExpenses: number;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
}

/**
 * Build the full tips report for a user and date range.
 *
 * This is the single entry point called from aggregatePeriodicReportData().
 */
export async function buildTipsReport(
  userId: string,
  dateRange: DateRange,
  existing: ExistingReportData
): Promise<TipsReportData> {
  // 1. Aggregate data (only DB-touching step)
  const tipData = await aggregateForTips(userId, dateRange, existing);

  // 2. Calculate financial health score (pure)
  const score = calculateFinancialHealthScore(tipData);

  // 3. Select tips from catalog (pure)
  const selected = selectTips(tipData, allTips);

  return {
    score,
    positive: selected.positive,
    urgent: selected.urgent,
    recommendations: selected.recommendations,
  };
}
