'use client';

import CfoBadgeDropdown from './CfoBadgeDropdown';
import type { TransactionStatus } from '@/types/admin-cfo';
import {
  TransactionStatus as StatusEnum,
  TRANSACTION_STATUS_COLORS,
  TRANSACTION_STATUS_LABELS,
} from '@/types/admin-cfo';

const ALL_STATUSES = Object.values(StatusEnum) as TransactionStatus[];

interface TransactionStatusBadgeProps {
  status: TransactionStatus;
  onChange?: (status: TransactionStatus) => void;
}

export default function TransactionStatusBadge({ status, onChange }: TransactionStatusBadgeProps) {
  return (
    <CfoBadgeDropdown
      value={status}
      options={ALL_STATUSES}
      colors={TRANSACTION_STATUS_COLORS}
      labels={TRANSACTION_STATUS_LABELS}
      onChange={onChange}
    />
  );
}
