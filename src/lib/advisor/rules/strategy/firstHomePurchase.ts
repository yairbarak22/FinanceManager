/**
 * אסטרטגיה: רכישת דירה ראשונה
 *
 * תנאי: אין נדל"ן, נכסים נזילים > 200,000, גיל > 22
 * קטגוריה: strategy
 */

import { createRule } from '../../ruleFactory';
import { SERVICE_URLS } from '../../constants';

// Helper to get age from ageRange
function getMinAgeFromRange(ageRange?: string): number {
  if (!ageRange) return 0;
  const match = ageRange.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

export default createRule({
  id: 'first-home-purchase',
  name: 'רכישת דירה ראשונה',

  condition: (ctx) => {
    const { metrics, user } = ctx;

    // אין נדל"ן
    if (metrics.hasRealEstate) return false;

    // נכסים נזילים > 200,000
    if (metrics.liquidAssets <= 200000) return false;

    // גיל > 25
    const age = getMinAgeFromRange(user.profile?.ageRange);
    if (age < 22) return false;

    return true;
  },

  recommendation: {
    title: 'הזדמנות לרכישת דירה ראשונה',
    description: `יש לך הון עצמי משמעותי ואתה עדיין ללא דירה. רוכשי דירה ראשונה נהנים מהטבות מס משמעותיות:
• פטור ממס רכישה עד 1.97 מיליון ₪
• מדרגות מס מופחתות על דירות יקרות יותר
• אפשרות למשכנתא בתנאים מועדפים

מומלץ לבחון את האפשרויות ולהתייעץ עם יועץ משכנתאות.`,
    type: 'savings',
    priority: 'high',
    category: 'strategy',
    actionUrl: 'https://www.gov.il/he/service/mas_rechisha_calculator',
    potentialValue: 80000, // Average tax benefit for first home buyers
  },

  getEligibilityReason: (ctx) => {
    const formattedAssets = ctx.metrics.liquidAssets.toLocaleString('he-IL');
    return `יש לך ${formattedAssets}₪ בנכסים נזילים וללא נדל"ן - תנאים מצוינים לרכישת דירה ראשונה`;
  },
});
