/**
 * אסטרטגיה: מענקי פריפריה
 *
 * תנאי: אין נדל"ן, הון עצמי נמוך (< 400,000)
 * קטגוריה: strategy
 */

import { createRule } from '../../ruleFactory';
import {
  hasRealEstate,
  getLiquidAssets,
} from '../../helpers';

export default createRule({
  id: 'periphery-grant',
  name: 'מענקי רכישה בפריפריה',

  condition: (ctx) => {
    // אין נדל"ן
    if (hasRealEstate(ctx)) return false;

    // הון עצמי נמוך יחסית - מתאים למענקים
    if (getLiquidAssets(ctx) >= 400000) return false;

    // צריך הון עצמי מינימלי לרכישה
    if (getLiquidAssets(ctx) < 50000) return false;

    return true;
  },

  recommendation: {
    title: 'מענקי רכישה בפריפריה',
    description: `כרוכש דירה ראשונה, שקול רכישה ביישובים המזכים במענקי מקום (נגב/גליל). המענקים יכולים להגיע ל-100,000 ₪ ולהפוך רכישה לבלתי אפשרית לאפשרית.

🎁 סוגי מענקים:
• מענק קליטה לאזורי עדיפות לאומית
• מענק רכישה מרשות מקרקעי ישראל
• הנחות ארנונה ביישובי פריפריה
• הטבות מס לתושבי הנגב והגליל

📍 אזורים מומלצים:
• באר שבע והסביבה
• ערד, דימונה, ירוחם
• כרמיאל, עכו, נהריה
• עיירות פיתוח בגליל`,
    type: 'savings',
    priority: 'medium',
    category: 'strategy',
    actionUrl: 'https://www.gov.il/he/departments/topics/settlement-encouragement',
    potentialValue: 80000,
  },

  getEligibilityReason: (ctx) => {
    const liquid = getLiquidAssets(ctx).toLocaleString('he-IL');
    return `רוכש דירה ראשונה עם הון עצמי של ${liquid}₪ - מענקי פריפריה יכולים להשלים את ההון`;
  },
});
