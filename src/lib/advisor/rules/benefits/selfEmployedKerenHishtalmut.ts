/**
 * הטבה: השלמת הפקדה לקרן השתלמות (עצמאים - סוף שנה)
 *
 * תנאי: עצמאי + חודש >= 11 (נובמבר-דצמבר)
 * קטגוריה: benefit
 */

import { createRule } from '../../ruleFactory';
import { SERVICE_URLS } from '../../constants';

export default createRule({
  id: 'self-employed-keren-hishtalmut-eoy',
  name: 'השלמת קרן השתלמות סוף שנה',

  condition: (ctx) => {
    const { user } = ctx;

    // Must be self-employed or both
    const employmentType = user.profile?.employmentType;
    if (employmentType !== 'self_employed' && employmentType !== 'both') {
      return false;
    }

    // Must be November or December
    const currentMonth = new Date().getMonth() + 1; // 1-12
    if (currentMonth < 11) return false;

    // Must have positive cash flow (ability to deposit)
    if (ctx.metrics.monthlyCashFlow <= 0) return false;

    return true;
  },

  recommendation: {
    title: 'השלמת הפקדה לקרן השתלמות',
    description: `נובמבר-דצמבר הם הזמן האחרון להפקיד לקרן השתלמות ולקבל את הטבת המס לשנה הנוכחית!

📌 מה מקבלים:
• ניכוי מס של עד 35% על ההפקדה
• פטור ממס רווח הון על הרווחים
• תקרה שנתית: כ-20,500₪

⚠️ חשוב:
• הפקדות צריכות להתבצע עד 31 בדצמבר
• אפשר להפקיד סכום חד-פעמי
• בדוק מול רואה החשבון את הסכום המדויק

אל תפסיד את ההטבה!`,
    type: 'tax_benefit',
    priority: 'high',
    category: 'benefit',
    actionUrl: SERVICE_URLS.KEREN_HISHTALMUT_SELF,
    potentialValue: 7000, // Tax benefit value
  },

  getEligibilityReason: (ctx) => {
    const currentMonth = new Date().getMonth() + 1;
    const monthName = currentMonth === 11 ? 'נובמבר' : 'דצמבר';
    const daysLeft = currentMonth === 11
      ? 30 - new Date().getDate() + 31
      : 31 - new Date().getDate();

    return `עצמאי בחודש ${monthName} - נותרו ${daysLeft} ימים להפקדה לשנת המס הנוכחית`;
  },
});
