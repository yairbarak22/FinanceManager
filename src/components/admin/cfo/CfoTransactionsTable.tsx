'use client';

import type { RefObject } from 'react';
import type { AdminTransaction } from '@/types/admin-cfo';
import TransactionRow from './TransactionRow';
import AddTransactionRow, { type AddTransactionRowHandle } from './AddTransactionRow';

interface CfoTransactionsTableProps {
  transactions: AdminTransaction[];
  onUpdate?: (id: string, updates: Record<string, unknown>) => Promise<void>;
  onCreate?: (title: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  addRowRef?: RefObject<AddTransactionRowHandle | null>;
  selectedMonth?: string | null; // "YYYY-MM" | null
}

const GRID_COLS = 'grid grid-cols-[minmax(180px,_1fr)_120px_120px_140px_140px_140px_100px_40px]';

const COLUMN_HEADERS = [
  'תיאור',
  'סוג',
  'סכום',
  'קטגוריה',
  'תאריך',
  'סטטוס',
  'קבלה',
  '',
];

export default function CfoTransactionsTable({
  transactions,
  onUpdate,
  onCreate,
  onDelete,
  addRowRef,
  selectedMonth,
}: CfoTransactionsTableProps) {
  const monthSuffix = selectedMonth
    ? (() => {
        const [y, m] = selectedMonth.split('-').map(Number);
        return ' — ' + new Date(y, m - 1, 1).toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });
      })()
    : '';

  return (
    <div>
      <h2 className="text-base font-bold text-[#303150] mb-3">
        ספר קופה (תנועות חד-פעמיות){monthSuffix}
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
        {transactions.length === 0 && !onCreate ? (
          <div className="px-4 py-8 text-center text-sm text-[#7E7F90]">
            אין תנועות להצגה
          </div>
        ) : (
          <>
            {transactions.map((txn) => (
              <TransactionRow
                key={txn.id}
                transaction={txn}
                gridCols={GRID_COLS}
                onUpdate={onUpdate}
                onDelete={onDelete}
              />
            ))}
            {onCreate && (
              <AddTransactionRow
                ref={addRowRef}
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
