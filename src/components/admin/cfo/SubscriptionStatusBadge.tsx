'use client';

import CfoBadgeDropdown from './CfoBadgeDropdown';
import type { SubscriptionStatus } from '@/types/admin-cfo';
import {
  SubscriptionStatus as StatusEnum,
  SUBSCRIPTION_STATUS_COLORS,
  SUBSCRIPTION_STATUS_LABELS,
} from '@/types/admin-cfo';

const ALL_STATUSES = Object.values(StatusEnum) as SubscriptionStatus[];

interface SubscriptionStatusBadgeProps {
  status: SubscriptionStatus;
  onChange?: (status: SubscriptionStatus) => void;
}

export default function SubscriptionStatusBadge({ status, onChange }: SubscriptionStatusBadgeProps) {
  return (
    <CfoBadgeDropdown
      value={status}
      options={ALL_STATUSES}
      colors={SUBSCRIPTION_STATUS_COLORS}
      labels={SUBSCRIPTION_STATUS_LABELS}
      onChange={onChange}
    />
  );
}
