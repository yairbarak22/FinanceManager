'use client';

import CfoBadgeDropdown from './CfoBadgeDropdown';
import type { BillingCycle } from '@/types/admin-cfo';
import {
  BillingCycle as CycleEnum,
  BILLING_CYCLE_LABELS,
} from '@/types/admin-cfo';

const ALL_CYCLES = Object.values(CycleEnum) as BillingCycle[];

const BILLING_CYCLE_COLORS: Record<BillingCycle, string> = {
  MONTHLY: '#7E7F90',
  YEARLY: '#4F46E5',
};

interface BillingCycleBadgeProps {
  cycle: BillingCycle;
  onChange?: (cycle: BillingCycle) => void;
}

export default function BillingCycleBadge({ cycle, onChange }: BillingCycleBadgeProps) {
  return (
    <CfoBadgeDropdown
      value={cycle}
      options={ALL_CYCLES}
      colors={BILLING_CYCLE_COLORS}
      labels={BILLING_CYCLE_LABELS}
      onChange={onChange}
    />
  );
}
