// ---------------------------------------------------------------------------
// Financial Tips System – Shared Type Definitions
// ---------------------------------------------------------------------------

import type { UserFinancialData } from '@/lib/insights/types';
import type { TipDomain, TipTone } from './catalog/types';

// ---------------------------------------------------------------------------
// Extended evaluation data (superset of UserFinancialData)
// ---------------------------------------------------------------------------

export interface BudgetStatus {
  categoryId: string;
  categoryName: string;
  budgeted: number;
  actual: number;
  overBudgetAmount: number;
  /** actual / budgeted (1.0 = exactly on budget) */
  utilizationRatio: number;
}

export interface TipEvaluationData extends UserFinancialData {
  /** Per-category budget compliance for the current month. */
  budgetStatuses: BudgetStatus[];

  /** Savings rate: (income – expenses) / income.  0 when income is 0. */
  savingsRate: number;

  /** Net worth from previous month (null for first-month users). */
  previousNetWorth: number | null;

  /** Current net worth. */
  currentNetWorth: number;

  /** Number of expense categories exceeding budget. */
  categoriesOverBudget: number;

  /** Total budget utilization: sum(actual) / sum(budgeted). */
  totalBudgetUtilization: number;
}

// ---------------------------------------------------------------------------
// Scoring output
// ---------------------------------------------------------------------------

export interface DimensionScore {
  dimension: string;
  /** Hebrew label for display. */
  label: string;
  /** Score 0-100 for this dimension. */
  score: number;
  /** Weight in overall composite (0-1, all weights sum to 1). */
  weight: number;
}

export type ScoreTier =
  | 'excellent'
  | 'good'
  | 'fair'
  | 'needs_work'
  | 'critical';

export interface FinancialHealthScore {
  /** Overall composite score 0-100. */
  overall: number;
  /** Breakdown by dimension. */
  dimensions: DimensionScore[];
  /** Hebrew label for the score tier. */
  tierLabel: string;
  /** Score tier for visual styling. */
  tier: ScoreTier;
}

// ---------------------------------------------------------------------------
// Selected tip (ready for rendering)
// ---------------------------------------------------------------------------

export interface SelectedTip {
  id: string;
  domain: TipDomain;
  tone: TipTone;
  priority: number;
  /** Hebrew tip text. */
  text: string;
  scoreImpact?: number;
}

// ---------------------------------------------------------------------------
// Full tips report payload (attached to PeriodicReportData)
// ---------------------------------------------------------------------------

export interface TipsReportData {
  score: FinancialHealthScore;
  /** חיזוקים חיוביים – max 5. */
  positive: SelectedTip[];
  /** דברים שדורשים טיפול דחוף – max 5. */
  urgent: SelectedTip[];
  /** המלצות – max 3. */
  recommendations: SelectedTip[];
}
