// ---------------------------------------------------------------------------
// Financial Health Score – Engine
// ---------------------------------------------------------------------------

import type { TipEvaluationData, FinancialHealthScore, ScoreTier } from '../types';
import {
  scoreCashFlow,
  scoreEmergencyFund,
  scoreDebt,
  scoreSavings,
  scoreBudget,
  scoreGoals,
  scoreNetWorth,
  scoreMaaser,
} from './dimensions';

const TIER_LABELS: Record<ScoreTier, string> = {
  excellent: 'מצוין',
  good: 'טוב',
  fair: 'סביר',
  needs_work: 'דורש שיפור',
  critical: 'דורש טיפול דחוף',
};

function getTier(score: number): ScoreTier {
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 55) return 'fair';
  if (score >= 35) return 'needs_work';
  return 'critical';
}

/**
 * Compute a composite 0-100 financial health score from 8 dimensions.
 *
 * Pure function – no DB/API calls.
 */
export function calculateFinancialHealthScore(
  data: TipEvaluationData
): FinancialHealthScore {
  const dimensions = [
    { dimension: 'cash_flow', label: 'תזרים מזומנים', scorer: scoreCashFlow, weight: 0.20 },
    { dimension: 'emergency_fund', label: 'קרן חירום', scorer: scoreEmergencyFund, weight: 0.15 },
    { dimension: 'debt', label: 'ניהול חובות', scorer: scoreDebt, weight: 0.15 },
    { dimension: 'savings', label: 'חיסכון', scorer: scoreSavings, weight: 0.15 },
    { dimension: 'budget', label: 'עמידה בתקציב', scorer: scoreBudget, weight: 0.10 },
    { dimension: 'goals', label: 'יעדים', scorer: scoreGoals, weight: 0.10 },
    { dimension: 'net_worth', label: 'שווי נקי', scorer: scoreNetWorth, weight: 0.10 },
    { dimension: 'maaser', label: 'מעשרות', scorer: scoreMaaser, weight: 0.05 },
  ];

  const scored = dimensions.map((d) => ({
    dimension: d.dimension,
    label: d.label,
    score: d.scorer(data),
    weight: d.weight,
  }));

  const overall = Math.round(
    scored.reduce((sum, d) => sum + d.score * d.weight, 0)
  );

  const tier = getTier(overall);

  return {
    overall,
    dimensions: scored,
    tier,
    tierLabel: TIER_LABELS[tier],
  };
}
