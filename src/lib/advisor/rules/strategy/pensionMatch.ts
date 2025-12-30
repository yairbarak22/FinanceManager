/**
 * אסטרטגיה: מיצוי Matching פנסיוני
 *
 * תנאי: שכיר, הפרשה < 6%
 * קטגוריה: strategy
 */

import { createRule } from '../../ruleFactory';
import {
  isEmployee,
  getPensionContributionPct,
  getAnnualIncome,
} from '../../helpers';

export default createRule({
  id: 'pension-match',
  name: 'מיצוי Matching פנסיוני',

  condition: (ctx) => {
    // חייב להיות שכיר
    if (!isEmployee(ctx)) return false;

    // הפרשה נמוכה מהמקסימום
    const currentPct = getPensionContributionPct(ctx);
    if (currentPct >= 6) return false;

    // יש הכנסה משמעותית
    if (ctx.metrics.monthlyIncome < 5000) return false;

    return true;
  },

  recommendation: {
    title: 'הגדלת הפקדות לפנסיה (Matching)',
    description: `נראה שאינך מפקיד את המקסימום לפנסיה (לרוב עד 7%). הגדלת ההפקדה שלך תחייב את המעסיק להגדיל את ההפקדה שלו בהתאם. זהו כסף "חינם" ותשואה מיידית של 100%.

📊 איך זה עובד:
• את/ה מפקיד/ה 7% מהשכר
• המעסיק מפקיד 7.5% נוספים
• סה"כ 14.5% מהשכר לחיסכון פנסיוני!

💰 דוגמה:
על משכורת של 15,000₪:
• הפקדתך: 1,050₪
• הפקדת מעסיק: 1,125₪
• סה"כ לחודש: 2,175₪ (26,100₪ בשנה!)

📋 מה לעשות:
פנה למחלקת משאבי אנוש וביקש להגדיל את אחוז ההפרשה לפנסיה.`,
    type: 'savings',
    priority: 'high',
    category: 'strategy',
    actionUrl: 'https://www.kolzchut.org.il/he/הפרשות_לפנסיה_של_עובד_שכיר',
    potentialValue: 10000,
  },

  getEligibilityReason: (ctx) => {
    const currentPct = getPensionContributionPct(ctx);
    const monthlyIncome = ctx.metrics.monthlyIncome.toLocaleString('he-IL');
    const potentialMatch = Math.round(ctx.metrics.monthlyIncome * 0.015 * 12); // Extra 1.5% matching
    return `מפקיד ${currentPct}% מתוך 7% אפשריים. על משכורת של ${monthlyIncome}₪ - תגדיל את הפקדת המעסיק בכ-${potentialMatch.toLocaleString('he-IL')}₪/שנה`;
  },
});
