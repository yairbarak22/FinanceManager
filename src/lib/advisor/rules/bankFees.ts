/**
 * מעבר מסלול עמלות בנק
 * 
 * תנאי: עמלות גבוהות
 * עדיפות: נמוכה
 */

import { createRule } from '../ruleFactory';
import { getMonthlyBankFees, isEmployee, isStudent } from '../helpers';
import { SERVICE_URLS, BALANCE_THRESHOLDS } from '../constants';

export default createRule({
  id: 'bank-fees-track-change',
  name: 'מעבר למסלול עמלות מוזל',
  
  condition: (ctx) => {
    // Must be regular consumer (not business account)
    if (!isEmployee(ctx) && !isStudent(ctx)) return false;
    
    // Check if bank fees are high
    const monthlyFees = getMonthlyBankFees(ctx);
    return monthlyFees > BALANCE_THRESHOLDS.BANK_FEES_HIGH;
  },
  
  recommendation: {
    title: 'מעבר למסלול עמלות מוזל בבנק',
    description: 'הבנקים מחויבים להציע מסלול עמלות בפיקוח (כ-10 ₪ לחודש). רוב הלקוחות משלמים "לפי פעולה" ומגיעים לסכומים כפולים. פנה/י לבנק לבירור.',
    type: 'banking',
    priority: 'low',
    actionUrl: SERVICE_URLS.BANK_FEES_INFO,
    potentialValue: 200,
  },
});

