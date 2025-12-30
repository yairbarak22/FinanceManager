/**
 * הטבה: מיצוי זכויות מילואים
 *
 * תנאי: מילואימניק
 * קטגוריה: benefit
 */

import { createRule } from '../../ruleFactory';
import { SERVICE_URLS } from '../../constants';

export default createRule({
  id: 'reservist-rights',
  name: 'מיצוי זכויות מילואים',

  condition: (ctx) => {
    // Must be reservist
    return ctx.metrics.isReservist;
  },

  recommendation: {
    title: 'מיצוי זכויות מילואים',
    description: `כמילואימניק מגיעות לך הטבות רבות שכדאי לבדוק:

💰 הטבות כספיות:
• מענק מילואים שנתי (עד 6,000₪)
• תגמול יום מילואים מוגדל
• פטור מארנונה (עד 66% הנחה)
• שוברי נופש מסובסדים

🎓 הטבות אחרות:
• עדיפות בקבלה ללימודים
• הנחות בפארקים ואטרקציות
• ביטוח חיים מוזל

בדוק את הזכאות שלך באתר מילואים.`,
    type: 'general',
    priority: 'medium',
    category: 'benefit',
    actionUrl: SERVICE_URLS.RESERVE_BENEFITS,
    potentialValue: 8000, // Average annual value of reservist benefits
  },

  getEligibilityReason: (ctx) => {
    return 'סטטוס צבאי: מילואים - זכאי להטבות מגוונות';
  },
});
