import { Holding, InvestmentCalculation } from './types';

/**
 * Calculate how much to invest in each holding to maintain target allocation
 * WITHOUT selling any existing holdings - only by adding new money
 * 
 * Algorithm:
 * 1. Calculate how much each holding is below its target value (deficit)
 * 2. If total deficit >= investment amount: distribute proportionally to deficits
 * 3. If total deficit < investment amount: fix all deficits, then distribute remainder
 *    proportionally to target allocations
 * 
 * This ensures:
 * - No selling (only positive additions)
 * - The entire investment amount is used
 * - Under-allocated holdings get priority
 */
export function calculateInvestmentAllocation(
  holdings: Holding[],
  investmentAmount: number
): InvestmentCalculation[] {
  if (holdings.length === 0) {
    return [];
  }

  // Calculate current total value
  const currentTotal = holdings.reduce((sum, h) => sum + h.currentValue, 0);
  
  // New total after investment
  const newTotal = currentTotal + investmentAmount;

  // Step 1: Calculate deficit for each holding (how much below target)
  const holdingsWithDeficit = holdings.map((holding) => {
    const targetValue = (holding.targetAllocation / 100) * newTotal;
    const deficit = Math.max(0, targetValue - holding.currentValue);
    return { holding, targetValue, deficit };
  });

  // Total deficit across all holdings
  const totalDeficit = holdingsWithDeficit.reduce((sum, h) => sum + h.deficit, 0);

  // Step 2: Distribute the investment amount
  const amountsToInvest: Map<string, number> = new Map();

  if (totalDeficit >= investmentAmount) {
    // Not enough money to fix all deficits - distribute proportionally to deficits
    holdingsWithDeficit.forEach(({ holding, deficit }) => {
      if (totalDeficit > 0 && deficit > 0) {
        const share = (deficit / totalDeficit) * investmentAmount;
        amountsToInvest.set(holding.id, share);
      } else {
        amountsToInvest.set(holding.id, 0);
      }
    });
  } else {
    // We have more money than needed to fix deficits
    // First, give each holding what it needs to fix the deficit
    // Then distribute the remainder proportionally to target allocations
    const remainder = investmentAmount - totalDeficit;
    
    holdingsWithDeficit.forEach(({ holding, deficit }) => {
      // Base amount: fix the deficit
      let amount = deficit;
      
      // Add proportional share of remainder based on target allocation
      amount += (holding.targetAllocation / 100) * remainder;
      
      amountsToInvest.set(holding.id, amount);
    });
  }

  // Step 3: Build the result
  return holdings.map((holding) => {
    const currentAllocation = currentTotal > 0 
      ? (holding.currentValue / currentTotal) * 100 
      : 0;

    const amountToInvest = amountsToInvest.get(holding.id) || 0;
    const newValue = holding.currentValue + amountToInvest;
    const actualNewTotal = currentTotal + investmentAmount;
    const newAllocation = actualNewTotal > 0 ? (newValue / actualNewTotal) * 100 : 0;

    return {
      holdingId: holding.id,
      holdingName: holding.name,
      currentValue: holding.currentValue,
      targetAllocation: holding.targetAllocation,
      currentAllocation: Math.round(currentAllocation * 100) / 100,
      amountToInvest: Math.round(amountToInvest * 100) / 100,
      newValue: Math.round(newValue * 100) / 100,
      newAllocation: Math.round(newAllocation * 100) / 100,
    };
  });
}

/**
 * Validate that target allocations sum to 100%
 */
export function validateAllocations(holdings: Holding[]): {
  isValid: boolean;
  total: number;
  message?: string;
} {
  const total = holdings.reduce((sum, h) => sum + h.targetAllocation, 0);
  const isValid = Math.abs(total - 100) < 0.01; // Allow small floating point errors

  return {
    isValid,
    total: Math.round(total * 100) / 100,
    message: isValid 
      ? undefined 
      : `סכום האחוזים הוא ${total.toFixed(1)}% במקום 100%`,
  };
}

/**
 * Calculate portfolio summary statistics
 */
