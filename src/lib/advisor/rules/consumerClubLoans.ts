/**
 * הלוואת מועדון צרכנות (חבר / אשמורת / הייטקזון)
 * 
 * תנאי: חבר במועדון צרכנות + צריך מימון
 * עדיפות: בינונית
 */

import { createRule } from '../ruleFactory';
import { hasHighInterestDebt, hasTransactionsWithKeywords } from '../helpers';
import { SERVICE_URLS, KEYWORDS } from '../constants';

export default createRule({
  id: 'consumer-club-loans',
  name: 'הלוואות מועדון צרכנות',
  
  condition: (ctx) => {
    // Check if user has transactions related to consumer clubs
    const hasClubActivity = hasTransactionsWithKeywords(ctx, KEYWORDS.CONSUMER_CLUBS);
    if (!hasClubActivity) return false;
    
    // Has debt that could benefit from cheaper financing
    return hasHighInterestDebt(ctx, 4);
  },
  
  recommendation: {
    title: 'הלוואות מועדון צרכנות בתנאים מועדפים',
    description: 'כחבר/ת מועדון צרכנות (חבר, אשמורת ועוד), את/ה עשוי/ה להיות זכאי/ת להלוואות בתנאים מסובסדים או אפילו ללא ריבית. בדוק/י הצעות עדכניות במועדון שלך.',
    type: 'banking',
    priority: 'medium',
    actionUrl: SERVICE_URLS.CONSUMER_CLUBS,
    potentialValue: 1500,
  },
});

