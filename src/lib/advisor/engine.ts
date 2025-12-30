/**
 * Financial Advisor Engine - Main Engine
 * המנוע הראשי שמריץ את כל החוקים ומחזיר המלצות
 *
 * מבנה חדש:
 * - strategies: המלצות אסטרטגיות (מאקרו) - הקצאת הון כללית
 * - benefits: הטבות ספציפיות (מיקרו) - זכויות, הטבות מס, חסכונות
 */

import { FinancialContext, FinancialRule, Recommendation, AdvisorResponse, PRIORITY_ORDER } from './types';

// Import existing rules (legacy - will be categorized as benefits)
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

// Import new Strategy rules
import { firstHomePurchaseRule, investExcessCashRule, payOffDebtRule } from './rules/strategy';

// Import new Benefit rules
import { reservistRightsRule, selfEmployedKerenHishtalmutRule, childTaxCreditsRule } from './rules/benefits';

/**
 * All registered rules
 * To add a new rule:
 * 1. Create a new file in ./rules/ using _template.ts as a base
 * 2. Import it here
 * 3. Add it to this array
 */
const ALL_RULES: FinancialRule[] = [
  // === STRATEGY RULES (Macro) ===
  firstHomePurchaseRule,
  investExcessCashRule,
  payOffDebtRule,

  // === BENEFIT RULES (Micro) ===
  // New benefit rules
  reservistRightsRule,
  selfEmployedKerenHishtalmutRule,
  childTaxCreditsRule,

  // Legacy rules (default to 'benefit' category)
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
   * Returns structured response with strategies and benefits separated
   */
  async generateRecommendations(context: FinancialContext): Promise<AdvisorResponse> {
    // Run all rules in parallel
    const results = await Promise.all(
      this.rules.map(rule => rule.evaluate(context))
    );

    // Filter out nulls
    const allRecommendations = results.filter((r): r is Recommendation => r !== null);

    // Sort by priority (high > medium > low)
    const sortByPriority = (a: Recommendation, b: Recommendation) =>
      PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority];

    // Split into strategies and benefits
    const strategies = allRecommendations
      .filter(r => r.category === 'strategy')
      .sort(sortByPriority);

    const benefits = allRecommendations
      .filter(r => r.category === 'benefit')
      .sort(sortByPriority);

    // Calculate stats
    const totalPotentialValue = allRecommendations.reduce(
      (sum, r) => sum + (r.potentialValue ?? 0),
      0
    );

    return {
      strategies,
      benefits,
      stats: {
        totalPotentialValue,
        activeRulesCount: allRecommendations.length,
      },
    };
  }

  /**
   * Legacy method - returns flat array (for backward compatibility)
   * @deprecated Use generateRecommendations() instead
   */
  async generateRecommendationsLegacy(context: FinancialContext): Promise<Recommendation[]> {
    const response = await this.generateRecommendations(context);
    return [...response.strategies, ...response.benefits];
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
 * Returns structured AdvisorResponse with strategies and benefits
 */
export async function generateRecommendations(
  context: FinancialContext
): Promise<AdvisorResponse> {
  return advisorEngine.generateRecommendations(context);
}

/**
 * Legacy convenience function - returns flat array
 * @deprecated Use generateRecommendations() instead
 */
export async function generateRecommendationsLegacy(
  context: FinancialContext
): Promise<Recommendation[]> {
  return advisorEngine.generateRecommendationsLegacy(context);
}
