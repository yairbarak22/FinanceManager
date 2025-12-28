/**
 * Financial Advisor Engine - Main Engine
 * המנוע הראשי שמריץ את כל החוקים ומחזיר המלצות
 */

import { FinancialContext, FinancialRule, Recommendation, PRIORITY_ORDER } from './types';

// Import existing rules
import careerHousingRule from './rules/careerHousing';
import ogenLoansRule from './rules/ogenLoans';
import ogenReservistLoanRule from './rules/ogenReservistLoan';
import donations46Rule from './rules/donations46';
import reserveBonusRule from './rules/reserveBonus';

// Import rules - Category 1: Leverage & Arbitrage
import kerenLeverageRule from './rules/kerenLeverage';
import consumerClubLoansRule from './rules/consumerClubLoans';
import sparkilRule from './rules/sparkil';
import kerenIRARule from './rules/kerenIRA';

// Import rules - Category 2: Tax Benefits
import lifeInsuranceCreditRule from './rules/lifeInsuranceCredit';
import rentTaxExemptRule from './rules/rentTaxExempt';

// Import rules - Category 3: Consumer Rights
import miliumArnonaRule from './rules/miliumArnona';
import savingsForChildRule from './rules/savingsForChild';
import harHakesefRule from './rules/harHakesef';
import daycareSubsidyRule from './rules/daycareSubsidy';
import kerenHishtalmutMaxRule from './rules/kerenHishtalmutMax';

/**
 * All registered rules
 * To add a new rule:
 * 1. Create a new file in ./rules/ using _template.ts as a base
 * 2. Import it here
 * 3. Add it to this array
 */
const ALL_RULES: FinancialRule[] = [
  // Existing rules
  careerHousingRule,
  ogenLoansRule,
  ogenReservistLoanRule,
  donations46Rule,
  reserveBonusRule,

  // Category 1: Leverage & Arbitrage
  kerenLeverageRule,
  consumerClubLoansRule,
  sparkilRule,
  kerenIRARule,

  // Category 2: Tax Benefits
  lifeInsuranceCreditRule,
  rentTaxExemptRule,

  // Category 3: Consumer Rights
  miliumArnonaRule,
  savingsForChildRule,
  harHakesefRule,
  daycareSubsidyRule,
  kerenHishtalmutMaxRule,
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
