/**
 * Financial Calculations Library
 * Contains calculation functions for various financial calculators
 */

// ============================================================================
// Israeli Tax Calculations (2024)
// ============================================================================

// Tax brackets for 2024 (annual amounts)
const TAX_BRACKETS_2024 = [
  { min: 0, max: 84120, rate: 0.10 },
  { min: 84120, max: 120720, rate: 0.14 },
  { min: 120720, max: 193800, rate: 0.20 },
  { min: 193800, max: 269280, rate: 0.31 },
  { min: 269280, max: 560280, rate: 0.35 },
  { min: 560280, max: Infinity, rate: 0.47 },
];

// Credit point value for 2024
const CREDIT_POINT_VALUE_MONTHLY = 242; // Updated for 2024

// National Insurance thresholds (monthly)
const NI_THRESHOLD_LOW = 7522; // 60% of average wage
const NI_THRESHOLD_HIGH = 49030; // Maximum insurable income

// National Insurance rates for employees
const NI_RATE_LOW = 0.004; // 0.4% up to threshold
const NI_RATE_HIGH = 0.07; // 7% above threshold

// Health Insurance rates
const HEALTH_RATE_LOW = 0.031; // 3.1% up to threshold
const HEALTH_RATE_HIGH = 0.05; // 5% above threshold

export interface SalaryBreakdown {
  grossSalary: number;
  incomeTax: number;
  nationalInsurance: number;
  healthInsurance: number;
  totalDeductions: number;
  netSalary: number;
  effectiveTaxRate: number;
  marginalTaxRate: number;
}

/**
 * Calculate Israeli income tax (monthly)
 */
export function calculateIncomeTax(monthlyGross: number, creditPoints: number): number {
  const annualGross = monthlyGross * 12;
  let tax = 0;

  for (const bracket of TAX_BRACKETS_2024) {
    if (annualGross <= bracket.min) break;
    const taxableInBracket = Math.min(annualGross, bracket.max) - bracket.min;
    tax += taxableInBracket * bracket.rate;
  }

  // Apply credit points
  const creditDeduction = creditPoints * CREDIT_POINT_VALUE_MONTHLY * 12;
  const annualTax = Math.max(0, tax - creditDeduction);

  return annualTax / 12;
}

/**
 * Calculate National Insurance (Bituach Leumi)
 */
export function calculateNationalInsurance(monthlyGross: number): number {
  if (monthlyGross <= 0) return 0;

  const cappedGross = Math.min(monthlyGross, NI_THRESHOLD_HIGH);
  
  if (cappedGross <= NI_THRESHOLD_LOW) {
    return cappedGross * NI_RATE_LOW;
  }

  const lowPart = NI_THRESHOLD_LOW * NI_RATE_LOW;
  const highPart = (cappedGross - NI_THRESHOLD_LOW) * NI_RATE_HIGH;

  return lowPart + highPart;
}

/**
 * Calculate Health Insurance (Bituach Briut)
 */
export function calculateHealthInsurance(monthlyGross: number): number {
  if (monthlyGross <= 0) return 0;

  const cappedGross = Math.min(monthlyGross, NI_THRESHOLD_HIGH);
  
  if (cappedGross <= NI_THRESHOLD_LOW) {
    return cappedGross * HEALTH_RATE_LOW;
  }

  const lowPart = NI_THRESHOLD_LOW * HEALTH_RATE_LOW;
  const highPart = (cappedGross - NI_THRESHOLD_LOW) * HEALTH_RATE_HIGH;

  return lowPart + highPart;
}

/**
 * Get marginal tax rate for a given income
 */
export function getMarginalTaxRate(monthlyGross: number): number {
  const annualGross = monthlyGross * 12;
  
  for (let i = TAX_BRACKETS_2024.length - 1; i >= 0; i--) {
    if (annualGross > TAX_BRACKETS_2024[i].min) {
      return TAX_BRACKETS_2024[i].rate * 100;
    }
  }
  
  return TAX_BRACKETS_2024[0].rate * 100;
}

