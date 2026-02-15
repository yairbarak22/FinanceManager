'use client';

import { useState } from 'react';
import { Plus, Trash2, Banknote, Home, TrendingDown, Table, FolderOpen } from 'lucide-react';
import { Liability } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';
import { getCategoryInfo } from '@/lib/categories';
import { getEffectiveMonthlyExpense, getCurrentMonthPayment, getRemainingBalance } from '@/lib/loanCalculations';
import ConfirmDialog from './modals/ConfirmDialog';
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

  return (
    <div className="h-full flex flex-col">
      {/* Header - Fixed */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(241, 138, 181, 0.1)' }}
          >
            <TrendingDown className="w-5 h-5" style={{ color: '#F18AB5' }} strokeWidth={1.5} />
          </div>
          <div>
            <h3 
              className="font-semibold"
              style={{ 
                fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                color: '#303150'
              }}
            >
              התחייבויות
            </h3>
            <SensitiveData 
              as="p" 
              className="text-xs font-medium"
              style={{ color: '#F18AB5' }}
            >
              {formatCurrency(totalLiabilities)}
            </SensitiveData>
          </div>
        </div>
        <button 
          id="btn-add-liability" 
          onClick={onAdd} 
          className="text-sm font-medium flex items-center gap-1 hover:opacity-80 transition-opacity"
          style={{ color: '#69ADFF' }}
        >
          <Plus className="w-4 h-4" strokeWidth={1.5} />
          הוסף
        </button>
      </div>

      {/* Monthly Payment Info - Fixed */}
      <div 
        className="bg-white rounded-xl p-3 mb-4 flex-shrink-0"
        style={{ 
          border: '1px solid #F7F7F8',
          boxShadow: '0 2px 8px rgba(241, 138, 181, 0.08)'
        }}
      >
        <div className="flex items-center justify-between">
          <span 
            className="text-xs"
            style={{ color: '#7E7F90' }}
          >
            תשלום חודשי כולל
          </span>
          <SensitiveData 
            className="text-sm font-semibold"
            style={{ 
              fontFamily: 'var(--font-nunito), system-ui, sans-serif',
              color: '#F18AB5'
            }}
          >
            {formatCurrency(monthlyPayments)}
          </SensitiveData>
        </div>
      </div>

      {/* Liabilities List - Scrollable */}
      <div className="overflow-y-scroll flex-1 min-h-0 scrollbar-liabilities scrollbar-edge-left scrollbar-fade-bottom">
        {liabilities.map((liability, index) => {
          const categoryInfo = getCategoryInfo(liability.type, 'liability');
          const Icon = categoryInfo?.icon || (liability.type === 'mortgage' ? Home : Banknote);
          const hasLoanDetails = liability.interestRate > 0 && liability.loanTermMonths > 0;
          const currentPayment = getCurrentMonthPayment(liability);
          const effectiveExpense = getEffectiveMonthlyExpense(liability);

          return (
            <div
              key={liability.id}
              onClick={() => onEdit(liability)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onEdit(liability);
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={`ערוך התחייבות: ${liability.name}`}
              className={cn(
                "group relative p-3 bg-white transition-all duration-200 hover:bg-[#F7F7F8] hover:shadow-sm cursor-pointer active:scale-[0.98]",
                index < liabilities.length - 1 && "border-b"
              )}
              style={{ borderColor: '#F7F7F8' }}
            >
              {/* Edge Indicator */}
              <div className="absolute right-0 top-2 bottom-2 w-0.5 bg-[#69ADFF] opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />

              {/* Row 1: Icon + Name + Details */}
              <div className="flex items-start gap-3 mb-2">
                {/* Icon */}
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(241, 138, 181, 0.1)' }}
                >
                  <Icon className="w-4 h-4" style={{ color: '#F18AB5' }} strokeWidth={1.5} />
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
                    {liability.name}
                  </SensitiveData>
                  <SensitiveData 
                    as="p" 
                    className="text-xs mt-0.5"
                    style={{ color: '#7E7F90' }}
                  >
                    {categoryInfo?.nameHe} • {formatCurrency(liability.monthlyPayment)}/חודש
                    {liability.hasInterestRebate && (
                      <span style={{ color: '#0DBACC' }}> • זיכוי ריבית</span>
                    )}
                  </SensitiveData>
                  {hasLoanDetails && currentPayment && (
                    <SensitiveData 
                      as="p" 
                      className="text-xs mt-0.5"
                      style={{ color: '#7E7F90' }}
                    >
                      חודש {currentPayment.currentMonth}/{liability.loanTermMonths}
                      {liability.hasInterestRebate && (
                        <span style={{ color: '#0DBACC' }}> • חיוב: {formatCurrency(effectiveExpense)}</span>
                      )}
                    </SensitiveData>
                  )}
                </div>
              </div>

              {/* Row 2: Value + Actions */}
              <div className="flex items-center justify-between mr-12">
                {/* Value - Remaining Balance as of selected month */}
                <SensitiveData 
                  as="p" 
                  className="text-sm font-semibold"
                  style={{ 
                    fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                    color: '#F18AB5'
                  }}
                >
                  {formatCurrency(getRemainingBalance(liability, selectedMonthDate))}
                </SensitiveData>

                {/* Actions */}
                <div className="flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDocuments(liability);
                    }}
                    className="p-1.5 rounded hover:bg-[#F7F7F8] transition-colors"
                    style={{ color: '#7E7F90' }}
                    title="מסמכים"
                    aria-label={`צפייה במסמכים של ${liability.name}`}
                  >
                    <FolderOpen className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </button>
                  {hasLoanDetails && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewAmortization(liability);
                      }}
                      className="p-1.5 rounded hover:bg-[#F7F7F8] transition-colors"
                      style={{ color: '#7E7F90' }}
                      title="לוח סילוקין"
                      aria-label={`צפייה בלוח סילוקין של ${liability.name}`}
                    >
                      <Table className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirm({ isOpen: true, id: liability.id, name: liability.name });
                    }}
                    className="p-1.5 rounded hover:bg-red-50 transition-colors"
                    style={{ color: '#7E7F90' }}
                    aria-label={`מחיקת ${liability.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        
        {liabilities.length === 0 && (
          <p 
            className="text-center text-sm py-4"
            style={{ color: '#7E7F90' }}
          >
            אין התחייבויות
          </p>
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
