/**
 * אסטרטגיה: מקסום קרן השתלמות
 *
 * תנאי: שכיר או עצמאי, הכנסה > 120,000, הפקדות השנה < 18,000
 * קטגוריה: strategy
 */

import { createRule } from '../../ruleFactory';
import {
  isSelfEmployed,
  isEmployee,
  getAnnualIncome,
  getKerenHishtalmutBalance,
} from '../../helpers';

export default createRule({
  id: 'max-keren-hishtalmut-strategy',
  name: 'מקסום קרן השתלמות',

  condition: (ctx) => {
    // שכיר או עצמאי
    if (!isEmployee(ctx) && !isSelfEmployed(ctx)) return false;

    // הכנסה שנתית > 120,000
    if (getAnnualIncome(ctx) <= 120000) return false;

    // יש יכולת להפקיד (תזרים חיובי)
    if (ctx.metrics.monthlyCashFlow < 500) return false;

    return true;
  },

  recommendation: {
    title: 'הטבת המס המשתלמת ביותר: קרן השתלמות',
    description: `טרם ניצלת את תקרת ההפקדה לקרן השתלמות השנה. זהו האפיק היחיד בישראל הפטור ממס רווחי הון בטווח הבינוני. מומלץ להשלים את ההפקדה לתקרה לפני סוף השנה.

🎯 למה קרן השתלמות?
• פטור מלא ממס רווחי הון (25%!)
• נזילות אחרי 6 שנים (3 לעצמאי)
• ניכוי/זיכוי מס על ההפקדה

📊 תקרות 2025:
• שכיר: ~10,800₪/שנה (הפרשת עובד)
• עצמאי: ~20,500₪/שנה

💡 טיפ: בדוק בתלוש שאתה מפקיד את המקסימום. רוב השכירים מפקידים פחות מהתקרה.`,
    type: 'tax_benefit',
    priority: 'high',
    category: 'strategy',
    actionUrl: 'https://www.kolzchut.org.il/he/קרן_השתלמות',
    potentialValue: 5000,
  },

  getEligibilityReason: (ctx) => {
    const income = getAnnualIncome(ctx).toLocaleString('he-IL');
    const kerenBalance = getKerenHishtalmutBalance(ctx).toLocaleString('he-IL');
    const empType = isSelfEmployed(ctx) ? 'עצמאי' : 'שכיר';
    return `${empType} עם הכנסה שנתית של ${income}₪, יתרת קה"ש: ${kerenBalance}₪`;
  },
});
