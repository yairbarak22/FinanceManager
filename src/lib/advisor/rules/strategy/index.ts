/**
 * Strategy Rules - אסטרטגיות מאקרו להקצאת הון
 */

// === Original Strategy Rules ===
export { default as firstHomePurchaseRule } from './firstHomePurchase';
export { default as investExcessCashRule } from './investExcessCash';
export { default as payOffDebtRule } from './payOffDebt';

// === Category A: Real Estate (נדל"ן) ===
export { default as firstHomeLotteryRule } from './firstHomeLottery';
export { default as swapHomeTaxWindowRule } from './swapHomeTaxWindow';
export { default as peripheryGrantRule } from './peripheryGrant';
export { default as leveragedRealEstateRule } from './leveragedRealEstate';
export { default as taxOptimizationMultiHomeRule } from './taxOptimizationMultiHome';

// === Category B: Capital Markets & Pension (שוק ההון ופנסיה) ===
export { default as maxKerenHishtalmutStrategyRule } from './maxKerenHishtalmutStrategy';
export { default as tikun190Rule } from './tikun190';
export { default as pensionMatchRule } from './pensionMatch';
export { default as taxLossHarvestingRule } from './taxLossHarvesting';
export { default as cashYieldOptimizationRule } from './cashYieldOptimization';
export { default as idleCashOptimizationRule } from './idleCashOptimization';

// === Category C: Credit & Tax (אשראי ומס) ===
export { default as hishtalmutLoanRule } from './hishtalmutLoan';
export { default as selfEmployedExpensesRule } from './selfEmployedExpenses';
export { default as donationTaxCreditRule } from './donationTaxCredit';
