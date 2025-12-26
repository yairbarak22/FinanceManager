'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { RecurringTransaction } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';
import { getCategoryInfo } from '@/lib/categories';
import ConfirmDialog from './modals/ConfirmDialog';
import Card from './ui/Card';
interface RecurringTransactionsProps {
  transactions: RecurringTransaction[];
  onAdd: () => void;
  onEdit: (transaction: RecurringTransaction) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, isActive: boolean) => void;
}

export default function RecurringTransactions({
  transactions,
  onAdd,
  onEdit,
  onDelete,
  onToggle,
}: RecurringTransactionsProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; name: string }>({
    isOpen: false,
    id: '',
    name: '',
  });

  const fixedIncome = transactions
    .filter((t) => t.type === 'income' && t.isActive)
    .reduce((sum, t) => sum + t.amount, 0);

  const fixedExpenses = transactions
    .filter((t) => t.type === 'expense' && t.isActive)
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <Card padding="sm" className="h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-indigo-600" />
          </div>
          <h3 className="font-semibold text-slate-900">עסקאות קבועות</h3>
        </div>
        <button onClick={onAdd} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
          <Plus className="w-4 h-4" />
          הוסף
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
          <p className="text-xs text-slate-500">הכנסות</p>
          <p className="text-base font-bold text-emerald-600">{formatCurrency(fixedIncome)}</p>
        </div>
        <div className="bg-rose-50 rounded-xl p-3 border border-rose-100">
          <p className="text-xs text-slate-500">הוצאות</p>
          <p className="text-base font-bold text-rose-600">{formatCurrency(fixedExpenses)}</p>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-2">
        {transactions.map((transaction) => {
          const categoryInfo = getCategoryInfo(
            transaction.category,
            transaction.type as 'income' | 'expense'
          );

          return (
            <div
              key={transaction.id}
              className={cn(
                'flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 rounded-lg transition-all',
                transaction.isActive ? 'bg-slate-50' : 'bg-slate-50/50 opacity-60'
              )}
            >
              {/* Top row: Icon + Details + Amount (mobile) */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Icon */}
                <div
                  className={cn(
                    'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                    categoryInfo?.bgColor || 'bg-slate-100'
                  )}
                >
                  {transaction.type === 'income' ? (
                    <TrendingUp className={cn('w-4 h-4', categoryInfo?.textColor || 'text-slate-600')} />
                  ) : (
                    <TrendingDown className={cn('w-4 h-4', categoryInfo?.textColor || 'text-slate-600')} />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 text-sm truncate">{transaction.name}</p>
                  <p className="text-xs text-slate-500 truncate">{categoryInfo?.nameHe}</p>
                </div>

                {/* Amount - visible on mobile */}
                <p
                  className={cn(
                    'text-sm font-bold flex-shrink-0 sm:hidden',
                    transaction.type === 'income' ? 'text-green-600' : 'text-rose-600'
                  )}
                >
                  {transaction.type === 'income' ? '+' : '-'}
                  {formatCurrency(transaction.amount)}
                </p>
              </div>

              {/* Bottom row (mobile) / Continue (desktop): Amount + Toggle + Actions */}
              <div className="flex items-center gap-2 justify-end mr-12 sm:mr-0">
                {/* Amount - visible on desktop */}
                <p
                  className={cn(
                    'hidden sm:block text-sm font-bold flex-shrink-0',
                    transaction.type === 'income' ? 'text-green-600' : 'text-rose-600'
                  )}
                >
                  {transaction.type === 'income' ? '+' : '-'}
                  {formatCurrency(transaction.amount)}
                </p>

                {/* Toggle */}
                <button
                  onClick={() => onToggle(transaction.id, !transaction.isActive)}
                  className={cn(
                    'toggle flex-shrink-0',
                    transaction.isActive ? 'toggle-checked' : 'toggle-unchecked'
                  )}
                >
                  <span
                    className={cn(
                      'toggle-thumb',
                      transaction.isActive ? 'toggle-thumb-checked' : 'toggle-thumb-unchecked'
                    )}
                  />
                </button>

                {/* Actions - Always visible like Assets */}
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => onEdit(transaction)}
                    className="p-1.5 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-600"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm({ isOpen: true, id: transaction.id, name: transaction.name })}
                    className="p-1.5 rounded hover:bg-red-100 text-slate-500 hover:text-red-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {transactions.length === 0 && (
          <p className="text-center text-slate-500 text-sm py-4">אין עסקאות קבועות</p>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: '', name: '' })}
        onConfirm={() => onDelete(deleteConfirm.id)}
        title="מחיקת עסקה קבועה"
        message={`האם אתה בטוח שברצונך למחוק את "${deleteConfirm.name}"?`}
      />
    </Card>
  );
}
