/**
 * אסטרטגיה: נדל"ן ממונף
 *
 * תנאי: אין נדל"ן, נכסים נזילים > 350,000, תזרים חיובי > 4,000
 * קטגוריה: strategy
 */

import { createRule } from '../../ruleFactory';
import {
  hasRealEstate,
  getLiquidAssets,
} from '../../helpers';

export default createRule({
  id: 'leveraged-real-estate',
  name: 'בניית הון באמצעות נדל"ן',

  condition: (ctx) => {
    // אין נדל"ן
    if (hasRealEstate(ctx)) return false;

    // נכסים נזילים > 350,000
    if (getLiquidAssets(ctx) <= 350000) return false;

    // תזרים חיובי חזק > 4,000
    if (ctx.metrics.monthlyCashFlow <= 4000) return false;

    return true;
  },

  recommendation: {
    title: 'בניית הון באמצעות נדל"ן',
    description: `יש לך הון עצמי פנוי ותזרים חיובי חזק. זה הזמן לשקול רכישת נכס להשקעה עם מימון בנקאי. הנדל"ן מאפשר למנף את הכסף וליהנות מעליית ערך על כל שווי הנכס, לא רק על ההון העצמי.

📊 למה עכשיו:
• יש לך הון עצמי ל-25-30% מימון עצמי
• התזרים מאפשר לשלם משכנתא בנוחות
• ריביות המשכנתא עדיין אטרקטיביות

💡 אפשרויות:
• דירה להשכרה (תשואה 3-4% + עליית ערך)
• דירה לדיור עצמי (חיסכון בשכירות)
• נכס מסחרי (תשואה גבוהה יותר, סיכון גבוה יותר)`,
    type: 'savings',
    priority: 'medium',
    category: 'strategy',
    actionUrl: 'https://www.bankisrael.gov.il/he/BankingSupervision/BanksAndBranchLocations/Pages/Default.aspx',
    potentialValue: undefined,
  },

  getEligibilityReason: (ctx) => {
    const liquid = getLiquidAssets(ctx).toLocaleString('he-IL');
    const cashFlow = ctx.metrics.monthlyCashFlow.toLocaleString('he-IL');
    return `הון עצמי של ${liquid}₪ ותזרים חיובי של ${cashFlow}₪/חודש - בסיס מצוין למינוף`;
  },
});
