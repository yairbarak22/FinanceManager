/**
 * הלוואות ללא ריבית - עוגן
 * 
 * תנאי: הלוואות בריבית גבוהה (>6%) או עצמאי עם תזרים שלילי
 * עדיפות: גבוהה
 */

import { createRule } from '../ruleFactory';
import { hasHighInterestDebt, isSelfEmployed, hasNegativeCashFlow, getHighestInterestRate } from '../helpers';
import { SERVICE_URLS, INTEREST_THRESHOLDS } from '../constants';

export default createRule({
  id: 'ogen-interest-free-loans',
  name: 'הלוואות עוגן ללא ריבית',
  
  condition: (ctx) => {
    // Option 1: Has high interest debt
    const hasExpensiveDebt = hasHighInterestDebt(ctx, INTEREST_THRESHOLDS.HIGH_INTEREST_RATE);
    
    // Option 2: Self-employed with negative cash flow
    const selfEmployedInTrouble = isSelfEmployed(ctx) && hasNegativeCashFlow(ctx);
    
    return hasExpensiveDebt || selfEmployedInTrouble;
  },
  
  recommendation: {
    title: 'הלוואות ללא ריבית - עמותת עוגן',
    description: 'עמותת עוגן מציעה הלוואות ללא ריבית לאנשים במצוקה כלכלית. ניתן להשתמש בהלוואה לסגירת חובות בריבית גבוהה ולהחליף אותם בהלוואה ללא ריבית.',
    type: 'banking',
    priority: 'high',
    actionUrl: SERVICE_URLS.OGEN_LOANS,
  },
});

