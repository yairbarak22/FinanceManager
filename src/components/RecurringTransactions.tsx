'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { RecurringTransaction } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';
import { getCategoryInfo, CategoryInfo } from '@/lib/categories';
import ConfirmDialog from './modals/ConfirmDialog';
import { SensitiveData } from './common/SensitiveData';

interface RecurringTransactionsProps {
  transactions: RecurringTransaction[];
  onAdd: () => void;
  onEdit: (transaction: RecurringTransaction) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, isActive: boolean) => void;
  customExpenseCategories?: CategoryInfo[];
  customIncomeCategories?: CategoryInfo[];
}

export default function RecurringTransactions({
  transactions,
  onAdd,
  onEdit,
  onDelete,
  onToggle,
  customExpenseCategories = [],
  customIncomeCategories = [],
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
    <div className="h-full flex flex-col">
      {/* Header - Fixed */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(105, 173, 255, 0.1)' }}
          >
            <RefreshCw className="w-5 h-5" style={{ color: '#69ADFF' }} strokeWidth={1.5} />
          </div>
          <h3 
            className="font-semibold"
            style={{ 
              fontFamily: 'var(--font-nunito), system-ui, sans-serif',
              color: '#303150'
            }}
          >
            עסקאות קבועות
          </h3>
        </div>
        <button 
          id="btn-add-recurring" 
          onClick={onAdd} 
          className="text-sm font-medium flex items-center gap-1 hover:opacity-80 transition-opacity"
          style={{ color: '#69ADFF' }}
        >
          <Plus className="w-4 h-4" strokeWidth={1.5} />
          הוסף
        </button>
      </div>

      {/* Summary - Fixed */}
      <div className="grid grid-cols-2 gap-3 mb-4 flex-shrink-0">
        <div 
          className="bg-white rounded-xl p-3"
          style={{ 
            border: '1px solid #F7F7F8',
            boxShadow: '0 2px 8px rgba(13, 186, 204, 0.08)'
          }}
        >
          <p 
            className="text-xs"
            style={{ color: '#7E7F90' }}
          >
            הכנסות
          </p>
          <SensitiveData 
            as="p" 
            className="text-base font-semibold"
            style={{ 
              fontFamily: 'var(--font-nunito), system-ui, sans-serif',
              color: '#0DBACC'
            }}
          >
            {formatCurrency(fixedIncome)}
          </SensitiveData>
        </div>
        <div 
          className="bg-white rounded-xl p-3"
          style={{ 
            border: '1px solid #F7F7F8',
            boxShadow: '0 2px 8px rgba(241, 138, 181, 0.08)'
          }}
        >
          <p 
            className="text-xs"
            style={{ color: '#7E7F90' }}
          >
            הוצאות
          </p>
          <SensitiveData 
            as="p" 
            className="text-base font-semibold"
            style={{ 
              fontFamily: 'var(--font-nunito), system-ui, sans-serif',
              color: '#F18AB5'
            }}
          >
            {formatCurrency(fixedExpenses)}
          </SensitiveData>
        </div>
      </div>

      {/* Transactions List - Scrollable */}
      <div className="overflow-y-scroll flex-1 min-h-0 scrollbar-transactions scrollbar-edge-left scrollbar-fade-bottom">
        {transactions.map((transaction, index) => {
          const customCategories = transaction.type === 'income'
            ? customIncomeCategories
            : customExpenseCategories;
          const categoryInfo = getCategoryInfo(
            transaction.category,
            transaction.type as 'income' | 'expense',
            customCategories
          );
          const isIncome = transaction.type === 'income';
          const iconColor = isIncome ? '#0DBACC' : '#F18AB5';
          const iconBg = isIncome ? 'rgba(13, 186, 204, 0.1)' : 'rgba(241, 138, 181, 0.1)';

          return (
            <div
              key={transaction.id}
              className={cn(
                'p-3 bg-white',
                index < transactions.length - 1 && 'border-b'
              )}
              style={{ borderColor: '#F7F7F8' }}
            >
              {/* Row 1: Icon + Name + Category */}
              <div className="flex items-start gap-3 mb-2">
                {/* Icon */}
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: iconBg }}
                >
                  {isIncome ? (
                    <TrendingUp className="w-4 h-4" style={{ color: iconColor }} strokeWidth={1.5} />
                  ) : (
                    <TrendingDown className="w-4 h-4" style={{ color: iconColor }} strokeWidth={1.5} />
                  )}
                </div>

                {/* Details - full width, allow wrapping */}
                <div className="flex-1">
                  <SensitiveData 
                    as="p" 
                    className="font-medium text-sm leading-tight"
                    style={{ 
                      fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                      color: '#303150'
                    }}
                  >
                    {transaction.name}
                  </SensitiveData>
                  <SensitiveData 
                    as="p" 
                    className="text-xs mt-0.5"
                    style={{ color: '#7E7F90' }}
                  >
                    {categoryInfo?.nameHe}
                  </SensitiveData>
                </div>
              </div>

              {/* Row 2: Value + Actions */}
              <div className="flex items-center justify-between mr-12">
                {/* Amount */}
                <SensitiveData
                  as="p"
                  className="text-sm font-semibold"
                  style={{ 
                    fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                    color: isIncome ? '#0DBACC' : '#F18AB5'
                  }}
                  dir="ltr"
                >
                  {`${isIncome ? '+' : '-'}${formatCurrency(transaction.amount)}`}
                </SensitiveData>

                {/* Actions */}
                <div className="flex gap-1">
                  <button
                    onClick={() => onEdit(transaction)}
                    className="p-1.5 rounded hover:bg-slate-100 transition-colors"
                    style={{ color: '#7E7F90' }}
                  >
                    <Pencil className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm({ isOpen: true, id: transaction.id, name: transaction.name })}
                    className="p-1.5 rounded hover:bg-red-50 transition-colors"
                    style={{ color: '#7E7F90' }}
                  >
                    <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {transactions.length === 0 && (
          <p 
            className="text-center text-sm py-4"
            style={{ color: '#7E7F90' }}
          >
            אין עסקאות קבועות
          </p>
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
    </div>
  );
}