/**
 * Calculate full salary breakdown
 */
export function calculateSalaryBreakdown(
  grossSalary: number,
  creditPoints: number = 2.25
): SalaryBreakdown {
  const incomeTax = calculateIncomeTax(grossSalary, creditPoints);
  const nationalInsurance = calculateNationalInsurance(grossSalary);
  const healthInsurance = calculateHealthInsurance(grossSalary);
  const totalDeductions = incomeTax + nationalInsurance + healthInsurance;
  const netSalary = grossSalary - totalDeductions;
  const effectiveTaxRate = grossSalary > 0 ? (totalDeductions / grossSalary) * 100 : 0;
  const marginalTaxRate = getMarginalTaxRate(grossSalary);

  return {
    grossSalary,
    incomeTax: Math.round(incomeTax),
    nationalInsurance: Math.round(nationalInsurance),
    healthInsurance: Math.round(healthInsurance),
    totalDeductions: Math.round(totalDeductions),
    netSalary: Math.round(netSalary),
    effectiveTaxRate: Math.round(effectiveTaxRate * 10) / 10,
    marginalTaxRate,
  };
}

// ============================================================================
// FIRE (Financial Independence, Retire Early) Calculations
// ============================================================================

export interface FIREResult {
  fireNumber: number;
  yearsToFIRE: number;
  monthsToFIRE: number;
  currentSavingsRate: number;
  projectedPath: { year: number; savings: number; fireNumber: number }[];
}

/**
 * Calculate FIRE number and time to reach it
 * Uses the 4% rule (25x annual expenses)
 */
export function calculateFIRE(
  monthlyExpenses: number,
  monthlyIncome: number,
  currentSavings: number = 0,
  expectedReturn: number = 7, // Annual percentage
  inflationRate: number = 2.5 // Annual percentage
): FIREResult {
  const annualExpenses = monthlyExpenses * 12;
  const fireNumber = annualExpenses * 25; // 4% rule
  const monthlySavings = monthlyIncome - monthlyExpenses;
  const currentSavingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0;
  
  // Real return (adjusted for inflation)
  const realReturn = (1 + expectedReturn / 100) / (1 + inflationRate / 100) - 1;
  const monthlyReturn = realReturn / 12;

  const projectedPath: { year: number; savings: number; fireNumber: number }[] = [];
  let savings = currentSavings;
  let months = 0;
  const maxYears = 100;

  // Year 0
  projectedPath.push({
    year: 0,
    savings: Math.round(savings),
    fireNumber: fireNumber,
  });

  while (savings < fireNumber && months < maxYears * 12) {
    savings = savings * (1 + monthlyReturn) + monthlySavings;
    months++;

    if (months % 12 === 0) {
      projectedPath.push({
        year: months / 12,
        savings: Math.round(savings),
        fireNumber: fireNumber,
      });
    }
  }

  const yearsToFIRE = Math.floor(months / 12);
  const monthsToFIRE = months % 12;

  // Ensure we have at least some data points
  if (projectedPath.length < 2 && months > 0) {
    projectedPath.push({
      year: months / 12,
      savings: Math.round(savings),
      fireNumber: fireNumber,
    });
  }

  return {
    fireNumber: Math.round(fireNumber),
    yearsToFIRE,
    monthsToFIRE,
    currentSavingsRate: Math.round(currentSavingsRate * 10) / 10,
    projectedPath,
  };
}

// ============================================================================
// Buy vs Rent Calculations
// ============================================================================

export interface BuyVsRentResult {
  breakEvenYears: number | null;
  buyingCostAtBreakEven: number;
  rentingCostAtBreakEven: number;
  recommendation: 'buy' | 'rent' | 'neutral';
  projectedCosts: {
    year: number;
    buyingCost: number;
    rentingCost: number;
    buyingEquity: number;
  }[];
}

