/**
 * מענק עבודה (מס שלילי)
 * 
 * תנאי: הכנסה נמוכה-בינונית + גיל מתאים
 * עדיפות: גבוהה
 */

import { createRule } from '../ruleFactory';
import { hasChildren, getEstimatedAge, getRealEstateCount } from '../helpers';
import { INCOME_THRESHOLDS, AGE_THRESHOLDS, SERVICE_URLS, ESTIMATED_VALUES } from '../constants';

export default createRule({
  id: 'work-grant-negative-tax',
  name: 'מענק עבודה (מס שלילי)',
  
  condition: (ctx) => {
    const age = getEstimatedAge(ctx);
    if (!age) return false;
    
    // Age requirement depends on children
    const minAge = hasChildren(ctx) 
      ? AGE_THRESHOLDS.WORK_GRANT_WITH_CHILDREN 
      : AGE_THRESHOLDS.WORK_GRANT_WITHOUT_CHILDREN;
    if (age < minAge) return false;
    
    // Income must be in eligible range
    const income = ctx.metrics.monthlyIncome;
    if (income < INCOME_THRESHOLDS.WORK_GRANT_MIN) return false;
    if (income > INCOME_THRESHOLDS.WORK_GRANT_MAX) return false;
    
    // Max 1 property
    if (getRealEstateCount(ctx) > 1) return false;
    
    return true;
  },
  
  recommendation: {
    title: 'מענק עבודה (מס שלילי)',
    description: 'בהתבסס על רמת ההכנסה שלך, ייתכן שאת/ה זכאי/ת למענק עבודה מהמדינה. המענק מועבר ישירות לחשבון הבנק ויכול להגיע עד 13,000 ₪ בשנה.',
    type: 'tax_benefit',
    priority: 'high',
    actionUrl: SERVICE_URLS.WORK_GRANT,
    potentialValue: ESTIMATED_VALUES.WORK_GRANT_MAX,
  },
});

