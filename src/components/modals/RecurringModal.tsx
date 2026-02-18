'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Check } from 'lucide-react';
import { RecurringTransaction } from '@/lib/types';
import { CategoryInfo } from '@/lib/categories';
import { useMonth } from '@/context/MonthContext';
import CategorySelect from '@/components/ui/CategorySelect';
import AddCategoryModal from '@/components/ui/AddCategoryModal';

// Field order for auto-scroll
const FIELD_ORDER = ['type', 'name', 'amount', 'category', 'activeMonths'];

const MONTH_NAMES: { [key: string]: string } = {
  '01': 'ינואר', '02': 'פברואר', '03': 'מרץ', '04': 'אפריל',
  '05': 'מאי', '06': 'יוני', '07': 'יולי', '08': 'אוגוסט',
  '09': 'ספטמבר', '10': 'אוקטובר', '11': 'נובמבר', '12': 'דצמבר',
};

const SHORT_MONTH_NAMES: { [key: string]: string } = {
  '01': 'ינו\'', '02': 'פבר\'', '03': 'מרץ', '04': 'אפר\'',
  '05': 'מאי', '06': 'יוני', '07': 'יולי', '08': 'אוג\'',
  '09': 'ספט\'', '10': 'אוק\'', '11': 'נוב\'', '12': 'דצמ\'',
};

function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  return `${MONTH_NAMES[month]} ${year}`;
}

function formatShortMonthChip(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  return `${SHORT_MONTH_NAMES[month]} ${year.slice(2)}`;
}

interface RecurringModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<RecurringTransaction, 'id' | 'createdAt' | 'updatedAt'>) => void | Promise<void>;
  transaction?: RecurringTransaction | null;
  expenseCategories: { default: CategoryInfo[]; custom: CategoryInfo[] };
  incomeCategories: { default: CategoryInfo[]; custom: CategoryInfo[] };
  onAddCategory: (name: string, type: 'expense' | 'income') => Promise<CategoryInfo>;
}

