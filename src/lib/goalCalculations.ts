// Goal calculation utilities for financial planning

/**
 * Calculate the number of months until a deadline
 */
export function getMonthsUntilDeadline(deadline: Date | string): number {
  const deadlineDate = new Date(deadline);
  const now = new Date();
  
  const months = (deadlineDate.getFullYear() - now.getFullYear()) * 12 
    + (deadlineDate.getMonth() - now.getMonth());
  
  return Math.max(0, months);
}

/**
 * Calculate the required monthly contribution to reach a goal
 * @param targetAmount - Total target amount
 * @param currentAmount - Amount already saved
 * @param deadline - Target deadline
 * @returns Monthly contribution required
 */
export function calculateMonthlyContribution(
  targetAmount: number,
  currentAmount: number,
  deadline: Date | string
): number {
  const monthsRemaining = getMonthsUntilDeadline(deadline);
  
  if (monthsRemaining <= 0) {
    return 0; // Deadline has passed
  }
  
  const amountNeeded = targetAmount - currentAmount;
  
  if (amountNeeded <= 0) {
    return 0; // Goal already achieved
  }
  
  return Math.ceil(amountNeeded / monthsRemaining);
}

/**
 * Calculate how many months it will take to reach a goal
 * @param targetAmount - Total target amount
 * @param currentAmount - Amount already saved
 * @param monthlyContribution - Monthly contribution amount
 * @returns Number of months to reach goal
 */
export function calculateTimeToGoal(
  targetAmount: number,
  currentAmount: number,
  monthlyContribution: number
): number {
  if (monthlyContribution <= 0) {
    return Infinity;
  }
  
  const amountNeeded = targetAmount - currentAmount;
  
  if (amountNeeded <= 0) {
    return 0; // Already achieved
  }
  
  return Math.ceil(amountNeeded / monthlyContribution);
}

/**
 * Calculate progress percentage
 */
export function calculateProgressPercentage(
  currentAmount: number,
  targetAmount: number
): number {
  if (targetAmount <= 0) return 0;
  const percentage = (currentAmount / targetAmount) * 100;
  return Math.min(100, Math.max(0, percentage));
}

/**
 * Generate projection data points for visualization
 * @param currentAmount - Starting amount
 * @param monthlyContribution - Monthly contribution
 * @param months - Number of months to project
 * @returns Array of { month, value } objects
 */
export function calculateProjection(
  currentAmount: number,
  monthlyContribution: number,
  months: number
): { month: number; value: number; date: string }[] {
  const projection: { month: number; value: number; date: string }[] = [];
  const now = new Date();
  
  for (let i = 0; i <= months; i++) {
    const projectedDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const monthLabel = projectedDate.toLocaleDateString('he-IL', { 
      month: 'short', 
      year: '2-digit' 
    });
    
    projection.push({
      month: i,
      value: currentAmount + (monthlyContribution * i),
      date: monthLabel,
    });
  }
  
  return projection;
}

/**
 * Calculate years from months
 */
export function monthsToYears(months: number): number {
  return Math.round((months / 12) * 10) / 10;
}

/**
 * Calculate months from years
 */
export function yearsToMonths(years: number): number {
  return Math.round(years * 12);
}

/**
 * Check if goal is on track based on linked recurring transaction
 * @param goal - The financial goal
 * @param linkedRecurringAmount - Amount of linked recurring transaction (if any)
 * @returns 'on_track' | 'behind' | 'ahead' | 'no_recurring'
 */
export function calculateGoalStatus(
  targetAmount: number,
  currentAmount: number,
  deadline: Date | string,
  linkedRecurringAmount?: number
): 'on_track' | 'behind' | 'ahead' | 'no_recurring' | 'completed' {
  const progressPercentage = calculateProgressPercentage(currentAmount, targetAmount);
  
  if (progressPercentage >= 100) {
    return 'completed';
  }
  
  if (!linkedRecurringAmount) {
    return 'no_recurring';
  }
  
  const requiredMonthly = calculateMonthlyContribution(targetAmount, currentAmount, deadline);
  
  if (requiredMonthly === 0) {
    return 'completed';
  }
  
  const ratio = linkedRecurringAmount / requiredMonthly;
  
  if (ratio >= 1.05) {
    return 'ahead';
  } else if (ratio >= 0.95) {
    return 'on_track';
  } else {
    return 'behind';
  }
}

/**
 * Format goal status for display
 */
export function formatGoalStatus(status: ReturnType<typeof calculateGoalStatus>): {
  label: string;
  color: string;
} {
  switch (status) {
    case 'completed':
      return { label: 'הושלם', color: '#0DBACC' };
    case 'on_track':
      return { label: 'במסלול', color: '#0DBACC' };
    case 'ahead':
      return { label: 'מקדים', color: '#0DBACC' };
    case 'behind':
      return { label: 'מפגר', color: '#F18AB5' };
    case 'no_recurring':
      return { label: 'ללא הפרשה', color: '#7E7F90' };
  }
}

