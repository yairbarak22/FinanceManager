/**
 * אסטרטגיה: סגירת חובות יקרים
 *
 * תנאי: חוב בריבית גבוהה > 0 ונכסים נזילים > החוב
 * קטגוריה: strategy
 */

import { createRule } from '../../ruleFactory';
import { INTEREST_THRESHOLDS } from '../../constants';

export default createRule({
  id: 'pay-off-debt',
  name: 'סגירת חובות יקרים',

  condition: (ctx) => {
    const { metrics } = ctx;

    // יש חוב בריבית גבוהה
    if (metrics.highInterestDebt <= 0) return false;

    // יש מספיק נכסים נזילים לסגור אותו
    if (metrics.liquidAssets < metrics.highInterestDebt) return false;

    return true;
  },

  recommendation: {
    title: 'סגירת חובות יקרים',
    description: `יש לך חובות בריבית גבוהה (מעל ${INTEREST_THRESHOLDS.HIGH_INTEREST_RATE}%) ומספיק מזומן לסגור אותם!

למה לסגור עכשיו?
• ריבית של 6%+ היא "תשואה שלילית מובטחת"
• אף השקעה לא מבטיחה תשואה כזו
• סגירת החוב = חיסכון מיידי ובטוח

עדיפות סגירה:
1. כרטיסי אשראי (12-20% ריבית)
2. הלוואות צרכניות (6-12% ריבית)
3. הלוואות לרכב (5-8% ריבית)`,
    type: 'savings',
    priority: 'high',
    category: 'strategy',
    potentialValue: undefined, // Dynamic based on debt amount
  },

  getEligibilityReason: (ctx) => {
    const debtFormatted = ctx.metrics.highInterestDebt.toLocaleString('he-IL');
    const liquidFormatted = ctx.metrics.liquidAssets.toLocaleString('he-IL');

    return `יש לך ${debtFormatted}₪ בחובות יקרים ו-${liquidFormatted}₪ במזומן - אפשר לסגור את החוב ולחסוך אלפי שקלים בריבית`;
  },
});