export function calculatePortfolioSummary(holdings: Holding[]): {
  totalValue: number;
  holdingsCount: number;
  allocationValid: boolean;
  allocationTotal: number;
} {
  const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
  const { isValid, total } = validateAllocations(holdings);

  return {
    totalValue,
    holdingsCount: holdings.length,
    allocationValid: isValid,
    allocationTotal: total,
  };
}

/**
 * Calculate how many monthly investments are needed to reach ideal allocation
 * 
 * Returns the number of months (investments) needed for all holdings to be
 * within the tolerance of their target allocation
 * 
 * @param holdings - Current portfolio holdings
 * @param monthlyInvestment - Amount invested each month
 * @param tolerancePercent - How close to target is considered "ideal" (default 1%)
 * @param maxMonths - Maximum months to simulate (default 120 = 10 years)
 */
export function calculateMonthsToIdealAllocation(
  holdings: Holding[],
  monthlyInvestment: number,
  tolerancePercent: number = 1,
  maxMonths: number = 120
): { months: number; reachable: boolean; finalAllocations: { name: string; current: number; target: number }[] } {
  if (holdings.length === 0 || monthlyInvestment <= 0) {
    return { months: 0, reachable: false, finalAllocations: [] };
  }

  // Check if already at ideal allocation
  const isAtIdeal = (currentHoldings: { currentValue: number; targetAllocation: number }[], total: number) => {
    return currentHoldings.every(h => {
      const currentAlloc = total > 0 ? (h.currentValue / total) * 100 : 0;
      return Math.abs(currentAlloc - h.targetAllocation) <= tolerancePercent;
    });
  };

  // Create a simulation copy of holdings
  let simHoldings = holdings.map(h => ({
    ...h,
    currentValue: h.currentValue,
  }));

  let currentTotal = simHoldings.reduce((sum, h) => sum + h.currentValue, 0);

  // Check if already ideal
  if (isAtIdeal(simHoldings, currentTotal)) {
    return {
      months: 0,
      reachable: true,
      finalAllocations: simHoldings.map(h => ({
        name: h.name,
        current: currentTotal > 0 ? (h.currentValue / currentTotal) * 100 : 0,
        target: h.targetAllocation,
      })),
    };
  }

  // Simulate monthly investments
  for (let month = 1; month <= maxMonths; month++) {
    // Calculate new total after this investment
    const newTotal = currentTotal + monthlyInvestment;

    // Calculate how much goes to each holding using the same algorithm
    const holdingsWithDeficit = simHoldings.map((holding) => {
      const targetValue = (holding.targetAllocation / 100) * newTotal;
      const deficit = Math.max(0, targetValue - holding.currentValue);
      return { holding, deficit };
    });

    const totalDeficit = holdingsWithDeficit.reduce((sum, h) => sum + h.deficit, 0);

    // Apply the investment
    if (totalDeficit >= monthlyInvestment) {
      // Distribute proportionally to deficits
      holdingsWithDeficit.forEach(({ holding, deficit }) => {
        if (totalDeficit > 0 && deficit > 0) {
          holding.currentValue += (deficit / totalDeficit) * monthlyInvestment;
        }
      });
    } else {
      // Fix deficits and distribute remainder
      const remainder = monthlyInvestment - totalDeficit;
      holdingsWithDeficit.forEach(({ holding, deficit }) => {
        holding.currentValue += deficit + (holding.targetAllocation / 100) * remainder;
      });
    }

    currentTotal = newTotal;

    // Check if we've reached ideal allocation
    if (isAtIdeal(simHoldings, currentTotal)) {
      return {
        months: month,
        reachable: true,
        finalAllocations: simHoldings.map(h => ({
          name: h.name,
          current: currentTotal > 0 ? (h.currentValue / currentTotal) * 100 : 0,
          target: h.targetAllocation,
        })),
      };
    }
  }

  // Didn't reach ideal within maxMonths
  return {
    months: maxMonths,
    reachable: false,
    finalAllocations: simHoldings.map(h => ({
      name: h.name,
      current: currentTotal > 0 ? (h.currentValue / currentTotal) * 100 : 0,
      target: h.targetAllocation,
    })),
  };
}

