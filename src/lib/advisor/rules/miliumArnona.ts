/**
 * הנחת ארנונה למילואימניקים
 * 
 * תנאי: מילואים + תשלום ארנונה
 * עדיפות: בינונית
 * 
 * @deprecated Military status field has been removed - rule will never trigger
 */

import { createRule } from '../ruleFactory';
import { SERVICE_URLS } from '../constants';

export default createRule({
  id: 'miluim-arnona-discount',
  name: 'הנחת ארנונה למילואימניקים',
  
  // Always return false - military status removed
  condition: () => false,

  getEligibilityReason: () => {
    return `סטטוס צבאי: מילואים פעיל. זוהה תשלום ארנונה בעסקאות. ההנחה ניתנת ע"י הרשות המקומית בתיאום עם צה"ל.`;
  },
  
  recommendation: {
    title: 'הנחת ארנונה למשרתים במילואים',
    description: 'מילואימניקים פעילים זכאים להנחה של 5% ומעלה בארנונה. ההנחה לא תמיד אוטומטית - יש לפנות לרשות המקומית עם תעודת מילואים.',
    type: 'general',
    priority: 'medium',
    actionUrl: SERVICE_URLS.MILUIM_ARNONA,
    potentialValue: 500,
  },
});

