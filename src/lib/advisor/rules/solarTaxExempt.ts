/**
 * פטור ממס על מכירת חשמל סולארי
 * 
 * תנאי: יש הכנסה מחשמל
 * עדיפות: נמוכה
 */

import { createRule } from '../ruleFactory';
import { hasElectricityIncome } from '../helpers';
import { SERVICE_URLS } from '../constants';

export default createRule({
  id: 'solar-electricity-tax-exempt',
  name: 'פטור מס על חשמל סולארי',
  
  condition: (ctx) => {
    return hasElectricityIncome(ctx);
  },
  
  recommendation: {
    title: 'פטור ממס על הכנסה מחשמל סולארי',
    description: 'בעלי מערכות סולאריות נהנים מפטור ממס הכנסה, מע"מ וניהול ספרים על הכנסות עד 24,000 ₪ בשנה ממכירת חשמל. וודא/י שאת/ה מנצל/ת את הפטור.',
    type: 'tax_benefit',
    priority: 'low',
    actionUrl: SERVICE_URLS.SOLAR_TAX_EXEMPTION,
    potentialValue: 4000,
  },
});

