'use client';

import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Banknote, Home, TrendingDown, Table, FolderOpen } from 'lucide-react';
import { Liability } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';
import { getCategoryInfo } from '@/lib/categories';
import { getEffectiveMonthlyExpense, getCurrentMonthPayment, getRemainingBalance } from '@/lib/loanCalculations';
import ConfirmDialog from './modals/ConfirmDialog';
import HelpTrigger from './ai/HelpTrigger';
import { SensitiveData } from './common/SensitiveData';

interface LiabilitiesSectionProps {
  liabilities: Liability[];
  onAdd: () => void;
  onEdit: (liability: Liability) => void;
  onDelete: (id: string) => void;
  onViewAmortization: (liability: Liability) => void;
  onViewDocuments: (liability: Liability) => void;
  selectedMonth?: string; // Format: 'YYYY-MM' or 'all'
}

export default function LiabilitiesSection({ 
  liabilities, 
  onAdd, 
  onEdit, 
  onDelete,
  onViewAmortization,
  onViewDocuments,
  selectedMonth = 'all'
}: LiabilitiesSectionProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; name: string }>({
    isOpen: false,
    id: '',
    name: '',
  });
  
  // Calculate remaining balance as of selected month (or current date if 'all')
  const selectedMonthDate = selectedMonth === 'all' 
    ? new Date() 
    : new Date(selectedMonth + '-01');
  const totalLiabilities = liabilities.reduce((sum, l) => sum + getRemainingBalance(l, selectedMonthDate), 0);
  const monthlyPayments = liabilities.reduce((sum, l) => sum + l.monthlyPayment, 0);

  // Dynamic context data for AI Help
  const liabilitiesContextData = useMemo(() => ({
    סהכ_התחייבויות: liabilities.length,
    סכום_כולל: totalLiabilities,
    תשלום_חודשי: monthlyPayments,
    סוגים: [...new Set(liabilities.map(l => getCategoryInfo(l.type, 'liability')?.nameHe || l.type))].join(', '),
  }), [liabilities, totalLiabilities, monthlyPayments]);

  return (
    <div className="h-full flex flex-col">
      {/* Header - Fixed */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
            <TrendingDown className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">התחייבויות</h3>
            <SensitiveData as="p" className="text-xs text-rose-600 font-medium">
              {formatCurrency(totalLiabilities)}
            </SensitiveData>
          </div>
{/* FEATURE DISABLED - AI Help Button
          <HelpTrigger
            topicId="liabilities"
            contextData={liabilitiesContextData}
            size="sm"
          />
          */}
        </div>
        <button id="btn-add-liability" onClick={onAdd} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
          <Plus className="w-4 h-4" />
          הוסף
        </button>
      </div>

      {/* Monthly Payment Info - Fixed */}
      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 mb-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-600">תשלום חודשי כולל</span>
          <SensitiveData className="text-sm font-bold text-rose-600">
            {formatCurrency(monthlyPayments)}
          </SensitiveData>
        </div>
      </div>

      {/* Liabilities List - Scrollable */}
      <div className="space-y-2 overflow-y-auto flex-1 min-h-0">
        {liabilities.map((liability) => {
          const categoryInfo = getCategoryInfo(liability.type, 'liability');
          const Icon = liability.type === 'mortgage' ? Home : Banknote;
          const hasLoanDetails = liability.interestRate > 0 && liability.loanTermMonths > 0;
          const currentPayment = getCurrentMonthPayment(liability);
          const effectiveExpense = getEffectiveMonthlyExpense(liability);

          return (
            <div
              key={liability.id}
              className="p-3 bg-slate-50 rounded-lg"
            >
              {/* Row 1: Icon + Name + Details */}
              <div className="flex items-start gap-3 mb-2">
                {/* Icon */}
                <div
                  className={cn(
                    'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                    categoryInfo?.bgColor || 'bg-slate-100'
                  )}
                >
                  <Icon className={cn('w-4 h-4', categoryInfo?.textColor || 'text-slate-600')} />
                </div>

                {/* Details - full width, allow wrapping */}
                <div className="flex-1">
                  <SensitiveData as="p" className="font-medium text-slate-900 text-sm leading-tight">
                    {liability.name}
                  </SensitiveData>
                  <SensitiveData as="p" className="text-xs text-slate-500 mt-0.5">
                    {categoryInfo?.nameHe} • {formatCurrency(liability.monthlyPayment)}/חודש
                    {liability.hasInterestRebate && (
                      <span className="text-green-600"> • זיכוי ריבית</span>
                    )}
                  </SensitiveData>
                  {hasLoanDetails && currentPayment && (
                    <SensitiveData as="p" className="text-xs text-slate-500 mt-0.5">
                      חודש {currentPayment.currentMonth}/{liability.loanTermMonths}
                      {liability.hasInterestRebate && (
                        <span className="text-green-600"> • חיוב: {formatCurrency(effectiveExpense)}</span>
                      )}
                    </SensitiveData>
                  )}
                </div>
              </div>

              {/* Row 2: Value + Actions */}
              <div className="flex items-center justify-between mr-12">
                {/* Value - Remaining Balance as of selected month */}
                <SensitiveData as="p" className="text-sm font-bold text-red-600">
                  {formatCurrency(getRemainingBalance(liability, selectedMonthDate))}
                </SensitiveData>

                {/* Actions */}
                <div className="flex gap-1">
                  <button
                    onClick={() => onViewDocuments(liability)}
                    className="p-1.5 rounded hover:bg-indigo-100 text-slate-500 hover:text-indigo-600"
                    title="מסמכים"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                  </button>
                  {hasLoanDetails && (
                    <button
                      onClick={() => onViewAmortization(liability)}
                      className="p-1.5 rounded hover:bg-blue-100 text-slate-500 hover:text-blue-600"
                      title="לוח סילוקין"
                    >
                      <Table className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => onEdit(liability)}
                    className="p-1.5 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-600"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm({ isOpen: true, id: liability.id, name: liability.name })}
                    className="p-1.5 rounded hover:bg-red-100 text-slate-500 hover:text-red-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        
        {liabilities.length === 0 && (
          <p className="text-center text-slate-500 text-sm py-4">אין התחייבויות</p>
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
