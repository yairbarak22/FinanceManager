/**
 * בונוס מילואימניק עצמאי
 * 
 * תנאי: מילואימניק + עצמאי
 * עדיפות: גבוהה
 */

import { createRule } from '../ruleFactory';
import { isReservist, isSelfEmployed } from '../helpers';
import { SERVICE_URLS, ESTIMATED_VALUES } from '../constants';

export default createRule({
  id: 'reserve-self-employed-bonus',
  name: 'בונוס מילואימניק עצמאי',
  
  condition: (ctx) => {
    return isReservist(ctx) && isSelfEmployed(ctx);
  },
  
  recommendation: {
    title: 'פיצוי נוסף למילואימניקים עצמאיים',
    description: 'כמילואימניק עצמאי, את/ה זכאי/ת לפיצוי נוסף של 25% מעבר לתגמול הרגיל. הפיצוי הנוסף נועד לפצות על אובדן הכנסות בזמן השירות.',
    type: 'tax_benefit',
    priority: 'high',
    actionUrl: SERVICE_URLS.RESERVE_BENEFITS,
  },
});

