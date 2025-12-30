/**
 * אסטרטגיה: דירה בהנחה (מחיר מטרה)
 *
 * תנאי: אין נדל"ן, נכסים נזילים > 200,000, נשוי או גיל >= 35
 * קטגוריה: strategy
 */

import { createRule } from '../../ruleFactory';
import {
  hasRealEstate,
  getLiquidAssets,
  isMarried,
  getAge,
} from '../../helpers';

export default createRule({
  id: 'first-home-lottery',
  name: 'דירה בהנחה - מחיר מטרה',

  condition: (ctx) => {
    // אין נדל"ן בבעלות
    if (hasRealEstate(ctx)) return false;

    // נכסים נזילים > 200,000
    if (getLiquidAssets(ctx) <= 200000) return false;

    // נשוי או גיל >= 35
    const age = getAge(ctx);
    if (!isMarried(ctx) && age < 35) return false;

    return true;
  },

  recommendation: {
    title: 'הזדמנות לדירה בהנחה (מחיר מטרה)',
    description: `זיהינו שאין בבעלותך דירה ויש לך הון עצמי התחלתי. מכיוון שאת/ה עומד/ת בתנאי הזכאות (גיל/מצב משפחתי), הרשמה להגרלות "דירה בהנחה" יכולה להוביל לרכישת דירה ב-20% מתחת למחיר השוק.

📋 מה צריך לעשות:
• להירשם באתר "דירה בהנחה" של משרד הבינוי
• לעקוב אחר הגרלות חדשות באזור המועדף
• להכין מראש אישורי הכנסה ומסמכים נדרשים

💡 טיפ: ההגרלות מתקיימות לאורך כל השנה - אל תחכו להגרלה "מושלמת".`,
    type: 'savings',
    priority: 'high',
    category: 'strategy',
    actionUrl: 'https://www.dira.moch.gov.il/',
    potentialValue: 300000,
  },

  getEligibilityReason: (ctx) => {
    const liquid = getLiquidAssets(ctx).toLocaleString('he-IL');
    const age = getAge(ctx);
    const status = isMarried(ctx) ? 'נשוי/אה' : `גיל ${age}`;
    return `אין דירה בבעלותך, הון עצמי של ${liquid}₪, ${status} - עומד/ת בתנאי הזכאות`;
  },
});
