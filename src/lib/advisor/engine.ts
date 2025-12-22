/**
 * Financial Advisor Engine - Main Engine
 * המנוע הראשי שמריץ את כל החוקים ומחזיר המלצות
 */

import { FinancialContext, FinancialRule, Recommendation, PRIORITY_ORDER } from './types';

// Import existing rules
import careerHousingRule from './rules/careerHousing';
import ogenLoansRule from './rules/ogenLoans';
import donations46Rule from './rules/donations46';
import reserveBonusRule from './rules/reserveBonus';
import arbitrageRule from './rules/arbitrage';

// Import new rules - Category 1: Leverage & Arbitrage
import kerenLeverageRule from './rules/kerenLeverage';
import consumerClubLoansRule from './rules/consumerClubLoans';
import sparkilRule from './rules/sparkil';
import kerenIRARule from './rules/kerenIRA';

// Import new rules - Category 2: Tax Benefits
import workGrantRule from './rules/workGrant';
import specialNeedsCreditRule from './rules/specialNeedsCredit';
import lifeInsuranceCreditRule from './rules/lifeInsuranceCredit';
import rentTaxExemptRule from './rules/rentTaxExempt';
import solarTaxExemptRule from './rules/solarTaxExempt';

// Import new rules - Category 3: Consumer Rights
import miliumArnonaRule from './rules/miliumArnona';
import savingsForChildRule from './rules/savingsForChild';
import harHakesefRule from './rules/harHakesef';
import bituachLeumiRefundRule from './rules/bituachLeumiRefund';
import daycareSubsidyRule from './rules/daycareSubsidy';
import bankFeesRule from './rules/bankFees';
import studentBankBenefitsRule from './rules/studentBankBenefits';
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
  donations46Rule,
  reserveBonusRule,
  arbitrageRule,
  
  // Category 1: Leverage & Arbitrage (4 rules)
  kerenLeverageRule,
  consumerClubLoansRule,
  sparkilRule,
  kerenIRARule,
  
  // Category 2: Tax Benefits (5 rules)
  workGrantRule,
  specialNeedsCreditRule,
  lifeInsuranceCreditRule,
  rentTaxExemptRule,
  solarTaxExemptRule,
  
  // Category 3: Consumer Rights (8 rules)
  miliumArnonaRule,
  savingsForChildRule,
  harHakesefRule,
  bituachLeumiRefundRule,
  daycareSubsidyRule,
  bankFeesRule,
  studentBankBenefitsRule,
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
