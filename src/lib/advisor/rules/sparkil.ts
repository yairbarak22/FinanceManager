/**
 * הלוואת SparkIL לעצמאים (ללא ריבית)
 * 
 * תנאי: עצמאי + עסק קטן
 * עדיפות: בינונית
 */

import { createRule } from '../ruleFactory';
import { isSelfEmployed, hasNegativeCashFlow, hasHighInterestDebt } from '../helpers';
import { SERVICE_URLS } from '../constants';

export default createRule({
  id: 'sparkil-interest-free',
  name: 'הלוואת SparkIL לעצמאים',
  
  condition: (ctx) => {
    // Must be self-employed
    if (!isSelfEmployed(ctx)) return false;
    
    // Either has cash flow issues or expensive debt
    return hasNegativeCashFlow(ctx) || hasHighInterestDebt(ctx, 5);
  },
  
  recommendation: {
    title: 'הלוואה ללא ריבית לעצמאים - SparkIL',
    description: 'פלטפורמת SparkIL מציעה הלוואות ללא ריבית לעצמאים ובעלי עסקים קטנים. הלוואות עד 90,000 ₪ לפיתוח העסק - חיסכון משמעותי בריבית.',
    type: 'banking',
    priority: 'medium',
    actionUrl: SERVICE_URLS.SPARKIL,
    potentialValue: 4000,
  },
});

