import type {
  UserFinancialData,
  FinancialRule,
  FinancialInsight,
  InsightCategory,
  InsightTone,
} from './types';

const DEFAULT_MAX_INSIGHTS = 5;

// ---------------------------------------------------------------------------
// Tone derivation – auto-derive from priority, allow rule override
// ---------------------------------------------------------------------------

function deriveTone(priority: number): InsightTone {
  if (priority >= 9) return 'alert';
  if (priority >= 6) return 'recommendation';
  return 'positive';
}

// ---------------------------------------------------------------------------
// Phase 1 – Filter: evaluate every rule safely
// ---------------------------------------------------------------------------

function filterPassingRules(
  data: UserFinancialData,
  rules: FinancialRule[]
): FinancialRule[] {
  return rules.filter((rule) => {
    try {
      return rule.condition(data);
    } catch {
      return false;
    }
  });
}

// ---------------------------------------------------------------------------
// Phase 2 – Sort by priority descending
// ---------------------------------------------------------------------------

function sortByPriority(rules: FinancialRule[]): FinancialRule[] {
  return [...rules].sort((a, b) => b.priority - a.priority);
}

// ---------------------------------------------------------------------------
// Phase 3 – Conflict resolution (budget-pool deduction)
//
// Rules that declare `requiredFreeCashFlow` compete for the same pool.
// We walk from highest priority to lowest; if a rule's cost exceeds
// the remaining pool it is dropped.
// Rules without `requiredFreeCashFlow` always pass.
// ---------------------------------------------------------------------------

function resolveConflicts(
  sorted: FinancialRule[],
  freeCashFlow: number
): FinancialRule[] {
  let budget = Math.max(freeCashFlow, 0);
  const accepted: FinancialRule[] = [];

  for (const rule of sorted) {
    const cost = rule.requiredFreeCashFlow;
    if (cost !== undefined && cost > 0) {
      if (budget >= cost) {
        budget -= cost;
        accepted.push(rule);
      }
      // else: skip – not enough budget
    } else {
      accepted.push(rule);
    }
  }

  return accepted;
}

// ---------------------------------------------------------------------------
// Phase 4 – Generate insight objects
// ---------------------------------------------------------------------------

function generateInsights(
  data: UserFinancialData,
  rules: FinancialRule[],
  max: number
): FinancialInsight[] {
  const insights: FinancialInsight[] = [];

  for (const rule of rules) {
    if (insights.length >= max) break;
    try {
      const result = rule.generateInsight(data);
      insights.push({
        id: rule.id,
        category: rule.category,
        priority: rule.priority,
        tone: result.tone ?? deriveTone(rule.priority),
        message: result.message,
        action: result.action,
      });
    } catch {
      // Skip rules that fail during message generation
    }
  }

  return insights;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Evaluate all rules against the user's financial data and return the
 * top N actionable insights, conflict-resolved.
 *
 * @param categories - optional set of categories to evaluate (for
 *   performance when only a subset of data changed). When omitted all
 *   rules are evaluated.
 */
export function evaluateRules(
  data: UserFinancialData,
  rules: FinancialRule[],
  options?: {
    maxInsights?: number;
    categories?: InsightCategory[];
  }
): FinancialInsight[] {
  const max = options?.maxInsights ?? DEFAULT_MAX_INSIGHTS;

  // Optional category filter for scalability
  const applicableRules = options?.categories
    ? rules.filter((r) => options.categories!.includes(r.category))
    : rules;

  const passing = filterPassingRules(data, applicableRules);
  const sorted = sortByPriority(passing);
  const resolved = resolveConflicts(sorted, data.freeCashFlow);

  return generateInsights(data, resolved, max);
}
