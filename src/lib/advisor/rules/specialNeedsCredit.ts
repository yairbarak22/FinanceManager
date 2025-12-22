/**
 * 2 נקודות זיכוי בגין ילד עם לקות למידה/התפתחות
 * 
 * תנאי: יש ילדים + עסקאות שמעידות על טיפולים התפתחותיים
 * עדיפות: גבוהה
 */

import { createRule } from '../ruleFactory';
import { hasChildren, hasSpecialNeedsIndicators } from '../helpers';
import { SERVICE_URLS, ESTIMATED_VALUES } from '../constants';

export default createRule({
  id: 'special-needs-tax-credit',
  name: 'זיכוי מס לילד עם לקות',
  
  condition: (ctx) => {
    // Must have children
    if (!hasChildren(ctx)) return false;
    
    // Must have indicators of special needs treatments
    return hasSpecialNeedsIndicators(ctx);
  },
  
  recommendation: {
    title: '2 נקודות זיכוי - ילד עם לקות למידה/התפתחות',
    description: 'זיהינו תשלומים שעשויים להעיד על טיפולים התפתחותיים. הורים לילדים בחינוך מיוחד או שעברו ועדת השמה זכאים ל-2 נקודות זיכוי ממס הכנסה בשווי של כ-5,800 ₪ בשנה.',
    type: 'tax_benefit',
    priority: 'high',
    actionUrl: SERVICE_URLS.SPECIAL_NEEDS_CREDIT,
    potentialValue: ESTIMATED_VALUES.SPECIAL_NEEDS_CREDIT,
  },
});

