/**
 * הנחת ארנונה למילואימניקים
 * 
 * תנאי: מילואים + תשלום ארנונה
 * עדיפות: בינונית
 */

import { createRule } from '../ruleFactory';
import { isReservist, paysArnona } from '../helpers';
import { SERVICE_URLS } from '../constants';

export default createRule({
  id: 'miluim-arnona-discount',
  name: 'הנחת ארנונה למילואימניקים',
  
  condition: (ctx) => {
    // Must be a reservist
    if (!isReservist(ctx)) return false;
    
    // Must be paying arnona
    return paysArnona(ctx);
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

