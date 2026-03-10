'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, Trash2, RefreshCw, TrendingUp, TrendingDown, CalendarDays, ArrowUpDown } from 'lucide-react';
import { RecurringTransaction } from '@/lib/types';
import { formatCurrency, formatCurrencyAmount, cn, isRecurringActiveInMonth } from '@/lib/utils';
import { useMonth } from '@/context/MonthContext';
import { getCategoryInfo, CategoryInfo } from '@/lib/categories';
import ConfirmDialog from './modals/ConfirmDialog';
import { SensitiveData } from './common/SensitiveData';

type SortOption = 'date' | 'category' | 'amount';

const SORT_LABELS: Record<SortOption, string> = {
  date: 'לפי תאריך',
  category: 'לפי קטגוריה',
  amount: 'לפי סכום',
};

function formatActiveMonthsBadge(activeMonths: string[] | null | undefined): string {
  if (!activeMonths || activeMonths.length === 0) return '';
  if (activeMonths.length === 1) {
    const [, m] = activeMonths[0].split('-');
    const monthNames: Record<string, string> = {
      '01': 'ינו\'', '02': 'פבר\'', '03': 'מרץ', '04': 'אפר\'',
      '05': 'מאי', '06': 'יוני', '07': 'יולי', '08': 'אוג\'',
      '09': 'ספט\'', '10': 'אוק\'', '11': 'נוב\'', '12': 'דצמ\'',
    };
    return monthNames[m] || activeMonths[0];
  }
  return `${activeMonths.length} חודשים`;
}

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
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const sortButtonRef = useRef<HTMLButtonElement>(null);

  const { currentMonth } = useMonth();

  useEffect(() => {
    if (!isSortOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        sortDropdownRef.current && !sortDropdownRef.current.contains(target) &&
        sortButtonRef.current && !sortButtonRef.current.contains(target)
      ) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSortOpen]);

  const sortedTransactions = useMemo(() => {
    const sorted = [...transactions];

    switch (sortBy) {
      case 'date':
        return sorted.sort((a, b) =>
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        );

      case 'category':
        return sorted.sort((a, b) => {
          const aCats = a.type === 'income' ? customIncomeCategories : customExpenseCategories;
          const bCats = b.type === 'income' ? customIncomeCategories : customExpenseCategories;
          const aName = getCategoryInfo(a.category, a.type as 'income' | 'expense', aCats)?.nameHe || '';
          const bName = getCategoryInfo(b.category, b.type as 'income' | 'expense', bCats)?.nameHe || '';
          const cmp = aName.localeCompare(bName, 'he');
          return cmp !== 0 ? cmp : a.name.localeCompare(b.name, 'he');
        });

      case 'amount':
        return sorted.sort((a, b) => b.amount - a.amount);

      default:
        return sorted;
    }
  }, [transactions, sortBy, customExpenseCategories, customIncomeCategories]);

  const fixedIncome = transactions
    .filter((t) => t.type === 'income' && isRecurringActiveInMonth(t, currentMonth))
    .reduce((sum, t) => sum + t.amount, 0);

  const fixedExpenses = transactions
    .filter((t) => t.type === 'expense' && isRecurringActiveInMonth(t, currentMonth))
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
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              ref={sortButtonRef}
              onClick={() => setIsSortOpen(prev => !prev)}
              className="p-2 rounded-xl transition-all"
              style={{
                border: isSortOpen ? '1px solid #69ADFF' : '1px solid #E8E8ED',
                backgroundColor: '#FFFFFF',
              }}
              aria-label="מיון עסקאות"
            >
              <ArrowUpDown className="w-4 h-4" style={{ color: '#7E7F90' }} />
            </button>

            {isSortOpen && (
              <div
                ref={sortDropdownRef}
                className="absolute left-0 top-full mt-2 rounded-xl bg-white border border-[#E8E8ED] shadow-lg z-50"
                style={{ minWidth: '160px' }}
              >
                {(['date', 'category', 'amount'] as SortOption[]).map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setSortBy(option);
                      setIsSortOpen(false);
                    }}
                    className="w-full px-4 py-2.5 text-right text-sm hover:bg-[#F7F7F8] transition-colors first:rounded-t-xl last:rounded-b-xl"
                    style={{
                      color: sortBy === option ? '#69ADFF' : '#303150',
                      fontWeight: sortBy === option ? 600 : 400,
                    }}
                  >
                    {SORT_LABELS[option]}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button 
            id="btn-add-recurring" 
            onClick={onAdd} 
            className="text-sm font-medium flex items-center gap-1 hover:opacity-80 transition-opacity"
            style={{ color: '#69ADFF' }}
          >
            הוסף
            <Plus className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
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
        {sortedTransactions.map((transaction, index) => {
          const customCategories = transaction.type === 'income'
            ? customIncomeCategories
            : customExpenseCategories;
          const categoryInfo = getCategoryInfo(
            transaction.category,
            transaction.type as 'income' | 'expense',
            customCategories
          );
          const isIncome = transaction.type === 'income';
          const activeInCurrentMonth = isRecurringActiveInMonth(transaction, currentMonth);
          const hasLimitedMonths = transaction.activeMonths && transaction.activeMonths.length > 0;
          const iconColor = isIncome ? '#0DBACC' : '#F18AB5';
          const iconBg = isIncome ? 'rgba(13, 186, 204, 0.1)' : 'rgba(241, 138, 181, 0.1)';

          return (
            <div
              key={transaction.id}
              onClick={() => onEdit(transaction)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onEdit(transaction);
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={`ערוך עסקה קבועה: ${transaction.name}`}
              className={cn(
                'group relative p-3 bg-white transition-all duration-200 hover:bg-[#F7F7F8] hover:shadow-sm cursor-pointer active:scale-[0.98]',
                index < sortedTransactions.length - 1 && 'border-b',
                !activeInCurrentMonth && 'opacity-50'
              )}
              style={{ borderColor: '#F7F7F8' }}
            >
              {/* Edge Indicator */}
              <div className="absolute right-0 top-2 bottom-2 w-0.5 bg-[#69ADFF] opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />

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
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <SensitiveData 
                      as="p" 
                      className="text-xs"
                      style={{ color: '#7E7F90' }}
                    >
                      {categoryInfo?.nameHe}
                    </SensitiveData>
                    {hasLimitedMonths && (
                      <span
                        className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full"
                        style={{
                          color: activeInCurrentMonth ? '#69ADFF' : '#7E7F90',
                          backgroundColor: activeInCurrentMonth ? 'rgba(105, 173, 255, 0.1)' : '#F7F7F8',
                        }}
                      >
                        <CalendarDays className="w-2.5 h-2.5" strokeWidth={1.5} />
                        {formatActiveMonthsBadge(transaction.activeMonths)}
                      </span>
                    )}
                  </div>
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
                  {`${isIncome ? '+' : '-'}${formatCurrencyAmount(transaction.amount, transaction.currency || 'ILS')}`}
                </SensitiveData>

                {/* Actions */}
                <div className="flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirm({ isOpen: true, id: transaction.id, name: transaction.name });
                    }}
                    className="p-1.5 rounded hover:bg-red-50 transition-colors"
                    style={{ color: '#7E7F90' }}
                    aria-label={`מחיקת ${transaction.name}`}
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
