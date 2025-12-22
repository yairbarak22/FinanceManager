/**
 * החזר מס על ביטוח חיים
 * 
 * תנאי: יש משכנתא או ביטוח חיים + שכיר
 * עדיפות: בינונית
 */

import { createRule } from '../ruleFactory';
import { hasMortgage, paysLifeInsurance, isEmployee } from '../helpers';
import { SERVICE_URLS } from '../constants';

export default createRule({
  id: 'life-insurance-tax-credit',
  name: 'זיכוי מס על ביטוח חיים',
  
  condition: (ctx) => {
    // Must be an employee (paying income tax)
    if (!isEmployee(ctx)) return false;
    
    // Must have mortgage (which requires life insurance) or direct life insurance payments
    return hasMortgage(ctx) || paysLifeInsurance(ctx);
  },
  
  recommendation: {
    title: 'החזר מס על ביטוח חיים',
    description: '25% מתשלומי פרמיית ביטוח חיים מוכרים לזיכוי מס. זה כולל ביטוח חיים של המשכנתא. רוב השכירים לא מגישים דוח ולא מנצלים את ההטבה.',
    type: 'tax_benefit',
    priority: 'medium',
    actionUrl: SERVICE_URLS.LIFE_INSURANCE_CREDIT,
    potentialValue: 1000,
  },
});

