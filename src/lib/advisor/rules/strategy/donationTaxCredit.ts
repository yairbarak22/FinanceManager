/**
 * אסטרטגיה: החזר מס על תרומות (סעיף 46)
 *
 * תנאי: תרומות > 200₪, הכנסה חייבת במס > 0
 * קטגוריה: strategy
 */

import { createRule } from '../../ruleFactory';
import {
  getDonationSum,
  getTaxableIncome,
} from '../../helpers';

export default createRule({
  id: 'donation-tax-credit',
  name: 'החזר מס על תרומות',

  condition: (ctx) => {
    // תרומות > 200₪
    if (getDonationSum(ctx) <= 200) return false;

    // יש הכנסה חייבת במס
    if (getTaxableIncome(ctx) <= 0) return false;

    return true;
  },

  recommendation: {
    title: 'החזר מס על תרומות (סעיף 46)',
    description: `תרמת השנה מעל 200₪ למוסדות מוכרים? מגיע לך זיכוי מס בגובה 35% מסכום התרומה. שמור את הקבלות והגש בקשה להחזר.

📋 תנאים לקבלת הזיכוי:
• תרומה למוסד בעל אישור לפי סעיף 46
• סכום מינימום: 200₪ בשנה
• תקרה: 30% מההכנסה החייבת (או 9,350,000₪)

💰 חישוב:
• תרומות השנה × 35% = זיכוי מס

📝 איך לממש:
1. אסוף קבלות מכל המוסדות שתרמת להם
2. ודא שיש אישור סעיף 46 על הקבלה
3. הגש בקשה להחזר מס (טופס 135) או דרך רואה חשבון

⚠️ חשוב: הזיכוי הוא על מס ששולם בפועל - אם אין הכנסה חייבת במס, אין זיכוי.`,
    type: 'tax_benefit',
    priority: 'low',
    category: 'strategy',
    actionUrl: 'https://www.gov.il/he/service/income-tax-credit-for-approved-donations',
    potentialValue: undefined, // Dynamic
  },

  getEligibilityReason: (ctx) => {
    const donations = getDonationSum(ctx);
    const taxCredit = Math.round(donations * 0.35);
    return `תרומות השנה: ${donations.toLocaleString('he-IL')}₪ - זכאי לזיכוי מס של ${taxCredit.toLocaleString('he-IL')}₪`;
  },
});
