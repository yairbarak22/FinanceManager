'use client';

import CfoBadgeDropdown from './CfoBadgeDropdown';
import type { FinanceRecordType } from '@/types/admin-cfo';
import {
  FinanceRecordType as TypeEnum,
  FINANCE_RECORD_TYPE_COLORS,
  FINANCE_RECORD_TYPE_LABELS,
} from '@/types/admin-cfo';

const ALL_TYPES = Object.values(TypeEnum) as FinanceRecordType[];

interface TypeBadgeProps {
  type: FinanceRecordType;
  onChange?: (type: FinanceRecordType) => void;
}

export default function TypeBadge({ type, onChange }: TypeBadgeProps) {
  return (
    <CfoBadgeDropdown
      value={type}
      options={ALL_TYPES}
      colors={FINANCE_RECORD_TYPE_COLORS}
      labels={FINANCE_RECORD_TYPE_LABELS}
      onChange={onChange}
    />
  );
}
