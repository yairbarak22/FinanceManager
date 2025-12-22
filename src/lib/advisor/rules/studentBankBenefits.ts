/**
 * הטבות בנקים לסטודנטים
 * 
 * תנאי: סטודנט
 * עדיפות: בינונית
 */

import { createRule } from '../ruleFactory';
import { isStudent } from '../helpers';
import { SERVICE_URLS } from '../constants';

export default createRule({
  id: 'student-bank-benefits',
  name: 'הטבות בנקים לסטודנטים',
  
  condition: (ctx) => {
    return isStudent(ctx);
  },
  
  recommendation: {
    title: 'הטבות בנקאיות לסטודנטים',
    description: 'כסטודנט/ית את/ה זכאי/ת לחשבון ללא עמלות עו"ש ולעיתים להלוואות ללא ריבית (עד 10,000 ₪). וודא/י שהחשבון שלך מוגדר כחשבון סטודנט.',
    type: 'banking',
    priority: 'medium',
    actionUrl: SERVICE_URLS.STUDENT_BANK,
    potentialValue: 400,
  },
});

