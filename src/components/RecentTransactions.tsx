'use client';

import { Trash2, Receipt } from 'lucide-react';
import { Transaction } from '@/lib/types';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { getCategoryInfo } from '@/lib/categories';

interface RecentTransactionsProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
}

export default function RecentTransactions({ transactions, onDelete }: RecentTransactionsProps) {
  return (
    <div className="card p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
          <Receipt className="w-5 h-5 text-gray-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">עסקאות אחרונות</h2>
          <p className="text-sm text-gray-500">{transactions.length} עסקאות</p>
        </div>
      </div>

      {/* Transactions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {transactions.slice(0, 12).map((transaction) => {
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
                onClick={() => onDelete(transaction.id)}
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

      {transactions.length > 12 && (
        <div className="text-center mt-4">
          <p className="text-sm text-gray-500">
            מציג 12 מתוך {transactions.length} עסקאות
          </p>
        </div>
      )}
    </div>
  );
}
