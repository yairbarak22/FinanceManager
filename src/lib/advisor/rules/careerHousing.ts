/**
 * עמותת מגורים לאנשי קבע
 *
 * תנאי: איש קבע + גיל 24-45
 * עדיפות: גבוהה
 */

import { createRule } from '../ruleFactory';
import { isCareer, isInAgeRange, getEstimatedAge } from '../helpers';
import { AGE_RANGES } from '../constants';

export default createRule({
  id: 'career-housing-association',
  name: 'עמותת מגורים לאנשי קבע',

  condition: (ctx) => {
    return (
      isCareer(ctx) &&
      isInAgeRange(ctx, AGE_RANGES.CAREER_HOUSING_MIN, AGE_RANGES.CAREER_HOUSING_MAX)
    );
  },

  getEligibilityReason: (ctx) => {
    const age = getEstimatedAge(ctx);
    return `סטטוס צבאי: קבע, גיל משוער: ${age} (בטווח ${AGE_RANGES.CAREER_HOUSING_MIN}-${AGE_RANGES.CAREER_HOUSING_MAX})`;
  },

  recommendation: {
    title: 'עמותת המגורים לאנשי קבע',
    description: 'כאיש/אשת קבע בטווח הגילאים 24-45, את/ה זכאי/ת להצטרף לעמותת המגורים. העמותה מציעה דירות במחירים מוזלים משמעותית מתחת למחיר השוק.',
    type: 'savings',
    priority: 'high',
    actionUrl: 'https://www.amutot-megurim.co.il/מיזמים/',
    potentialValue: 300000,
  },
});
