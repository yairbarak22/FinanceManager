// ---------------------------------------------------------------------------
// Financial Health Score – Dimension Scorers
// ---------------------------------------------------------------------------
//
// Each function is a pure scorer: TipEvaluationData → number (0-100).
// No DB calls, no side effects.
// ---------------------------------------------------------------------------

import type { TipEvaluationData } from '../types';

/** Clamp value between min and max. */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Linearly map a value from [inMin, inMax] → [outMin, outMax]. */
function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  if (inMax === inMin) return (outMin + outMax) / 2;
  return outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin);
}

/** Count consecutive positive/negative cashflow months from historicalData. */
function countConsecutiveCashflowTrend(
  data: TipEvaluationData
): number {
  const months = data.historicalData;
  if (months.length === 0) return 0;

  const firstDirection = months[0].netCashflow >= 0 ? 1 : -1;
  let count = 0;
  for (const m of months) {
    if ((m.netCashflow >= 0 ? 1 : -1) === firstDirection) {
      count++;
    } else {
      break;
    }
  }
  return firstDirection * count;
}

// ---------------------------------------------------------------------------
// 1. Cash Flow (weight: 20%)
// ---------------------------------------------------------------------------

export function scoreCashFlow(data: TipEvaluationData): number {
  if (data.totalIncome === 0) return 0;

  const ratio = data.netCashflow / data.totalIncome;
  // ratio >= 0.20 (saving 20%+) → 100, ratio == 0 → 50, ratio <= -0.10 → 0
  let base = clamp(mapRange(ratio, -0.1, 0.2, 0, 100), 0, 100);

  // Trend bonus/penalty: consecutive positive/negative months
  const trend = countConsecutiveCashflowTrend(data);
  if (trend > 0) base = Math.min(100, base + trend * 5);
  if (trend < 0) base = Math.max(0, base + trend * 5);

  return Math.round(base);
}

// ---------------------------------------------------------------------------
// 2. Emergency Fund (weight: 15%)
// ---------------------------------------------------------------------------

export function scoreEmergencyFund(data: TipEvaluationData): number {
  if (data.totalExpenses === 0) return 50;

  const months = data.cashBalance / data.totalExpenses;
  // 0 months → 0, 3 months → 70, 6+ months → 100
  return Math.round(clamp(mapRange(months, 0, 6, 0, 100), 0, 100));
}

// ---------------------------------------------------------------------------
// 3. Debt Management (weight: 15%)
// ---------------------------------------------------------------------------

export function scoreDebt(data: TipEvaluationData): number {
  if (data.totalLiabilities === 0) return 100; // no debt = perfect

  if (data.annualIncome === 0) return 0;

  const dti = data.totalLiabilities / data.annualIncome;
  // dti == 0 → 100, dti == 0.5 → 50, dti >= 1.0 → 0
  return Math.round(clamp(mapRange(dti, 0, 1.0, 100, 0), 0, 100));
}

// ---------------------------------------------------------------------------
// 4. Savings Rate (weight: 15%)
// ---------------------------------------------------------------------------

export function scoreSavings(data: TipEvaluationData): number {
  if (data.totalIncome === 0) return 0;

  // savingsRate is pre-computed in TipEvaluationData
  const rate = data.savingsRate;
  // rate <= 0 → 0, rate == 0.10 → 50, rate >= 0.25 → 100
  return Math.round(clamp(mapRange(rate, 0, 0.25, 0, 100), 0, 100));
}

// ---------------------------------------------------------------------------
// 5. Budget Compliance (weight: 10%)
// ---------------------------------------------------------------------------

export function scoreBudget(data: TipEvaluationData): number {
  // If user has no budgets set, return neutral score
  if (data.budgetStatuses.length === 0) return 50;

  const total = data.budgetStatuses.length;
  const withinBudget = data.budgetStatuses.filter(
    (b) => b.utilizationRatio <= 1.0
  ).length;

  const complianceRate = withinBudget / total;
  // 100% compliance → 100, 50% → 50, 0% → 0
  return Math.round(complianceRate * 100);
}

// ---------------------------------------------------------------------------
// 6. Goal Progress (weight: 10%)
// ---------------------------------------------------------------------------

export function scoreGoals(data: TipEvaluationData): number {
  if (data.goals.length === 0) return 50; // no goals = neutral

  // Average percentage across all goals, capped at 100
  const avgProgress =
    data.goals.reduce((sum, g) => sum + Math.min(g.percentage, 100), 0) /
    data.goals.length;

  return Math.round(clamp(avgProgress, 0, 100));
}

// ---------------------------------------------------------------------------
// 7. Net Worth Trend (weight: 10%)
// ---------------------------------------------------------------------------

export function scoreNetWorth(data: TipEvaluationData): number {
  if (data.previousNetWorth === null) return 50; // first month, neutral

  const prev = data.previousNetWorth;
  const curr = data.currentNetWorth;

  if (prev === 0) {
    return curr > 0 ? 80 : curr < 0 ? 20 : 50;
  }

  const changePercent = ((curr - prev) / Math.abs(prev)) * 100;
  // -10% → 0, 0% → 50, +10% → 100
  return Math.round(clamp(mapRange(changePercent, -10, 10, 0, 100), 0, 100));
}

// ---------------------------------------------------------------------------
// 8. Maaser Compliance (weight: 5%)
// ---------------------------------------------------------------------------

export function scoreMaaser(data: TipEvaluationData): number {
  if (data.netIncome === 0) return 50;

  // maaserExpenses / netIncome should be >= 10%
  const maaserRate = data.maaserExpenses / data.netIncome;
  // 0% → 0, 10% → 100 (above 10% still 100)
  return Math.round(clamp(mapRange(maaserRate, 0, 0.1, 0, 100), 0, 100));
}
