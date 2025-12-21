/**
 * עמותת מגורים לאנשי קבע
 * 
 * תנאי: איש קבע + גיל 24-45 + אין נכס נדל"ן
 * עדיפות: גבוהה
 */

import { createRule } from '../ruleFactory';
import { isCareer, isInAgeRange, hasNoRealEstate } from '../helpers';
import { SERVICE_URLS, ESTIMATED_VALUES, AGE_RANGES } from '../constants';

export default createRule({
  id: 'career-housing-association',
  name: 'עמותת מגורים לאנשי קבע',
  
  condition: (ctx) => {
    return (
      isCareer(ctx) &&
      isInAgeRange(ctx, AGE_RANGES.CAREER_HOUSING_MIN, AGE_RANGES.CAREER_HOUSING_MAX) &&
      hasNoRealEstate(ctx)
    );
  },
  
  recommendation: {
    title: 'עמותת המגורים לאנשי קבע',
    description: 'כאיש/אשת קבע בטווח הגילאים 24-45 ללא דירה בבעלותך, את/ה זכאי/ת להצטרף לעמותת המגורים. העמותה מציעה דירות במחירים מוזלים משמעותית מתחת למחיר השוק.',
    type: 'savings',
    priority: 'high',
    actionUrl: SERVICE_URLS.CAREER_HOUSING,
    potentialValue: ESTIMATED_VALUES.CAREER_HOUSING_SAVINGS,
  },
});

