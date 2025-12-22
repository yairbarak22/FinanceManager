/**
 * החזר דמי ביטוח לאומי (כפל תשלומים)
 * 
 * תנאי: שכיר
 * עדיפות: נמוכה
 */

import { createRule } from '../ruleFactory';
import { isEmployee } from '../helpers';
import { SERVICE_URLS } from '../constants';

export default createRule({
  id: 'bituach-leumi-refund',
  name: 'החזר דמי ביטוח לאומי',
  
  condition: (ctx) => {
    // Relevant mainly for employees
    return isEmployee(ctx);
  },
  
  recommendation: {
    title: 'בדיקת החזר דמי ביטוח לאומי',
    description: 'אם עבדת בשתי עבודות ללא תיאום ביטוח לאומי, או החלפת עבודה באמצע החודש, ייתכן ששילמת ביתר. ניתן לבקש החזר מביטוח לאומי.',
    type: 'tax_benefit',
    priority: 'low',
    actionUrl: SERVICE_URLS.BITUACH_LEUMI_REFUND,
    potentialValue: 500,
  },
});

