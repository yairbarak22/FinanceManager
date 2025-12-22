/**
 * פטור ממס הכנסה על שכירות (מסלול פטור)
 * 
 * תנאי: יש נדל"ן + הכנסת שכירות מתחת לתקרה
 * עדיפות: גבוהה
 */

import { createRule } from '../ruleFactory';
import { hasRealEstate, hasRentalIncome, getMonthlyRentalIncome } from '../helpers';
import { SERVICE_URLS, BALANCE_THRESHOLDS } from '../constants';

export default createRule({
  id: 'rent-income-tax-exempt',
  name: 'פטור ממס על הכנסה משכירות',
  
  condition: (ctx) => {
    // Must have real estate
    if (!hasRealEstate(ctx)) return false;
    
    // Must have rental income
    if (!hasRentalIncome(ctx)) return false;
    
    // Rental income must be below exemption threshold
    const monthlyRent = getMonthlyRentalIncome(ctx);
    return monthlyRent > 0 && monthlyRent <= BALANCE_THRESHOLDS.RENT_EXEMPTION;
  },
  
  recommendation: {
    title: 'פטור ממס הכנסה על שכירות',
    description: 'הכנסות משכירות למגורים עד 5,654 ₪ לחודש (2024) פטורות לחלוטין ממס ודיווח. וודא/י שאת/ה מנצל/ת את מסלול הפטור ולא משלמ/ת מס שלא לצורך.',
    type: 'tax_benefit',
    priority: 'high',
    actionUrl: SERVICE_URLS.RENT_TAX_EXEMPTION,
    potentialValue: 6700,
  },
});