/**
 * Compare buying vs renting a property
 */
export function calculateBuyVsRent(
  propertyPrice: number,
  monthlyRent: number,
  downPaymentPercent: number = 25,
  mortgageRate: number = 4.5,
  mortgageYears: number = 25,
  propertyAppreciation: number = 3, // Annual %
  rentIncrease: number = 2.5, // Annual %
  maintenanceCostPercent: number = 1, // % of property value annually
  alternativeReturnRate: number = 7, // What you'd earn on down payment if renting
  yearsToProject: number = 30
): BuyVsRentResult {
  const downPayment = propertyPrice * (downPaymentPercent / 100);
  const loanAmount = propertyPrice - downPayment;
  const monthlyRate = mortgageRate / 100 / 12;
  const numPayments = mortgageYears * 12;

  // Monthly mortgage payment (Spitzer)
  const monthlyMortgage = monthlyRate > 0
    ? loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1)
    : loanAmount / numPayments;

  const projectedCosts: BuyVsRentResult['projectedCosts'] = [];
  let cumulativeBuyingCost = downPayment; // Start with down payment
  let cumulativeRentingCost = 0;
  let currentPropertyValue = propertyPrice;
  let currentRent = monthlyRent;
  let remainingLoan = loanAmount;
  let breakEvenYear: number | null = null;

  // Track opportunity cost of down payment (what you'd earn if you rented)
  let investedDownPayment = downPayment;

  for (let year = 1; year <= yearsToProject; year++) {
    // Buying costs for this year
    const yearlyMortgage = monthlyMortgage * 12;
    const yearlyMaintenance = currentPropertyValue * (maintenanceCostPercent / 100);
    const yearlyBuyingCost = yearlyMortgage + yearlyMaintenance;
    cumulativeBuyingCost += yearlyBuyingCost;

    // Update loan balance (simplified - actual amortization is more complex)
    if (year <= mortgageYears) {
      const yearlyPrincipal = loanAmount / mortgageYears;
      remainingLoan = Math.max(0, remainingLoan - yearlyPrincipal);
    }

    // Property appreciation
    currentPropertyValue *= (1 + propertyAppreciation / 100);

    // Renting costs for this year
    const yearlyRent = currentRent * 12;
    cumulativeRentingCost += yearlyRent;
    currentRent *= (1 + rentIncrease / 100);

    // Opportunity cost - what the down payment would have grown to
    investedDownPayment *= (1 + alternativeReturnRate / 100);

    // Equity in home vs alternative investment
    const homeEquity = currentPropertyValue - remainingLoan;
    const netBuyingPosition = homeEquity - cumulativeBuyingCost;
    const netRentingPosition = investedDownPayment - cumulativeRentingCost;

    projectedCosts.push({
      year,
      buyingCost: Math.round(cumulativeBuyingCost),
      rentingCost: Math.round(cumulativeRentingCost),
      buyingEquity: Math.round(homeEquity),
    });

    // Check for break-even (when buying becomes better than renting considering equity)
    if (!breakEvenYear && netBuyingPosition > netRentingPosition) {
      breakEvenYear = year;
    }
  }

  const lastYear = projectedCosts[projectedCosts.length - 1];
  let recommendation: 'buy' | 'rent' | 'neutral' = 'neutral';
  
  if (breakEvenYear && breakEvenYear <= 10) {
    recommendation = 'buy';
  } else if (!breakEvenYear || breakEvenYear > 20) {
    recommendation = 'rent';
  }

  return {
    breakEvenYears: breakEvenYear,
    buyingCostAtBreakEven: breakEvenYear ? projectedCosts[breakEvenYear - 1].buyingCost : lastYear.buyingCost,
    rentingCostAtBreakEven: breakEvenYear ? projectedCosts[breakEvenYear - 1].rentingCost : lastYear.rentingCost,
    recommendation,
    projectedCosts,
  };
}

