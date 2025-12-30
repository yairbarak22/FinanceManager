/**
 * אסטרטגיה: השקעת מזומן עודף
 *
 * תנאי: קרן חירום > 6 חודשים
 * קטגוריה: strategy
 */

import { createRule } from '../../ruleFactory';
import { SERVICE_URLS } from '../../constants';

export default createRule({
  id: 'invest-excess-cash',
  name: 'השקעת מזומן עודף',

  condition: (ctx) => {
    const { metrics } = ctx;

    // קרן חירום > 6 חודשים
    return metrics.emergencyFundMonths > 6;
  },

  recommendation: {
    title: 'הכסף שלך נשחק בעובר ושב',
    description: `יש לך יותר מ-6 חודשי הוצאות במזומן נזיל. אינפלציה שוחקת את הכסף בכ-3-4% בשנה!

מומלץ להשאיר קרן חירום של 3-6 חודשים בלבד, והשאר להעביר לתיק השקעות:
• קרן כספית - סיכון אפסי, תשואה של פריים
• אג"ח מדינה - סיכון נמוך, תשואה של 4-5%
• מדד S&P 500 - לטווח ארוך, תשואה היסטורית של 10%

השקעה פסיבית במדדים היא הדרך הפשוטה והיעילה ביותר.`,
    type: 'savings',
    priority: 'high',
    category: 'strategy',
    actionUrl: SERVICE_URLS.IRA_INFO,
    potentialValue: undefined, // Dynamic based on amount
  },

  getEligibilityReason: (ctx) => {
    const months = Math.round(ctx.metrics.emergencyFundMonths);
    const excessMonths = months - 6;
    const excessAmount = Math.round(ctx.metrics.monthlyBurnRate * excessMonths);
    const formattedExcess = excessAmount.toLocaleString('he-IL');

    return `יש לך קרן חירום של ${months} חודשים - כ-${formattedExcess}₪ עודפים שיכולים לעבוד בשבילך`;
  },
});
