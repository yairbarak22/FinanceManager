/**
 * Financial Advisor Engine - Main Engine
 * המנוע הראשי שמריץ את כל החוקים ומחזיר המלצות
 */

import { FinancialContext, FinancialRule, Recommendation, PRIORITY_ORDER } from './types';

// Import all rules
import careerHousingRule from './rules/careerHousing';
import ogenLoansRule from './rules/ogenLoans';
import donations46Rule from './rules/donations46';
import reserveBonusRule from './rules/reserveBonus';
import arbitrageRule from './rules/arbitrage';

/**
 * All registered rules
 * To add a new rule:
 * 1. Create a new file in ./rules/ using _template.ts as a base
 * 2. Import it here
 * 3. Add it to this array
 */
const ALL_RULES: FinancialRule[] = [
  careerHousingRule,
  ogenLoansRule,
  donations46Rule,
  reserveBonusRule,
  arbitrageRule,
];

/**
 * Advisor Engine class
 * Runs all registered rules and returns sorted recommendations
 */
export class AdvisorEngine {
  private rules: FinancialRule[];

  constructor(rules: FinancialRule[] = ALL_RULES) {
    this.rules = rules;
  }

  /**
   * Generate recommendations for a given financial context
   * Runs all rules in parallel and returns sorted results
   */
  async generateRecommendations(context: FinancialContext): Promise<Recommendation[]> {
    // Run all rules in parallel
    const results = await Promise.all(
      this.rules.map(rule => rule.evaluate(context))
    );

    // Filter out nulls and sort by priority
    const recommendations = results
      .filter((r): r is Recommendation => r !== null)
      .sort((a, b) => PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority]);

    return recommendations;
  }

  /**
   * Get the number of registered rules
   */
  getRuleCount(): number {
    return this.rules.length;
  }

  /**
   * Get all rule names
   */
  getRuleNames(): string[] {
    return this.rules.map(r => r.name);
  }
}

// Default engine instance
export const advisorEngine = new AdvisorEngine();

/**
 * Convenience function to generate recommendations
 */
export async function generateRecommendations(
  context: FinancialContext
): Promise<Recommendation[]> {
  return advisorEngine.generateRecommendations(context);
}

