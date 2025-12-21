/**
 * זיכוי מס על תרומות - סעיף 46
 * 
 * תנאי: תרומות מעל 200 ש"ח בשנה
 * עדיפות: בינונית
 */

import { createRule } from '../ruleFactory';
import { sumTransactionsByKeywords } from '../helpers';
import { DONATION_KEYWORDS, DONATION_THRESHOLDS, SERVICE_URLS } from '../constants';

export default createRule({
  id: 'donations-tax-credit-46',
  name: 'זיכוי מס על תרומות - סעיף 46',
  
  condition: (ctx) => {
    const totalDonations = sumTransactionsByKeywords(ctx, DONATION_KEYWORDS);
    return totalDonations >= DONATION_THRESHOLDS.MIN_ANNUAL_FOR_TAX_CREDIT;
  },
  
  recommendation: {
    title: 'זיכוי מס על תרומות',
    description: 'מצאנו שתרמת לעמותות מוכרות. על פי סעיף 46 לפקודת מס הכנסה, את/ה זכאי/ת לזיכוי מס של 35% מסכום התרומות. וודא/י שאת/ה מבקש/ת את הזיכוי בדוח השנתי או דרך המעסיק.',
    type: 'tax_benefit',
    priority: 'medium',
    actionUrl: SERVICE_URLS.TAX_AUTHORITY,
    // potentialValue will be calculated dynamically in a future version
  },
});

