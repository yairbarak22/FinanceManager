// ---------------------------------------------------------------------------
// Tip Selection Engine
// ---------------------------------------------------------------------------
//
// Evaluates all tips against user data, resolves exclusion groups,
// ensures domain diversity, and returns categorized selected tips.
//
// Pure function – no DB/API calls.
// ---------------------------------------------------------------------------

import type { TipDefinition, TipTone } from '../catalog/types';
import type { TipEvaluationData, SelectedTip } from '../types';

const MAX_POSITIVE = 5;
const MAX_URGENT = 5;
const MAX_RECOMMENDATIONS = 3;
const MAX_PER_DOMAIN_PER_TONE = 2;

export interface TipSelectionResult {
  positive: SelectedTip[];
  urgent: SelectedTip[];
  recommendations: SelectedTip[];
}

/**
 * Resolve exclusion groups: keep only the highest-priority tip per group.
 */
function resolveExclusionGroups(tips: TipDefinition[]): TipDefinition[] {
  const groups = new Map<string, TipDefinition>();
  const ungrouped: TipDefinition[] = [];

  for (const tip of tips) {
    if (!tip.exclusionGroup) {
      ungrouped.push(tip);
      continue;
    }
    const existing = groups.get(tip.exclusionGroup);
    if (!existing || tip.priority > existing.priority) {
      groups.set(tip.exclusionGroup, tip);
    }
  }

  return [...ungrouped, ...groups.values()];
}

/**
 * Ensure domain diversity: max N tips per domain.
 */
function diversify(tips: TipDefinition[], max: number): TipDefinition[] {
  const domainCount: Record<string, number> = {};
  const result: TipDefinition[] = [];

  for (const tip of tips) {
    if (result.length >= max) break;
    const count = domainCount[tip.domain] ?? 0;
    if (count >= MAX_PER_DOMAIN_PER_TONE) continue;
    domainCount[tip.domain] = count + 1;
    result.push(tip);
  }

  return result;
}

/**
 * Generate tip text from passing definitions.
 */
function generate(
  tips: TipDefinition[],
  data: TipEvaluationData
): SelectedTip[] {
  const results: SelectedTip[] = [];

  for (const tip of tips) {
    try {
      const result = tip.generateTip(data);
      results.push({
        id: tip.id,
        domain: tip.domain,
        tone: tip.tone,
        priority: tip.priority,
        text: result.text,
        scoreImpact: result.scoreImpact,
      });
    } catch {
      // Skip tips that fail to generate
    }
  }

  return results;
}

/**
 * Select the most relevant tips for a user from the full catalog.
 *
 * Pipeline:
 *  1. Evaluate all conditions (safe, try-catch wrapped)
 *  2. Resolve exclusion groups
 *  3. Sort by priority descending within each tone
 *  4. Diversify (max 2 per domain per tone)
 *  5. Cap to max count per tone
 *  6. Generate Hebrew text
 */
export function selectTips(
  data: TipEvaluationData,
  allTips: TipDefinition[]
): TipSelectionResult {
  // Phase 1: Evaluate all conditions
  const passing = allTips.filter((tip) => {
    try {
      return tip.condition(data);
    } catch {
      return false;
    }
  });

  // Phase 2: Resolve exclusion groups
  const afterExclusion = resolveExclusionGroups(passing);

  // Phase 3: Bucket by tone and sort by priority descending
  const byTone: Record<TipTone, TipDefinition[]> = {
    positive: [],
    urgent: [],
    recommendation: [],
  };

  for (const tip of afterExclusion) {
    byTone[tip.tone].push(tip);
  }

  for (const tone of Object.keys(byTone) as TipTone[]) {
    byTone[tone].sort((a, b) => b.priority - a.priority);
  }

  // Phase 4 + 5: Diversify and cap
  const positiveFiltered = diversify(byTone.positive, MAX_POSITIVE);
  const urgentFiltered = diversify(byTone.urgent, MAX_URGENT);
  const recommendationFiltered = diversify(
    byTone.recommendation,
    MAX_RECOMMENDATIONS
  );

  // Phase 6: Generate text
  return {
    positive: generate(positiveFiltered, data),
    urgent: generate(urgentFiltered, data),
    recommendations: generate(recommendationFiltered, data),
  };
}
