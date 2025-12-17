import { AmortizationRow, Liability } from './types';

/**
 * Calculate monthly payment for Spitzer (שפיצר) loan
 * PMT = P * [r(1+r)^n] / [(1+r)^n - 1]
 */
export function calculateSpitzerPayment(
  principal: number,
  annualRate: number,
  termMonths: number
): number {
  // Guard against division by zero
  if (termMonths <= 0) {
    return 0;
  }
  
  if (annualRate === 0) {
    return principal / termMonths;
  }
  
  const monthlyRate = annualRate / 100 / 12;
  const factor = Math.pow(1 + monthlyRate, termMonths);
  return principal * (monthlyRate * factor) / (factor - 1);
}

/**
 * Generate full amortization schedule
 */
export function generateAmortizationSchedule(
  principal: number,
  annualRate: number,
  termMonths: number,
  startDate: Date,
  method: 'spitzer' | 'equal_principal' = 'spitzer'
): AmortizationRow[] {
  // Guard against invalid inputs
  if (termMonths <= 0 || principal <= 0) {
    return [];
  }
  
  const schedule: AmortizationRow[] = [];
  const monthlyRate = annualRate / 100 / 12;
  let balance = principal;
  
  if (method === 'spitzer') {
    // שפיצר - תשלום קבוע
    const payment = calculateSpitzerPayment(principal, annualRate, termMonths);
    
    for (let month = 1; month <= termMonths; month++) {
      const interest = balance * monthlyRate;
      const principalPayment = payment - interest;
      balance = Math.max(0, balance - principalPayment);
      
      const date = new Date(startDate);
      date.setMonth(date.getMonth() + month);
      
      schedule.push({
        month,
        date,
        payment: Math.round(payment * 100) / 100,
        principal: Math.round(principalPayment * 100) / 100,
        interest: Math.round(interest * 100) / 100,
        balance: Math.round(balance * 100) / 100,
      });
    }
  } else {
    // קרן שווה - החזר קרן קבוע
    const principalPayment = principal / termMonths;
    
    for (let month = 1; month <= termMonths; month++) {
      const interest = balance * monthlyRate;
      const payment = principalPayment + interest;
      balance = Math.max(0, balance - principalPayment);
      
      const date = new Date(startDate);
      date.setMonth(date.getMonth() + month);
      
      schedule.push({
        month,
        date,
        payment: Math.round(payment * 100) / 100,
        principal: Math.round(principalPayment * 100) / 100,
        interest: Math.round(interest * 100) / 100,
        balance: Math.round(balance * 100) / 100,
      });
    }
  }
  
  return schedule;
}

/**
 * Get current month's payment details from amortization schedule
 */
export function getCurrentMonthPayment(
  liability: Liability
): { payment: number; principal: number; interest: number; currentMonth: number } | null {
  if (!liability.interestRate || !liability.loanTermMonths || !liability.startDate) {
    // If no loan details, return the flat monthly payment
    return {
      payment: liability.monthlyPayment,
      principal: liability.monthlyPayment,
      interest: 0,
      currentMonth: 0,
    };
  }
  
  const startDate = new Date(liability.startDate);
  const now = new Date();
  
  // Calculate how many months have passed
  const monthsPassed = 
    (now.getFullYear() - startDate.getFullYear()) * 12 + 
    (now.getMonth() - startDate.getMonth());
  
  const currentMonth = monthsPassed + 1;
  
  // If loan is finished or not started
  if (currentMonth < 1 || currentMonth > liability.loanTermMonths) {
    return null;
  }
  
  const schedule = generateAmortizationSchedule(
    liability.totalAmount,
    liability.interestRate,
    liability.loanTermMonths,
    startDate,
    liability.loanMethod || 'spitzer'
  );
  
  const currentRow = schedule[currentMonth - 1];
  
  if (!currentRow) {
    return null;
  }
  
  return {
    payment: currentRow.payment,
    principal: currentRow.principal,
    interest: currentRow.interest,
    currentMonth,
  };
}

/**
 * Calculate effective monthly expense for a liability
 * If hasInterestRebate is true, only the principal counts as expense
 */
export function getEffectiveMonthlyExpense(liability: Liability): number {
  const paymentDetails = getCurrentMonthPayment(liability);
  
  if (!paymentDetails) {
    return 0;
  }
  
  if (liability.hasInterestRebate) {
    // זיכוי על הריבית - רק הקרן נחשבת כהוצאה
    return paymentDetails.principal;
  }
  
  return paymentDetails.payment;
}

/**
 * Calculate remaining balance at current date
 */
export function getRemainingBalance(liability: Liability): number {
  if (!liability.interestRate || !liability.loanTermMonths || !liability.startDate) {
    return liability.remainingAmount || liability.totalAmount;
  }
  
  const paymentDetails = getCurrentMonthPayment(liability);
  
  if (!paymentDetails || paymentDetails.currentMonth < 1) {
    return liability.totalAmount;
  }
  
  const schedule = generateAmortizationSchedule(
    liability.totalAmount,
    liability.interestRate,
    liability.loanTermMonths,
    new Date(liability.startDate),
    liability.loanMethod || 'spitzer'
  );
  
  const currentRow = schedule[paymentDetails.currentMonth - 1];
  return currentRow ? currentRow.balance : 0;
}

