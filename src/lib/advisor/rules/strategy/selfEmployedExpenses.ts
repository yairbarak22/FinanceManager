/**
 * אסטרטגיה: מיצוי הוצאות מוכרות לעצמאי
 *
 * תנאי: עצמאי
 * קטגוריה: strategy
 */

import { createRule } from '../../ruleFactory';
import {
  isSelfEmployed,
  getAnnualIncome,
} from '../../helpers';

export default createRule({
  id: 'self-employed-expenses',
  name: 'הוצאות מוכרות לעצמאי',

  condition: (ctx) => {
    // חייב להיות עצמאי
    return isSelfEmployed(ctx);
  },

  recommendation: {
    title: 'מיצוי הוצאות מוכרות לעצמאי',
    description: `האם דיווחת על החלק היחסי של הוצאות הבית (חשמל, ארנונה, אינטרנט) והרכב? כל שקל שמוכר כהוצאה חוסך לך כ-50% (מס הכנסה + ביטוח לאומי).

📋 הוצאות נפוצות שניתן לדרוש:
• חדר עבודה בבית (יחס מהשטח הכולל)
• חשמל, מים, ארנונה (לפי יחס חדר העבודה)
• אינטרנט וטלפון (חלק עסקי)
• הוצאות רכב (לפי % שימוש עסקי)
• ציוד משרדי ומחשבים
• ביטוחים מקצועיים
• השתלמויות וכנסים

💡 טיפים:
• שמור קבלות על כל רכישה עסקית
• תעד את אחוז השימוש העסקי ברכב
• מדוד את חדר העבודה לחישוב היחס

⚠️ דוגמה:
הוצאות בית שנתיות: 30,000₪
אחוז חדר עבודה: 15%
הוצאה מוכרת: 4,500₪
חיסכון מס: ~2,250₪`,
    type: 'tax_benefit',
    priority: 'medium',
    category: 'strategy',
    actionUrl: 'https://www.kolzchut.org.il/he/הוצאות_מוכרות_לעצמאים',
    potentialValue: 3000,
  },

  getEligibilityReason: (ctx) => {
    const income = getAnnualIncome(ctx).toLocaleString('he-IL');
    return `עצמאי עם הכנסה שנתית של ${income}₪ - הוצאות מוכרות יכולות לחסוך אלפי שקלים במס`;
  },
});
