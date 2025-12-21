/**
 * Financial Advisor Engine - Rule Factory
 * יוצר חוקים בצורה פשוטה ואחידה
 */

import { FinancialContext, FinancialRule, RuleConfig, Recommendation } from './types';

/**
 * Create a financial rule from a simple configuration object.
 * This makes it easy to add new rules with minimal boilerplate.
 * 
 * @example
 * ```typescript
 * export default createRule({
 *   id: 'my-rule',
 *   name: 'שם החוק',
 *   condition: (ctx) => ctx.user.profile?.militaryStatus === 'career',
 *   recommendation: {
 *     title: 'כותרת ההמלצה',
 *     description: 'תיאור מפורט...',
 *     type: 'savings',
 *     priority: 'high',
 *   }
 * });
 * ```
 */
export function createRule(config: RuleConfig): FinancialRule {
  return {
    id: config.id,
    name: config.name,
    
    async evaluate(context: FinancialContext): Promise<Recommendation | null> {
      try {
        // Check if condition is met
        const conditionResult = config.condition(context);
        const isMet = conditionResult instanceof Promise 
          ? await conditionResult 
          : conditionResult;
        
        if (!isMet) {
          return null;
        }
        
        // Return recommendation with ID
        return {
          id: config.id,
          ...config.recommendation,
        };
      } catch (error) {
        console.error(`Error evaluating rule ${config.id}:`, error);
        return null;
      }
    },
  };
}