export default function RecurringModal({
  isOpen,
  onClose,
  onSave,
  transaction,
  expenseCategories,
  incomeCategories,
  onAddCategory,
}: RecurringModalProps) {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [name, setName] = useState('');
  const [allMonthsActive, setAllMonthsActive] = useState(true);
  const [selectedMonths, setSelectedMonths] = useState<Set<string>>(new Set());
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { allMonths, currentMonth } = useMonth();

  // Group months for the picker
  const { pastMonths, futureMonths } = useMemo(() => {
    const past = allMonths.filter(m => m < currentMonth);
    const future = allMonths.filter(m => m > currentMonth);
    return { pastMonths: past, futureMonths: future };
  }, [allMonths, currentMonth]);

  // Refs for auto-scroll to next field
  const fieldRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const modalBodyRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to next field when current field is filled
  const scrollToNextField = useCallback((currentField: string) => {
    const currentIndex = FIELD_ORDER.indexOf(currentField);
    if (currentIndex >= 0 && currentIndex < FIELD_ORDER.length - 1) {
      const nextField = FIELD_ORDER[currentIndex + 1];
      const nextFieldElement = fieldRefs.current.get(nextField);
      if (nextFieldElement && modalBodyRef.current) {
        setTimeout(() => {
          nextFieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    }
  }, []);

  // Set mounted state for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (transaction) {
      setType(transaction.type as 'income' | 'expense');
      setAmount(transaction.amount.toString());
      setCategory(transaction.category);
      setName(transaction.name);
      if (transaction.activeMonths && transaction.activeMonths.length > 0) {
        setAllMonthsActive(false);
        setSelectedMonths(new Set(transaction.activeMonths));
      } else {
        setAllMonthsActive(true);
        setSelectedMonths(new Set());
      }
    } else {
      setType('expense');
      setAmount('');
      setCategory('');
      setName('');
      setAllMonthsActive(true);
      setSelectedMonths(new Set());
    }
  }, [transaction, isOpen]);

  const currentCategories = type === 'income' ? incomeCategories : expenseCategories;

  const toggleMonth = useCallback((monthKey: string) => {
    setSelectedMonths(prev => {
      const next = new Set(prev);
      if (next.has(monthKey)) {
        next.delete(monthKey);
      } else {
        next.add(monthKey);
      }
      return next;
    });
    // Auto-scroll to footer after selecting a month
    setTimeout(() => {
      footerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSave({
        type,
        amount: parseFloat(amount),
        category,
        name,
        isActive: true,
        activeMonths: allMonthsActive ? null : Array.from(selectedMonths).sort(),
      });
      onClose();
    } catch (error) {
      // Error handling is done in the parent component
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCategory = async (categoryName: string) => {
    const newCategory = await onAddCategory(categoryName, type);
    setCategory(newCategory.id);
  };

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <>
      <div
        className="modal-overlay"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 9999
        }}
        onClick={() => !isLoading && onClose()}
      >
        <div className="modal-content animate-scale-in" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="modal-header">
            <h2 
              className="text-xl font-bold"
              style={{ 
                color: '#303150', 
                fontFamily: 'var(--font-nunito), system-ui, sans-serif' 
              }}
            >
              {transaction ? 'עריכת עסקה קבועה' : 'עסקה קבועה חדשה'}
            </h2>
            <button onClick={onClose} className="btn-icon" disabled={isLoading}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="modal-body" ref={modalBodyRef}>
              {/* Type Toggle */}
              <div ref={(el) => { if (el) fieldRefs.current.set('type', el); }}>
                <label className="label">סוג עסקה</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setType('expense');
                      setCategory('');
                      scrollToNextField('type');
                    }}
                    className="py-3 px-4 rounded-xl font-medium transition-all"
                    style={{
                      backgroundColor: type === 'expense' ? '#F18AB5' : '#F7F7F8',
                      color: type === 'expense' ? '#FFFFFF' : '#7E7F90',
                      fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                    }}
                  >
                    הוצאה
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setType('income');
                      setCategory('');
                      scrollToNextField('type');
                    }}
                    className="py-3 px-4 rounded-xl font-medium transition-all"
                    style={{
                      backgroundColor: type === 'income' ? '#0DBACC' : '#F7F7F8',
                      color: type === 'income' ? '#FFFFFF' : '#7E7F90',
                      fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                    }}
                  >
                    הכנסה
                  </button>
                </div>
              </div>

              {/* Name */}
              <div ref={(el) => { if (el) fieldRefs.current.set('name', el); }}>
                <label className="label">שם העסקה</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => { if (name) scrollToNextField('name'); }}
                  placeholder="לדוגמה: משכורת יאיר"
                  className="input"
                  required
                />
              </div>

              {/* Amount */}
              <div ref={(el) => { if (el) fieldRefs.current.set('amount', el); }}>
                <label className="label">סכום (₪)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  onBlur={() => { if (amount) scrollToNextField('amount'); }}
                  placeholder="0"
                  className="input"
                  required
                  min="0"
                  step="0.01"
                />
              </div>

              {/* Category */}
              <div ref={(el) => { if (el) fieldRefs.current.set('category', el); }}>
                <label className="label">קטגוריה</label>
                <CategorySelect
                  value={category}
                  onChange={(val) => {
                    setCategory(val);
                    if (val) scrollToNextField('category');
                  }}
                  defaultCategories={type === 'income' ? incomeCategories.default : expenseCategories.default}
                  customCategories={type === 'income' ? incomeCategories.custom : expenseCategories.custom}
                  placeholder="בחר קטגוריה"
                  onAddNew={() => setShowAddCategory(true)}
                  required
                />
              </div>

              {/* Active Months Selection */}
              <div ref={(el) => { if (el) fieldRefs.current.set('activeMonths', el); }}>
                <div className="flex items-center justify-between mb-2">
                  <label className="label mb-0">חודשים פעילים</label>
                  <button
                    type="button"
                    onClick={() => {
                      const newVal = !allMonthsActive;
                      setAllMonthsActive(newVal);
                      if (newVal) {
                        setSelectedMonths(new Set());
                      } else {
                        setTimeout(() => {
                          footerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        }, 100);
                      }
                    }}
                    className={`toggle ${allMonthsActive ? 'toggle-checked' : 'toggle-unchecked'}`}
                  >
                    <span
                      className={`toggle-thumb ${allMonthsActive ? 'toggle-thumb-checked' : 'toggle-thumb-unchecked'}`}
                    />
                  </button>
                </div>
                <p className="text-xs mb-2" style={{ color: '#7E7F90' }}>
                  {allMonthsActive ? 'פעיל בכל החודשים' : `${selectedMonths.size} חודשים נבחרו`}
                </p>

                {!allMonthsActive && (
                  <div className="grid grid-cols-4 gap-1.5">
                    {allMonths.map(m => {
                      const isSelected = selectedMonths.has(m);
                      const isCurrent = m === currentMonth;
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => toggleMonth(m)}
                          className="relative px-1 py-1.5 rounded-lg text-xs font-medium transition-all text-center"
                          style={{
                            backgroundColor: isSelected ? '#69ADFF' : '#F7F7F8',
                            color: isSelected ? '#FFFFFF' : '#303150',
                            border: isCurrent && !isSelected ? '1.5px solid #69ADFF' : '1.5px solid transparent',
                            fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                          }}
                        >
                          {formatShortMonthChip(m)}
                          {isSelected && (
                            <Check
                              className="absolute top-0.5 left-0.5 w-2.5 h-2.5 text-white"
                              strokeWidth={3}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer" ref={footerRef}>
              <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={isLoading}>
                ביטול
              </button>
              <button type="submit" className="btn-primary flex-1" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  transaction ? 'עדכן' : 'הוסף'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Add Category Modal */}
      <AddCategoryModal
        isOpen={showAddCategory}
        onClose={() => setShowAddCategory(false)}
        onSave={handleAddCategory}
        categoryType={type}
      />
    </>
  );

  // Render modal via portal to document.body
  return createPortal(modalContent, document.body);
}
