/**
 * מעבר לניהול אישי (IRA) בקרן השתלמות
 * 
 * תנאי: קה"ש בשווי גבוה (מעל 300K)
 * עדיפות: גבוהה
 */

import { createRule } from '../ruleFactory';
import { hasKerenHishtalmut, getKerenHishtalmutValue } from '../helpers';
import { SERVICE_URLS, BALANCE_THRESHOLDS, ESTIMATED_VALUES } from '../constants';

export default createRule({
  id: 'keren-hishtalmut-ira',
  name: 'מעבר ל-IRA בקרן השתלמות',
  
  condition: (ctx) => {
    // Must have Keren Hishtalmut with high value
    if (!hasKerenHishtalmut(ctx)) return false;
    return getKerenHishtalmutValue(ctx) >= BALANCE_THRESHOLDS.KEREN_HISHTALMUT_IRA;
  },
  
  recommendation: {
    title: 'מעבר לניהול אישי (IRA) בקרן השתלמות',
    description: 'עם צבירה גבוהה בקרן השתלמות, כדאי לשקול מעבר ל-IRA. ניהול עצמי מאפשר להוזיל דמי ניהול דרמטית (מ-0.5% לכ-0.2%) ולקנות קרנות מחקות מדד בעלות נמוכה.',
    type: 'savings',
    priority: 'high',
    actionUrl: SERVICE_URLS.IRA_INFO,
    potentialValue: ESTIMATED_VALUES.KEREN_IRA_SAVINGS,
  },
});

