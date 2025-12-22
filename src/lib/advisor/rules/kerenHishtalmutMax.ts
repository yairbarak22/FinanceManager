/**
 * מיצוי תקרת הפקדה לקרן השתלמות (עצמאים)
 * 
 * תנאי: עצמאי + תזרים חופשי
 * עדיפות: גבוהה
 */

import { createRule } from '../ruleFactory';
import { isSelfEmployed, hasPositiveCashFlow, getMonthlyCashFlow } from '../helpers';
import { SERVICE_URLS } from '../constants';

export default createRule({
  id: 'keren-hishtalmut-max-deposit',
  name: 'מיצוי תקרת קרן השתלמות',
  
  condition: (ctx) => {
    // Must be self-employed
    if (!isSelfEmployed(ctx)) return false;
    
    // Must have positive cash flow (ability to save)
    if (!hasPositiveCashFlow(ctx)) return false;
    
    // Should have meaningful surplus (at least 1,500 NIS/month)
    return getMonthlyCashFlow(ctx) >= 1500;
  },
  
  recommendation: {
    title: 'מיצוי תקרת קרן השתלמות לעצמאים',
    description: 'הטבת המס החזקה ביותר בישראל! הפקדה עד התקרה (כ-20,500 ₪ בשנה) מעניקה ניכוי מס ופטור ממס רווח הון על הרווחים. השווי המשוער: כ-7,000 ₪ בשנה.',
    type: 'tax_benefit',
    priority: 'high',
    actionUrl: SERVICE_URLS.KEREN_HISHTALMUT_SELF,
    potentialValue: 7000,
  },
});

