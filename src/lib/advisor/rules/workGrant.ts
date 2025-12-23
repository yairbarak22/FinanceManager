/**
 * מענק עבודה (מס שלילי)
 * 
 * תנאי: הכנסה נמוכה-בינונית + גיל מתאים
 * עדיפות: גבוהה
 */

import { createRule } from '../ruleFactory';
import { hasChildren, getEstimatedAge, getRealEstateCount, getChildrenCount } from '../helpers';
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

  getEligibilityReason: (ctx) => {
    const age = getEstimatedAge(ctx);
    const income = ctx.metrics.monthlyIncome;
    const hasKids = hasChildren(ctx);
    const kidsCount = getChildrenCount(ctx);
    const realEstateCount = getRealEstateCount(ctx);
    
    return `גיל משוער: ${age}, הכנסה חודשית: ${income.toLocaleString()}₪ (בטווח ${INCOME_THRESHOLDS.WORK_GRANT_MIN.toLocaleString()}-${INCOME_THRESHOLDS.WORK_GRANT_MAX.toLocaleString()}₪), ${hasKids ? `יש ${kidsCount} ילדים` : 'ללא ילדים'}, מספר נכסי נדל"ן: ${realEstateCount} (מקסימום מותר: 1)`;
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

