// ---------------------------------------------------------------------------
// Tip Registry – imports all domain files and exports a flat array.
//
// To add a new domain: create the file in domains/, import it here,
// and spread it into allTips.
// ---------------------------------------------------------------------------

import type { TipDefinition } from './types';

import { cashFlowTips } from './domains/cashFlow';
import { emergencyFundTips } from './domains/emergencyFund';
import { debtTips } from './domains/debt';
import { savingsTips } from './domains/savings';
import { investmentsTips } from './domains/investments';
import { maaserTips } from './domains/maaser';
import { budgetComplianceTips } from './domains/budgetCompliance';
import { netWorthTips } from './domains/netWorth';
import { lifestyleTips } from './domains/lifestyle';
import { retirementTips } from './domains/retirement';

export const allTips: TipDefinition[] = [
  ...cashFlowTips,
  ...emergencyFundTips,
  ...debtTips,
  ...savingsTips,
  ...investmentsTips,
  ...maaserTips,
  ...budgetComplianceTips,
  ...netWorthTips,
  ...lifestyleTips,
  ...retirementTips,
];
