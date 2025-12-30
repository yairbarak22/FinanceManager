/**
 * אסטרטגיה: מזומן בעו"ש שלא עובד
 *
 * תנאי: מזומן נזיל > 30,000₪, קרן חירום >= 3 חודשים
 * קטגוריה: strategy
 */

import { createRule } from '../../ruleFactory';
import { getLiquidAssets } from '../../helpers';

const MIN_IDLE_CASH = 30000; // מינימום להמלצה
const MIN_EMERGENCY_MONTHS = 3; // מינימום חודשי קרן חירום

export default createRule({
  id: 'idle-cash-optimization',
  name: 'מזומן בעו"ש שלא עובד',

  condition: (ctx) => {
    const { metrics } = ctx;
    const liquidAssets = getLiquidAssets(ctx);

    // מזומן נזיל > 30,000₪
    if (liquidAssets <= MIN_IDLE_CASH) return false;

    // קרן חירום >= 3 חודשים (יש כיסוי בסיסי)
    if (metrics.emergencyFundMonths < MIN_EMERGENCY_MONTHS) return false;

    return true;
  },

  recommendation: {
    title: 'הכסף בעו"ש לא מרוויח כלום',
    description: `יש לך מזומן בחשבון העו"ש שלא מייצר תשואה. כשיש קרן חירום מכוסה, כדאי להעביר את העודף לאפיק שמרוויח:

💰 קרן כספית (שקלית):
• תשואה: כ-4.5% שנתי (צמוד לריבית בנק ישראל)
• נזילות: יומית - ניתן למשוך בכל עת
• סיכון: אפסי
• מתאים ל: כסף שתצטרך בשנה הקרובה

📈 קרן מחקה מדד (S&P 500):
• תשואה: ~10% שנתי (היסטורית)
• נזילות: יומית
• סיכון: בינוני-גבוה בטווח קצר, נמוך בטווח ארוך
• מתאים ל: כסף ל-5+ שנים

📊 תעודת סל אג"ח:
• תשואה: 4-5% שנתי
• נזילות: יומית
• סיכון: נמוך-בינוני
• מתאים ל: כסף ל-2-5 שנים

💡 המלצה: השאר 3-6 חודשי הוצאות בעו"ש כקרן חירום, והשאר העבר לקרן כספית או תיק השקעות.`,
    type: 'savings',
    priority: 'medium',
    category: 'strategy',
    actionUrl: 'https://www.bizportal.co.il/capitalmarket/quote/generalview/1159943', // קרן כספית לדוגמה
    potentialValue: undefined, // Dynamic
  },

  getEligibilityReason: (ctx) => {
    const liquidAssets = getLiquidAssets(ctx);
    const { monthlyBurnRate, emergencyFundMonths } = ctx.metrics;

    // חשב כמה כסף מעל קרן החירום הנדרשת (6 חודשים)
    const recommendedEmergencyFund = monthlyBurnRate * 6;
    const excessCash = Math.max(0, liquidAssets - recommendedEmergencyFund);

    // הערך תשואה פוטנציאלית (4.5% על קרן כספית)
    const potentialYield = Math.round(excessCash * 0.045);

    const formattedLiquid = liquidAssets.toLocaleString('he-IL');
    const formattedExcess = excessCash.toLocaleString('he-IL');
    const formattedYield = potentialYield.toLocaleString('he-IL');

    if (excessCash > 0) {
      return `יש לך ${formattedLiquid}₪ נזילים (${Math.round(emergencyFundMonths)} חודשי הוצאות) - כ-${formattedExcess}₪ יכולים להרוויח ~${formattedYield}₪ בשנה בקרן כספית`;
    }

    return `יש לך ${formattedLiquid}₪ נזילים - שקול להעביר חלק לקרן כספית שתניב ~4.5% בשנה`;
  },
});
