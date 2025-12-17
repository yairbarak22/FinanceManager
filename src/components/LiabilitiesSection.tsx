'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, Banknote, Home, TrendingDown, Table, FolderOpen } from 'lucide-react';
import { Liability } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';
import { getCategoryInfo } from '@/lib/categories';
import { getEffectiveMonthlyExpense, getCurrentMonthPayment } from '@/lib/loanCalculations';
import ConfirmDialog from './modals/ConfirmDialog';

interface LiabilitiesSectionProps {
  liabilities: Liability[];
  onAdd: () => void;
  onEdit: (liability: Liability) => void;
  onDelete: (id: string) => void;
  onViewAmortization: (liability: Liability) => void;
  onViewDocuments: (liability: Liability) => void;
}

export default function LiabilitiesSection({ 
  liabilities, 
  onAdd, 
  onEdit, 
  onDelete,
  onViewAmortization,
  onViewDocuments 
}: LiabilitiesSectionProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; name: string }>({
    isOpen: false,
    id: '',
    name: '',
  });
  const totalLiabilities = liabilities.reduce((sum, l) => sum + l.totalAmount, 0);
  const monthlyPayments = liabilities.reduce((sum, l) => sum + l.monthlyPayment, 0);

  return (
    <div data-tour="liabilities-section">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
            <TrendingDown className="w-4 h-4 text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">התחייבויות</h3>
            <p className="text-xs text-red-600 font-medium">{formatCurrency(totalLiabilities)}</p>
          </div>
        </div>
        <button onClick={onAdd} className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1">
          <Plus className="w-4 h-4" />
          הוסף
        </button>
      </div>

      {/* Monthly Payment Info */}
      <div className="bg-orange-50 rounded-lg p-3 border border-orange-100 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">תשלום חודשי כולל</span>
          <span className="text-sm font-bold text-orange-600">{formatCurrency(monthlyPayments)}</span>
        </div>
      </div>

      {/* Liabilities List */}
      <div className="space-y-2">
        {liabilities.map((liability) => {
          const categoryInfo = getCategoryInfo(liability.type, 'liability');
          const Icon = liability.type === 'mortgage' ? Home : Banknote;
          const hasLoanDetails = liability.interestRate > 0 && liability.loanTermMonths > 0;
          const currentPayment = getCurrentMonthPayment(liability);
          const effectiveExpense = getEffectiveMonthlyExpense(liability);

          return (
            <div
              key={liability.id}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
            >
              {/* Icon */}
              <div
                className={cn(
                  'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                  categoryInfo?.bgColor || 'bg-gray-100'
                )}
              >
                <Icon className={cn('w-4 h-4', categoryInfo?.textColor || 'text-gray-600')} />
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">{liability.name}</p>
                <p className="text-xs text-gray-500">
                  {categoryInfo?.nameHe} • {formatCurrency(liability.monthlyPayment)}/חודש
                  {liability.hasInterestRebate && (
                    <span className="text-green-600"> • זיכוי ריבית</span>
                  )}
                </p>
                {hasLoanDetails && currentPayment && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    חודש {currentPayment.currentMonth}/{liability.loanTermMonths}
                    {liability.hasInterestRebate && (
                      <span className="text-green-600"> • חיוב בפועל: {formatCurrency(effectiveExpense)}</span>
                    )}
                  </p>
                )}
              </div>

              {/* Value */}
              <p className="text-sm font-bold text-red-600 flex-shrink-0">{formatCurrency(liability.totalAmount)}</p>

              {/* Actions */}
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => onViewDocuments(liability)}
                  className="p-1.5 rounded hover:bg-violet-100 text-gray-400 hover:text-violet-600"
                  title="מסמכים"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                </button>
                {hasLoanDetails && (
                  <button
                    onClick={() => onViewAmortization(liability)}
                    className="p-1.5 rounded hover:bg-blue-100 text-gray-400 hover:text-blue-600"
                    title="לוח סילוקין"
                  >
                    <Table className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => onEdit(liability)}
                  className="p-1.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeleteConfirm({ isOpen: true, id: liability.id, name: liability.name })}
                  className="p-1.5 rounded hover:bg-red-100 text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
        
        {liabilities.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-4">אין התחייבויות</p>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: '', name: '' })}
        onConfirm={() => onDelete(deleteConfirm.id)}
        title="מחיקת התחייבות"
        message={`האם אתה בטוח שברצונך למחוק את "${deleteConfirm.name}"?`}
      />
    </div>
  );
}
