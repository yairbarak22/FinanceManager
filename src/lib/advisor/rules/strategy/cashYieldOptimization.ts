/**
 * אסטרטגיה: תשואה על מזומן
 *
 * תנאי: מזומן לא מושקע > 50,000
 * קטגוריה: strategy
 */

import { createRule } from '../../ruleFactory';
import {
  getUninvestedCash,
} from '../../helpers';

export default createRule({
  id: 'cash-yield-optimization',
  name: 'תשואה על מזומן',

  condition: (ctx) => {
    // מזומן לא מושקע > 50,000
    return getUninvestedCash(ctx) > 50000;
  },

  recommendation: {
    title: 'הכסף בעובר ושב נשחק',
    description: `יש לך יתרת מזומן גבוהה שאינה מניבה תשואה. במקום להשאיר בעו"ש, שקול קרן כספית, פיקדון בנקאי או מק"מ. גם בסיכון אפסי ניתן לקבל תשואה של כ-4% בשנה.

📊 אפשרויות לפי רמת סיכון:

🟢 סיכון אפסי:
• פיקדון בנקאי (3-4%)
• מק"מ - מלווה קצר מועד (4.5%)
• קרן כספית (פריים - 4.5%)

🟡 סיכון נמוך:
• אג"ח מדינה (4-5%)
• קרן אג"ח קצרה (4-5%)

💡 המלצה:
השאר 1-2 חודשי הוצאות בעו"ש, והשאר העבר לאפיק שמניב תשואה.`,
    type: 'savings',
    priority: 'high',
    category: 'strategy',
    actionUrl: 'https://www.boi.org.il/he/markets/bonds/',
    potentialValue: 2000,
  },

  getEligibilityReason: (ctx) => {
    const cash = getUninvestedCash(ctx);
    const formattedCash = cash.toLocaleString('he-IL');
    const potentialYield = Math.round(cash * 0.04);
    const formattedYield = potentialYield.toLocaleString('he-IL');
    return `${formattedCash}₪ בעו"ש ללא תשואה - אובדן פוטנציאלי של ${formattedYield}₪ בשנה`;
  },
});
