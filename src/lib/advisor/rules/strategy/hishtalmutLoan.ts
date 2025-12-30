/**
 * אסטרטגיה: הלוואה מקרן השתלמות
 *
 * תנאי: יתרת קה"ש > 50,000, חוב בריבית גבוהה או תזרים שלילי
 * קטגוריה: strategy
 */

import { createRule } from '../../ruleFactory';
import {
  getKerenHishtalmutBalance,
  hasHighInterestDebt,
  getHighInterestDebtAmount,
} from '../../helpers';

export default createRule({
  id: 'hishtalmut-loan',
  name: 'הלוואה מקרן השתלמות',

  condition: (ctx) => {
    // יתרת קה"ש > 50,000
    if (getKerenHishtalmutBalance(ctx) < 50000) return false;

    // יש חוב בריבית גבוהה או תזרים שלילי
    const hasDebt = hasHighInterestDebt(ctx);
    const negativeCashFlow = ctx.metrics.monthlyCashFlow < 0;

    if (!hasDebt && !negativeCashFlow) return false;

    return true;
  },

  recommendation: {
    title: 'הלוואה חכמה מקרן השתלמות',
    description: `במקום לשלם ריבית יקרה בבנק או להיות במינוס, ניתן לקחת הלוואה כנגד קרן ההשתלמות שלך (לרוב בפריים מינוס 0.5%). זהו האשראי הזול ביותר בשוק שמאפשר לך לא לפדות את הקרן.

💰 יתרונות:
• ריבית נמוכה במיוחד (פריים - 0.5% = ~4%)
• הכסף נשאר בקרן וממשיך לצבור רווחים
• אין צורך לפדות את הקרן (ולשלם מס)
• תהליך פשוט ומהיר

📊 השוואה:
• הלוואה רגילה: 8-12% ריבית
• הלוואה מקה"ש: 4-5% ריבית
• חיסכון: 4-7% בשנה!

📋 איך לקחת:
פנה לחברה המנהלת את קרן ההשתלמות שלך (מיטב, הראל, מנורה וכו').`,
    type: 'savings',
    priority: 'high',
    category: 'strategy',
    actionUrl: 'https://www.kolzchut.org.il/he/הלוואה_מהכספים_הצבורים_בקופת_גמל_או_בקרן_השתלמות',
    potentialValue: 5000,
  },

  getEligibilityReason: (ctx) => {
    const kerenBalance = getKerenHishtalmutBalance(ctx).toLocaleString('he-IL');
    const highDebt = getHighInterestDebtAmount(ctx);
    const cashFlow = ctx.metrics.monthlyCashFlow;

    if (highDebt > 0) {
      return `יתרת קה"ש: ${kerenBalance}₪, חוב בריבית גבוהה: ${highDebt.toLocaleString('he-IL')}₪ - הלוואה מקה"ש תחסוך אלפי שקלים`;
    }
    return `יתרת קה"ש: ${kerenBalance}₪, תזרים שלילי של ${Math.abs(cashFlow).toLocaleString('he-IL')}₪ - הלוואה זולה תסייע לתזרים`;
  },
});
