// ---------------------------------------------------------------------------
// Tip Catalog – Type Definitions
// ---------------------------------------------------------------------------

import type { TipEvaluationData } from '../types';

/** Financial domains that tips are organized by. */
export type TipDomain =
  | 'cash_flow'
  | 'emergency_fund'
  | 'debt'
  | 'savings'
  | 'investments'
  | 'maaser'
  | 'budget_compliance'
  | 'net_worth'
  | 'lifestyle'
  | 'retirement';

/** The emotional tone / urgency bucket of a tip. */
export type TipTone = 'positive' | 'urgent' | 'recommendation';

/**
 * A single tip definition in the catalog.
 *
 * Follows the same condition/generator pattern as the existing
 * `FinancialRule` in `src/lib/insights/types.ts`, extended with
 * domain, tone, and exclusion-group support.
 *
 * IMPORTANT – both `condition` and `generateTip` MUST be pure,
 * synchronous functions with no DB/API calls.  All data they need
 * is pre-loaded in `TipEvaluationData`.
 */
export interface TipDefinition {
  /** Unique ID, e.g. 'cf.negative_cashflow' */
  id: string;

  /** Which financial domain this tip belongs to. */
  domain: TipDomain;

  /** 0-10 priority (higher = shown first within same tone). */
  priority: number;

  /** Which bucket this tip falls into. */
  tone: TipTone;

  /**
   * Optional mutual-exclusion group.
   * Only the highest-priority passing tip within a group is selected.
   * E.g. group 'ef.level' prevents showing both "no emergency fund"
   * and "emergency fund low" simultaneously.
   */
  exclusionGroup?: string;

  /** Does this tip apply to the user right now? */
  condition: (data: TipEvaluationData) => boolean;

  /** Generate the Hebrew tip text (called only when condition() is true). */
  generateTip: (data: TipEvaluationData) => {
    /** The Hebrew tip text. */
    text: string;
    /** Optional: how many score points this issue costs. */
    scoreImpact?: number;
  };
}
