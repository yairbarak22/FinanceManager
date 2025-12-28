/**
 * הלוואה ללא ריבית במועדון חבר
 *
 * תנאי: איש קבע
 * עדיפות: גבוהה
 */

import { createRule } from '../ruleFactory';
import { isCareer } from '../helpers';

export default createRule({
  id: 'haver-club-loan',
  name: 'הלוואה ללא ריבית במועדון חבר',

  condition: (ctx) => {
    return isCareer(ctx);
  },

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
