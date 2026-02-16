'use client';

import { useState, useCallback } from 'react';
import { Plus, Trash2, Banknote, Home, TrendingDown, Table, FolderOpen } from 'lucide-react';
import { Liability } from '@/lib/types';
import { formatCurrency, cn, apiFetch } from '@/lib/utils';
import { getCategoryInfo } from '@/lib/categories';
import { getEffectiveMonthlyExpense, getCurrentMonthPayment, getRemainingBalance } from '@/lib/loanCalculations';
import ConfirmDialog from './modals/ConfirmDialog';
import { SensitiveData } from './common/SensitiveData';

/* ── Micro Toggle Switch (14×26 px) ─────────────────────── */
function CashFlowToggle({
  isActive,
  isSaving,
  onToggle,
  liabilityName,
}: {
  isActive: boolean;
  isSaving: boolean;
  onToggle: () => void;
  liabilityName: string;
}) {
  return (
    <button
      type="button"
      dir="ltr"
      role="switch"
      aria-checked={isActive}
      aria-label={isActive ? `הסר מהתזרים: ${liabilityName}` : `הכלל בתזרים: ${liabilityName}`}
      title={isActive ? 'בתזרים — לחצ/י להסרה' : 'לא בתזרים — לחצ/י להכללה'}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onToggle();
      }}
      className={cn(
        'relative inline-flex h-[14px] w-[26px] flex-shrink-0 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-offset-1',
        isActive
          ? 'bg-emerald-400 focus-visible:ring-emerald-300'
          : 'bg-gray-300 focus-visible:ring-gray-300',
        isSaving && 'opacity-50 pointer-events-none'
      )}
    >
      <span
        className={cn(
          'inline-block h-[10px] w-[10px] rounded-full bg-white shadow-sm transition-transform duration-200',
          isActive ? 'translate-x-[14px]' : 'translate-x-[2px]'
        )}
      />
    </button>
  );
}

interface LiabilitiesSectionProps {
  liabilities: Liability[];
  onAdd: () => void;
  onEdit: (liability: Liability) => void;
  onDelete: (id: string) => void;
  onViewAmortization: (liability: Liability) => void;
  onViewDocuments: (liability: Liability) => void;
  onToggleCashFlow?: (id: string, isActive: boolean) => void;
  selectedMonth?: string; // Format: 'YYYY-MM' or 'all'
}

export default function LiabilitiesSection({ 
  liabilities, 
  onAdd, 
  onEdit, 
  onDelete,
  onViewAmortization,
  onViewDocuments,
  onToggleCashFlow,
  selectedMonth = 'all'
}: LiabilitiesSectionProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; name: string }>({
    isOpen: false,
    id: '',
    name: '',
  });

  // Track which liabilities are currently saving their toggle state
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());

  const handleToggleCashFlow = useCallback(async (liability: Liability) => {
    const currentState = liability.isActiveInCashFlow !== false;
    const newState = !currentState;

    // Optimistic update — notify parent immediately
    if (onToggleCashFlow) {
      onToggleCashFlow(liability.id, newState);
    }

    setSavingIds((prev) => new Set(prev).add(liability.id));
    try {
      const res = await apiFetch(`/api/liabilities/${liability.id}/toggle-cashflow`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActiveInCashFlow: newState }),
      });
      if (!res.ok) {
        // Revert on failure
        if (onToggleCashFlow) {
          onToggleCashFlow(liability.id, currentState);
        }
      }
    } catch {
      // Revert on network error
      if (onToggleCashFlow) {
        onToggleCashFlow(liability.id, currentState);
      }
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(liability.id);
        return next;
      });
    }
  }, [onToggleCashFlow]);
  
  // Calculate remaining balance as of selected month (or current date if 'all')
  const selectedMonthDate = selectedMonth === 'all' 
    ? new Date() 
    : new Date(selectedMonth + '-01');
  const totalLiabilities = liabilities.reduce((sum, l) => sum + getRemainingBalance(l, selectedMonthDate), 0);

  // Monthly payments — split by active in cash flow
  const activeMonthlyPayments = liabilities
    .filter((l) => l.isActiveInCashFlow !== false)
    .reduce((sum, l) => sum + l.monthlyPayment, 0);
  const totalMonthlyPayments = liabilities.reduce((sum, l) => sum + l.monthlyPayment, 0);
  const hasInactive = activeMonthlyPayments !== totalMonthlyPayments;

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
            תשלום חודשי בתזרים
          </span>
          <SensitiveData 
            className="text-sm font-semibold"
            style={{ 
              fontFamily: 'var(--font-nunito), system-ui, sans-serif',
              color: '#F18AB5'
            }}
          >
            {formatCurrency(activeMonthlyPayments)}
          </SensitiveData>
        </div>
        {hasInactive && (
          <div className="flex items-center justify-between mt-1.5 pt-1.5" style={{ borderTop: '1px solid #F7F7F8' }}>
            <span 
              className="text-xs"
              style={{ color: '#B0B1BC' }}
            >
              כלל התשלומים
            </span>
            <SensitiveData 
              className="text-xs font-medium"
              style={{ 
                fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                color: '#B0B1BC'
              }}
            >
              {formatCurrency(totalMonthlyPayments)}
            </SensitiveData>
          </div>
        )}
      </div>

      {/* Liabilities List - Scrollable */}
      <div className="overflow-y-scroll flex-1 min-h-0 scrollbar-liabilities scrollbar-edge-left scrollbar-fade-bottom">
        {liabilities.map((liability, index) => {
          const categoryInfo = getCategoryInfo(liability.type, 'liability');
          const Icon = categoryInfo?.icon || (liability.type === 'mortgage' ? Home : Banknote);
          const hasLoanDetails = liability.interestRate > 0 && liability.loanTermMonths > 0;
          const currentPayment = getCurrentMonthPayment(liability);
          const effectiveExpense = getEffectiveMonthlyExpense(liability);
          const isActiveInCashFlow = liability.isActiveInCashFlow !== false;
          const isSaving = savingIds.has(liability.id);

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
                index < liabilities.length - 1 && "border-b",
                !isActiveInCashFlow && "opacity-50"
              )}
              style={{ borderColor: '#F7F7F8' }}
            >
              {/* Edge Indicator */}
              <div className="absolute right-0 top-2 bottom-2 w-0.5 bg-[#69ADFF] opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />

              {/* Cash Flow Toggle — top-left corner, above action buttons */}
              {onToggleCashFlow && (
                <div className="absolute left-3 top-2.5 z-10">
                  <CashFlowToggle
                    isActive={isActiveInCashFlow}
                    isSaving={isSaving}
                    onToggle={() => handleToggleCashFlow(liability)}
                    liabilityName={liability.name}
                  />
                </div>
              )}

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
                  <div className="flex items-center gap-2">
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
                    {!isActiveInCashFlow && (
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md flex-shrink-0"
                        style={{
                          background: 'rgba(126,127,144,0.08)',
                          color: '#7E7F90',
                        }}
                      >
                        לא בתזרים
                      </span>
                    )}
                  </div>
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