// ============================================================================
// Education Fund Calculations
// ============================================================================

export interface EducationFundResult {
  requiredMonthlyDeposit: number;
  totalDeposits: number;
  totalInterest: number;
  projectedGrowth: { year: number; balance: number; deposits: number }[];
}

/**
 * Calculate required monthly deposit for education fund
 */
export function calculateEducationFund(
  targetAmount: number,
  yearsUntilNeeded: number,
  initialDeposit: number = 0,
  expectedReturn: number = 5 // Annual percentage
): EducationFundResult {
  const monthlyRate = expectedReturn / 100 / 12;
  const months = yearsUntilNeeded * 12;

  // Future value of initial deposit
  const futureValueOfInitial = initialDeposit * Math.pow(1 + monthlyRate, months);
  
  // Amount needed from monthly deposits
  const remainingAmount = targetAmount - futureValueOfInitial;

  // Calculate required monthly deposit using annuity formula
  // PMT = FV * r / ((1 + r)^n - 1)
  let requiredMonthlyDeposit = 0;
  if (monthlyRate > 0 && months > 0) {
    const factor = Math.pow(1 + monthlyRate, months) - 1;
    requiredMonthlyDeposit = remainingAmount * monthlyRate / factor;
  } else if (months > 0) {
    requiredMonthlyDeposit = remainingAmount / months;
  }

  requiredMonthlyDeposit = Math.max(0, requiredMonthlyDeposit);

  // Generate projected growth
  const projectedGrowth: EducationFundResult['projectedGrowth'] = [];
  let balance = initialDeposit;
  let totalDeposited = initialDeposit;

  projectedGrowth.push({
    year: 0,
    balance: Math.round(balance),
    deposits: Math.round(totalDeposited),
  });

  for (let year = 1; year <= yearsUntilNeeded; year++) {
    for (let month = 0; month < 12; month++) {
      balance = balance * (1 + monthlyRate) + requiredMonthlyDeposit;
      totalDeposited += requiredMonthlyDeposit;
    }

    projectedGrowth.push({
      year,
      balance: Math.round(balance),
      deposits: Math.round(totalDeposited),
    });
  }

  const totalDeposits = Math.round(initialDeposit + requiredMonthlyDeposit * months);
  const totalInterest = Math.round(balance - totalDeposits);

  return {
    requiredMonthlyDeposit: Math.round(requiredMonthlyDeposit),
    totalDeposits,
    totalInterest,
    projectedGrowth,
  };
}

// ============================================================================
// Emergency Fund Calculations
// ============================================================================

export interface EmergencyFundResult {
  recommendedAmount: number;
  monthsOfSecurity: number;
  categories: { name: string; amount: number; percentage: number }[];
  savingsPlan: { month: number; balance: number }[];
}

/**
 * Calculate recommended emergency fund amount
 */
export function calculateEmergencyFund(
  monthlyExpenses: number,
  monthsOfSecurity: number = 6,
  currentSavings: number = 0,
  monthlySavingsRate: number = 0
): EmergencyFundResult {
  const recommendedAmount = monthlyExpenses * monthsOfSecurity;
  const amountNeeded = Math.max(0, recommendedAmount - currentSavings);

  // Expense breakdown categories (typical allocation)
  const categories = [
    { name: 'דיור', amount: monthlyExpenses * 0.35, percentage: 35 },
    { name: 'מזון', amount: monthlyExpenses * 0.15, percentage: 15 },
    { name: 'תחבורה', amount: monthlyExpenses * 0.15, percentage: 15 },
    { name: 'ביטוחים', amount: monthlyExpenses * 0.10, percentage: 10 },
    { name: 'חינוך', amount: monthlyExpenses * 0.10, percentage: 10 },
    { name: 'אחר', amount: monthlyExpenses * 0.15, percentage: 15 },
  ];

  // Generate savings plan
  const savingsPlan: { month: number; balance: number }[] = [];
  let balance = currentSavings;
  let month = 0;

  savingsPlan.push({ month: 0, balance: Math.round(balance) });

  if (monthlySavingsRate > 0) {
    while (balance < recommendedAmount && month < 120) {
      month++;
      balance += monthlySavingsRate;
      if (month % 3 === 0 || balance >= recommendedAmount) {
        savingsPlan.push({ month, balance: Math.round(Math.min(balance, recommendedAmount)) });
      }
    }
  }

  return {
    recommendedAmount: Math.round(recommendedAmount),
    monthsOfSecurity,
    categories: categories.map(c => ({ ...c, amount: Math.round(c.amount) })),
    savingsPlan,
  };
}

