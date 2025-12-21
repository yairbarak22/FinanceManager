'use client';

import { useState } from 'react';
import { Trash2, Receipt, Plus, Upload } from 'lucide-react';
import { Transaction } from '@/lib/types';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { getCategoryInfo } from '@/lib/categories';
import ConfirmDialog from './modals/ConfirmDialog';

interface RecentTransactionsProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onNewTransaction: () => void;
  onImport: () => void;
}

export default function RecentTransactions({ transactions, onDelete, onNewTransaction, onImport }: RecentTransactionsProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; description: string }>({
    isOpen: false,
    id: '',
    description: '',
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
            <Receipt className="w-4 h-4 text-gray-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">הוצאות שוטפות</h3>
            <p className="text-xs text-gray-500">{transactions.length} עסקאות</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onImport}
            className="text-sm text-gray-600 hover:text-gray-700 font-medium flex items-center gap-1"
          >
            <Upload className="w-4 h-4" />
            ייבוא
          </button>
          <button
            onClick={onNewTransaction}
            className="text-sm text-pink-600 hover:text-pink-700 font-medium flex items-center gap-1 mr-2"
          >
            <Plus className="w-4 h-4" />
            הוסף
          </button>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-2">
        {transactions.map((transaction) => {
          const categoryInfo = getCategoryInfo(
            transaction.category,
            transaction.type as 'income' | 'expense'
          );
          const Icon = categoryInfo?.icon;
          const isIncome = transaction.type === 'income';

          return (
            <div
              key={transaction.id}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
            >
              {/* Category Icon */}
              <div
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                  categoryInfo?.bgColor || 'bg-gray-100'
                )}
              >
                {Icon && (
                  <Icon
                    className={cn('w-5 h-5', categoryInfo?.textColor || 'text-gray-600')}
                  />
                )}
              </div>

              {/* Transaction Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900 text-sm truncate">
                    {categoryInfo?.nameHe || transaction.category}
                  </p>
                  <span className="text-xs text-gray-400">
                    {formatDate(transaction.date)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 truncate">{transaction.description}</p>
              </div>

              {/* Amount */}
              <p
                className={cn(
                  'text-sm font-bold flex-shrink-0',
                  isIncome ? 'text-green-600' : 'text-pink-600'
                )}
              >
                {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
              </p>

              {/* Delete Button */}
              <button
                onClick={() => setDeleteConfirm({ isOpen: true, id: transaction.id, description: transaction.description })}
                className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {transactions.length === 0 && (
        <div className="text-center py-12">
          <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">אין עסקאות להצגה</p>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: '', description: '' })}
        onConfirm={() => onDelete(deleteConfirm.id)}
        title="מחיקת עסקה"
        message={`האם אתה בטוח שברצונך למחוק את העסקה "${deleteConfirm.description}"?`}
      />
    </div>
  );
}
