/**
 * הלוואה ללא ריבית במועדון חבר
 *
 * תנאי: איש קבע
 * עדיפות: גבוהה
 * 
 * @deprecated Military status field has been removed - rule will never trigger
 */

import { createRule } from '../ruleFactory';

export default createRule({
  id: 'haver-club-loan',
  name: 'הלוואה ללא ריבית במועדון חבר',

  // Always return false - military status removed
  condition: () => false,

  getEligibilityReason: () => {
    return 'סטטוס צבאי: קבע';
  },

  recommendation: {
    title: 'הלוואה של 10,000₪ ללא ריבית במועדון חבר',
    description: 'כאיש/אשת קבע, את/ה זכאי/ת להלוואה של 10,000₪ ללא ריבית במועדון חבר. אפשר לקחת את ההלוואה ולהשקיע את הכסף, ובכך להגדיל את ההון תוך ניצול כסף "חינמי".',
    type: 'banking',
    priority: 'high',
    actionUrl: 'https://www.hever.co.il/',
    potentialValue: 10000,
  },
});