// ============================================================================
// Mortgage Calculations (Extended)
// ============================================================================

export interface MortgageResult {
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  amortizationSchedule: {
    year: number;
    payment: number;
    principal: number;
    interest: number;
    balance: number;
  }[];
}

/**
 * Calculate mortgage details with full amortization schedule
 */
export function calculateMortgage(
  principal: number,
  annualRate: number,
  termYears: number,
  method: 'spitzer' | 'equal_principal' = 'spitzer'
): MortgageResult {
  const termMonths = termYears * 12;
  const monthlyRate = annualRate / 100 / 12;

  let monthlyPayment: number;
  const amortizationSchedule: MortgageResult['amortizationSchedule'] = [];
  let balance = principal;
  let totalInterest = 0;

  if (method === 'spitzer') {
    // Spitzer - constant payment
    if (monthlyRate === 0) {
      monthlyPayment = principal / termMonths;
    } else {
      const factor = Math.pow(1 + monthlyRate, termMonths);
      monthlyPayment = principal * (monthlyRate * factor) / (factor - 1);
    }

    for (let year = 1; year <= termYears; year++) {
      let yearlyPayment = 0;
      let yearlyPrincipal = 0;
      let yearlyInterest = 0;

      for (let month = 0; month < 12; month++) {
        const interest = balance * monthlyRate;
        const principalPayment = monthlyPayment - interest;
        balance = Math.max(0, balance - principalPayment);

        yearlyPayment += monthlyPayment;
        yearlyPrincipal += principalPayment;
        yearlyInterest += interest;
        totalInterest += interest;
      }

      amortizationSchedule.push({
        year,
        payment: Math.round(yearlyPayment),
        principal: Math.round(yearlyPrincipal),
        interest: Math.round(yearlyInterest),
        balance: Math.round(balance),
      });
    }
  } else {
    // Equal principal
    const principalPerMonth = principal / termMonths;
    monthlyPayment = principalPerMonth + principal * monthlyRate; // First month (highest)

    for (let year = 1; year <= termYears; year++) {
      let yearlyPayment = 0;
      let yearlyPrincipal = 0;
      let yearlyInterest = 0;

      for (let month = 0; month < 12; month++) {
        const interest = balance * monthlyRate;
        const payment = principalPerMonth + interest;
        balance = Math.max(0, balance - principalPerMonth);

        yearlyPayment += payment;
        yearlyPrincipal += principalPerMonth;
        yearlyInterest += interest;
        totalInterest += interest;
      }

      amortizationSchedule.push({
        year,
        payment: Math.round(yearlyPayment),
        principal: Math.round(yearlyPrincipal),
        interest: Math.round(yearlyInterest),
        balance: Math.round(balance),
      });
    }
  }

  const totalPayment = method === 'spitzer'
    ? monthlyPayment * termMonths
    : principal + totalInterest;

  return {
    monthlyPayment: Math.round(monthlyPayment),
    totalPayment: Math.round(totalPayment),
    totalInterest: Math.round(totalInterest),
    amortizationSchedule,
  };
}


