/**
 * הטבה: בדיקת נקודות זיכוי הורים
 *
 * תנאי: יש ילדים + שכיר
 * קטגוריה: benefit
 */

import { createRule } from '../../ruleFactory';

export default createRule({
  id: 'child-tax-credits',
  name: 'נקודות זיכוי ילדים',

  condition: (ctx) => {
    const { user } = ctx;

    // Must have children
    if (!user.profile?.hasChildren || (user.profile.childrenCount ?? 0) === 0) {
      return false;
    }

    // Must be employed (to have a payslip)
    const employmentType = user.profile?.employmentType;
    if (employmentType !== 'employee' && employmentType !== 'both') {
      return false;
    }

    return true;
  },

  recommendation: {
    title: 'בדיקת נקודות זיכוי הורים',
    description: `כהורה לילדים מגיעות לך נקודות זיכוי ממס הכנסה. חשוב לוודא שהן מופיעות בתלוש!

📊 נקודות זיכוי לפי גיל:
• ילד עד גיל 5: 2.5 נקודות לאם / 1 נקודה לאב
• ילד גיל 6-17: 1 נקודה לאם / 1 נקודה לאב
• ילד גיל 18: 0.5 נקודה לכל הורה

💰 ערך נקודת זיכוי: 2,904₪ בשנה (242₪ בחודש)

🔍 מה לבדוק בתלוש:
• שדה "נקודות זיכוי" - האם מופיע המספר הנכון?
• יש לעדכן את המעסיק בכל שינוי (לידה, גיל 6, גיל 18)

אם הנקודות חסרות - פנה למשאבי אנוש לתיקון!`,
    type: 'tax_benefit',
    priority: 'medium',
    category: 'benefit',
    actionUrl: 'https://www.kolzchut.org.il/he/נקודות_זיכוי_להורים',
    potentialValue: undefined, // Dynamic based on children count
  },

  getEligibilityReason: (ctx) => {
    const childrenCount = ctx.user.profile?.childrenCount ?? 0;
    // Estimate: average 1.5 points per child × 2,904₪
    const estimatedValue = Math.round(childrenCount * 1.5 * 2904);
    const formattedValue = estimatedValue.toLocaleString('he-IL');

    return `${childrenCount} ילדים - ערך משוער של נקודות זיכוי: ${formattedValue}₪ בשנה`;
  },
});