// ============================================
// COMPOUND INTEREST CALCULATIONS
// ============================================

/**
 * Calculate Future Value with compound interest
 * FV = PV * (1 + r/12)^n + PMT * (((1 + r/12)^n - 1) / (r/12))
 * 
 * @param presentValue - Initial amount (PV)
 * @param monthlyPayment - Monthly contribution (PMT)
 * @param annualInterestRate - Annual interest rate as percentage (e.g., 8 for 8%)
 * @param months - Number of months (n)
 */
export function calculateFutureValueWithInterest(
  presentValue: number,
  monthlyPayment: number,
  annualInterestRate: number,
  months: number
): number {
  if (annualInterestRate === 0) {
    return presentValue + (monthlyPayment * months);
  }
  
  const monthlyRate = annualInterestRate / 100 / 12;
  const compoundFactor = Math.pow(1 + monthlyRate, months);
  
  // FV of present value
  const fvPresentValue = presentValue * compoundFactor;
  
  // FV of annuity (monthly payments)
  const fvAnnuity = monthlyPayment * ((compoundFactor - 1) / monthlyRate);
  
  return fvPresentValue + fvAnnuity;
}

/**
 * Calculate required monthly payment to reach target with compound interest
 * PMT = (FV - PV * (1 + r/12)^n) / (((1 + r/12)^n - 1) / (r/12))
 * 
 * @param targetAmount - Target future value (FV)
 * @param currentAmount - Current amount (PV)
 * @param annualInterestRate - Annual interest rate as percentage
 * @param months - Number of months
 */
export function calculateMonthlyContributionWithInterest(
  targetAmount: number,
  currentAmount: number,
  annualInterestRate: number,
  months: number
): number {
  if (months <= 0) return 0;
  if (targetAmount <= currentAmount) return 0;
  
  if (annualInterestRate === 0) {
    return Math.ceil((targetAmount - currentAmount) / months);
  }
  
  const monthlyRate = annualInterestRate / 100 / 12;
  const compoundFactor = Math.pow(1 + monthlyRate, months);
  
  // Amount needed after subtracting growth of current amount
  const amountNeeded = targetAmount - (currentAmount * compoundFactor);
  
  if (amountNeeded <= 0) {
    return 0; // Current amount will grow enough on its own
  }
  
  // Calculate required monthly payment
  const payment = amountNeeded / ((compoundFactor - 1) / monthlyRate);
  
  return Math.ceil(payment);
}

/**
 * Generate projection with compound interest
 * Returns both regular and with-interest values for comparison
 */
export function calculateProjectionWithInterest(
  currentAmount: number,
  monthlyContribution: number,
  months: number,
  annualInterestRate: number
): { month: number; value: number; valueWithInterest: number; date: string }[] {
  const projection: { month: number; value: number; valueWithInterest: number; date: string }[] = [];
  const now = new Date();
  
  for (let i = 0; i <= months; i++) {
    const projectedDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const monthLabel = projectedDate.toLocaleDateString('he-IL', { 
      month: 'short', 
      year: '2-digit' 
    });
    
    // Value without interest (linear growth)
    const valueWithoutInterest = currentAmount + (monthlyContribution * i);
    
    // Value with compound interest
    const valueWithInterest = calculateFutureValueWithInterest(
      currentAmount,
      monthlyContribution,
      annualInterestRate,
      i
    );
    
    projection.push({
      month: i,
      value: valueWithoutInterest,
      valueWithInterest: Math.round(valueWithInterest),
      date: monthLabel,
    });
  }
  
  return projection;
}

// ============================================
// DEADLINE RECALCULATION
// ============================================

/**
 * Recalculate the deadline based on current progress and monthly contribution
 * @param targetAmount - Target amount to reach
 * @param currentAmount - Current amount saved
 * @param monthlyContribution - Monthly contribution amount
 * @returns New deadline date or null if can't be calculated
 */
export function recalculateDeadline(
  targetAmount: number,
  currentAmount: number,
  monthlyContribution: number
): Date | null {
  if (currentAmount >= targetAmount) {
    // Goal already achieved
    return new Date();
  }
  
  if (monthlyContribution <= 0) {
    // Can't calculate without monthly contribution
    return null;
  }
  
  const amountRemaining = targetAmount - currentAmount;
  const monthsToGoal = Math.ceil(amountRemaining / monthlyContribution);
  
  const deadline = new Date();
  deadline.setMonth(deadline.getMonth() + monthsToGoal);
  
  return deadline;
}

