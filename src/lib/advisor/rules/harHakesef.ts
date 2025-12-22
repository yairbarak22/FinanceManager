/**
 * איתור כספים אבודים (הר הכסף)
 * 
 * תנאי: גיל > 25
 * עדיפות: בינונית
 */

import { createRule } from '../ruleFactory';
import { getEstimatedAge } from '../helpers';
import { SERVICE_URLS, AGE_THRESHOLDS } from '../constants';

export default createRule({
  id: 'har-hakesef-lost-money',
  name: 'איתור כספים אבודים',
  
  condition: (ctx) => {
    const age = getEstimatedAge(ctx);
    if (!age) return false;
    
    // Anyone over 25 likely had previous employers
    return age >= AGE_THRESHOLDS.HAR_HAKESEF_MIN;
  },
  
  recommendation: {
    title: 'איתור כספים אבודים - הר הכסף',
    description: 'חשבונות פנסיה ישנים, קרנות השתלמות שנשכחו וביטוחי חיים שבוטלו - כולם יכולים לחכות לך באתר "הר הכסף" של משרד האוצר. הבדיקה חינמית.',
    type: 'savings',
    priority: 'medium',
    actionUrl: SERVICE_URLS.HAR_HAKESEF,
    potentialValue: 5000,
  },
});

