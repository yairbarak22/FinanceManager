/**
 * הלוואת עוגן למילואימניקים
 *
 * תנאי: מילואימניק + תזרים חיובי
 * עדיפות: גבוהה
 * 
 * @deprecated Military status field has been removed - rule will never trigger
 */

import { createRule } from '../ruleFactory';

export default createRule({
  id: 'ogen-reservist-loan',
  name: 'הלוואת עוגן למילואימניקים',

  // Always return false - military status removed
  condition: () => false,

  getEligibilityReason: () => {
    return 'סטטוס צבאי: מילואים פעיל. תזרים חודשי חיובי.';
  },

  recommendation: {
    title: 'הלוואה של 50,000₪ ללא ריבית למילואימניקים',
    description: 'כמילואימניק, את/ה זכאי/ת להלוואה של 50,000₪ ללא ריבית מעמותת עוגן. אפשר לקחת את הכסף "החינמי" ולהשקיע אותו - הרווחים מהתשואה הם שלך.',
    type: 'banking',
    priority: 'high',
    actionUrl: 'https://lp.ogen.org/loans-for-individuals-and-families-2/',
    potentialValue: 50000,
  },
});
