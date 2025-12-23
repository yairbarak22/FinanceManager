/**
 * הכפלת חיסכון לכל ילד
 * 
 * תנאי: יש ילדים
 * עדיפות: גבוהה
 */

import { createRule } from '../ruleFactory';
import { hasChildren, getChildrenCount } from '../helpers';
import { SERVICE_URLS, ESTIMATED_VALUES } from '../constants';

export default createRule({
  id: 'double-child-savings',
  name: 'הכפלת חיסכון לכל ילד',
  
  condition: (ctx) => {
    return hasChildren(ctx) && getChildrenCount(ctx) > 0;
  },

  getEligibilityReason: (ctx) => {
    const kidsCount = getChildrenCount(ctx);
    const totalSavings = kidsCount * ESTIMATED_VALUES.CHILD_SAVINGS_TOTAL;
    
    return `מספר ילדים: ${kidsCount}. הפקדה נוספת של 57₪ לחודש לכל ילד יכולה להביא לחיסכון כולל של כ-${totalSavings.toLocaleString()}₪ (${kidsCount} ילדים × ${ESTIMATED_VALUES.CHILD_SAVINGS_TOTAL.toLocaleString()}₪)`;
  },
  
  recommendation: {
    title: 'הכפלת חיסכון לכל ילד',
    description: 'המדינה מפקידה 57 ₪ לכל ילד מדי חודש. ניתן להוסיף 57 ₪ נוספים מקצבת הילדים להכפלת החיסכון. בסוף התקופה, זה יכול להגיע ל-20,000 ₪+ לילד.',
    type: 'savings',
    priority: 'high',
    actionUrl: SERVICE_URLS.SAVINGS_FOR_CHILD,
    potentialValue: ESTIMATED_VALUES.CHILD_SAVINGS_TOTAL,
  },
});

