/**
 * בונוס מילואימניק עצמאי
 * 
 * תנאי: מילואימניק + עצמאי
 * עדיפות: גבוהה
 * 
 * @deprecated Military status field has been removed - rule will never trigger
 */

import { createRule } from '../ruleFactory';
import { SERVICE_URLS } from '../constants';

export default createRule({
  id: 'reserve-self-employed-bonus',
  name: 'בונוס מילואימניק עצמאי',
  
  // Always return false - military status removed
  condition: () => false,
  
  recommendation: {
    title: 'פיצוי נוסף למילואימניקים עצמאיים',
    description: 'כמילואימניק עצמאי, את/ה זכאי/ת לפיצוי נוסף של 25% מעבר לתגמול הרגיל. הפיצוי הנוסף נועד לפצות על אובדן הכנסות בזמן השירות.',
    type: 'tax_benefit',
    priority: 'high',
    actionUrl: SERVICE_URLS.RESERVE_BENEFITS,
  },
});

