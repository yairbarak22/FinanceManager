'use client';

import type { AdminSubscription } from '@/types/admin-cfo';
import SubscriptionRow from './SubscriptionRow';
import AddSubscriptionRow from './AddSubscriptionRow';

interface CfoSubscriptionsTableProps {
  subscriptions: AdminSubscription[];
  onUpdate?: (id: string, updates: Record<string, unknown>) => Promise<void>;
  onCreate?: (title: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

const GRID_COLS = 'grid grid-cols-[minmax(180px,_1fr)_120px_120px_140px_120px_140px_140px_40px]';

const COLUMN_HEADERS = [
  'שם השירות',
  'סוג',
  'סכום',
  'קטגוריה',
  'מחזור חיוב',
  'תאריך חיוב קרוב',
  'סטטוס',
  '',
];

export default function CfoSubscriptionsTable({
  subscriptions,
  onUpdate,
  onCreate,
  onDelete,
}: CfoSubscriptionsTableProps) {
  return (
    <div>
      <h2 className="text-base font-bold text-[#303150] mb-3">
        מנויים והוצאות קבועות
      </h2>

      <div className="border border-[#E8E8ED] rounded-xl overflow-hidden">
        {/* Header */}
        <div className={`${GRID_COLS} bg-[#FAFAFA] border-b border-[#E8E8ED]`}>
          {COLUMN_HEADERS.map((header, i) => (
            <div
              key={`${header}-${i}`}
              className="px-4 py-3 text-xs font-semibold text-[#7E7F90] flex items-center"
            >
              {header}
            </div>
          ))}
        </div>

        {/* Rows */}
        {subscriptions.length === 0 && !onCreate ? (
          <div className="px-4 py-8 text-center text-sm text-[#7E7F90]">
            אין מנויים להצגה
          </div>
        ) : (
          <>
            {subscriptions.map((sub) => (
              <SubscriptionRow
                key={sub.id}
                subscription={sub}
                gridCols={GRID_COLS}
                onUpdate={onUpdate}
                onDelete={onDelete}
              />
            ))}
            {onCreate && (
              <AddSubscriptionRow
                gridCols={GRID_COLS}
                onCreate={onCreate}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
