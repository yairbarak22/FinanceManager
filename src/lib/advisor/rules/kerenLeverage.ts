/**
 * מינוף קרן השתלמות
 * 
 * תנאי: יש קה"ש עם ערך משמעותי + חוב בריבית גבוהה
 * עדיפות: גבוהה
 */

import { createRule } from '../ruleFactory';
import { hasKerenHishtalmut, hasHighInterestDebt, getKerenHishtalmutValue } from '../helpers';
import { SERVICE_URLS, BALANCE_THRESHOLDS, INTEREST_THRESHOLDS } from '../constants';

export default createRule({
  id: 'keren-hishtalmut-leverage',
  name: 'מינוף קרן השתלמות',
  
  condition: (ctx) => {
    // Must have Keren Hishtalmut with significant value
    if (!hasKerenHishtalmut(ctx)) return false;
    if (getKerenHishtalmutValue(ctx) < BALANCE_THRESHOLDS.KEREN_HISHTALMUT_LEVERAGE) return false;
    
    // Must have expensive debt that could be replaced
    return hasHighInterestDebt(ctx, INTEREST_THRESHOLDS.KEREN_LOAN_RATE);
  },
  
  recommendation: {
    title: 'הלוואה מקרן השתלמות במקום חובות יקרים',
    description: 'במקום לשלם ריבית גבוהה על הלוואות, ניתן לקחת הלוואה כנגד קרן ההשתלמות בריבית פריים מינוס (כ-5%). הכסף בקרן ממשיך להרוויח תשואה, וההפרש הוא רווח נקי.',
    type: 'banking',
    priority: 'high',
    actionUrl: SERVICE_URLS.KEREN_LOAN,
    potentialValue: 5000,
  },
});

