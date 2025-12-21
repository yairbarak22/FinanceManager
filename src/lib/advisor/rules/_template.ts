/**
 * תבנית לחוק המלצה חדש
 * 
 * הוראות שימוש:
 * 1. העתק קובץ זה לקובץ חדש (למשל: myNewRule.ts)
 * 2. שנה את ה-id לייחודי
 * 3. הגדר את התנאי (condition) - מתי להציג את ההמלצה
 * 4. כתוב את ההמלצה בעברית
 * 5. הוסף import ל-engine.ts ושים ב-ALL_RULES
 * 
 * טיפים:
 * - השתמש ב-helpers לתנאים נפוצים (isCareer, hasHighInterestDebt וכו')
 * - בדוק קבועים ב-constants.ts
 * - עדיפות: 'high' | 'medium' | 'low'
 * - סוג: 'tax_benefit' | 'savings' | 'insurance' | 'banking' | 'general'
 */

import { createRule } from '../ruleFactory';
// import { isCareer, isInAgeRange, hasNoRealEstate } from '../helpers';
// import { SERVICE_URLS, ESTIMATED_VALUES } from '../constants';

export default createRule({
  // מזהה ייחודי - שנה אותו!
  id: 'my-new-rule',
  
  // שם החוק (לשימוש פנימי)
  name: 'שם ההטבה החדשה',
  
  /**
   * התנאי - מתי להציג את ההמלצה?
   * מחזיר true אם ההמלצה רלוונטית למשתמש
   */
  condition: (ctx) => {
    // דוגמה: בדוק אם המשתמש הוא איש קבע בגיל 24-45 בלי דירה
    // return isCareer(ctx) && isInAgeRange(ctx, 24, 45) && hasNoRealEstate(ctx);
    
    // שנה את זה לתנאי שלך:
    return false;
  },
  
  /**
   * ההמלצה שתוצג למשתמש
   */
  recommendation: {
    // כותרת קצרה ותמציתית
    title: 'כותרת ההמלצה',
    
    // תיאור מפורט יותר
    description: 'תיאור מפורט של ההטבה ומה המשתמש יכול לעשות...',
    
    // סוג ההמלצה (משפיע על האייקון)
    type: 'general',
    
    // עדיפות (משפיע על הסדר)
    priority: 'medium',
    
    // קישור לפעולה (אופציונלי)
    actionUrl: undefined,
    
    // ערך כספי משוער (אופציונלי)
    potentialValue: undefined,
  },
});

