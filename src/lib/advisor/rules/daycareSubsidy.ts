/**
 * סבסוד מעונות יום (תמ"ת)
 * 
 * תנאי: יש ילדים + תשלומים למעון
 * עדיפות: גבוהה
 */

import { createRule } from '../ruleFactory';
import { hasChildren, paysDaycare, isEmployee, isSelfEmployed } from '../helpers';
import { SERVICE_URLS, ESTIMATED_VALUES } from '../constants';

export default createRule({
  id: 'daycare-subsidy-tmat',
  name: 'סבסוד מעונות יום',
  
  condition: (ctx) => {
    // Must have children
    if (!hasChildren(ctx)) return false;
    
    // Must be working (employed or self-employed)
    if (!isEmployee(ctx) && !isSelfEmployed(ctx)) return false;
    
    // Must have daycare payments
    return paysDaycare(ctx);
  },
  
  recommendation: {
    title: 'סבסוד מעונות יום (תמ"ת)',
    description: 'זיהינו תשלומים למעון יום. המדינה מסבסדת שכר לימוד במעונות מוכרים על בסיס מבחן הכנסה. הסבסוד יכול להגיע עד 2,500 ₪ לחודש.',
    type: 'general',
    priority: 'high',
    actionUrl: SERVICE_URLS.DAYCARE_SUBSIDY,
    potentialValue: ESTIMATED_VALUES.DAYCARE_SUBSIDY_MAX,
  },
});

