'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Calculator, Loader2 } from 'lucide-react';
import { Liability } from '@/lib/types';
import { CategoryInfo } from '@/lib/categories';
import { calculateSpitzerPayment } from '@/lib/loanCalculations';
import { cn } from '@/lib/utils';
import CategorySelect from '@/components/ui/CategorySelect';
import AddCategoryModal from '@/components/ui/AddCategoryModal';

// Field order for auto-scroll
const FIELD_ORDER = ['name', 'type', 'loanMethod', 'totalAmount', 'interestRate', 'loanTermMonths', 'startDate', 'monthlyPayment', 'hasInterestRebate'];

interface LiabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (liability: Omit<Liability, 'id' | 'createdAt' | 'updatedAt'>) => void | Promise<void>;
  liability?: Liability | null;
  liabilityTypes: { default: CategoryInfo[]; custom: CategoryInfo[] };
  onAddCategory: (name: string) => Promise<CategoryInfo>;
}

export default function LiabilityModal({
  isOpen,
  onClose,
  onSave,
  liability,
  liabilityTypes,
  onAddCategory,
}: LiabilityModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState('loan');
  const [totalAmount, setTotalAmount] = useState('');
  const [monthlyPayment, setMonthlyPayment] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [loanTermMonths, setLoanTermMonths] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [loanMethod, setLoanMethod] = useState<'spitzer' | 'equal_principal'>('spitzer');
  const [hasInterestRebate, setHasInterestRebate] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Refs for auto-scroll to next field
  const fieldRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const modalBodyRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (liability) {
      setName(liability.name);
      setType(liability.type);
      setTotalAmount(liability.totalAmount.toString());
      setMonthlyPayment(liability.monthlyPayment.toString());
      setInterestRate((liability.interestRate || 0).toString());
      setLoanTermMonths((liability.loanTermMonths || 0).toString());
      setStartDate(liability.startDate ? new Date(liability.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
      setLoanMethod(liability.loanMethod || 'spitzer');
      setHasInterestRebate(liability.hasInterestRebate || false);
    } else {
      setName('');
      setType('loan');
      setTotalAmount('');
      setMonthlyPayment('');
      setInterestRate('');
      setLoanTermMonths('');
      setStartDate(new Date().toISOString().split('T')[0]);
      setLoanMethod('spitzer');
      setHasInterestRebate(false);
    }
  }, [liability, isOpen]);

  // Calculate monthly payment when loan details change
  const calculatePayment = () => {
    const amount = parseFloat(totalAmount);
    const rate = parseFloat(interestRate);
    const term = parseInt(loanTermMonths);
    
    if (amount > 0 && rate >= 0 && term > 0) {
      const payment = calculateSpitzerPayment(amount, rate, term);
      setMonthlyPayment(Math.round(payment).toString());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSave({
        name,
        type,
        totalAmount: parseFloat(totalAmount),
        monthlyPayment: parseFloat(monthlyPayment),
        interestRate: parseFloat(interestRate) || 0,
        loanTermMonths: parseInt(loanTermMonths) || 0,
        startDate: startDate,
        loanMethod,
        hasInterestRebate,
      });
      onClose();
    } catch (error) {
      // Error handling is done in the parent component
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCategory = async (categoryName: string) => {
    const newCategory = await onAddCategory(categoryName);
    setType(newCategory.id);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={() => !isLoading && onClose()}>
        <div className="modal-content max-w-lg animate-scale-in" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="modal-header">
            <h2 
              className="text-xl font-bold"
              style={{ 
                color: '#303150', 
                fontFamily: 'var(--font-nunito), system-ui, sans-serif' 
              }}
            >
              {liability ? 'עריכת התחייבות' : 'התחייבות חדשה'}
            </h2>
            <button onClick={onClose} className="btn-icon" disabled={isLoading}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="modal-body space-y-4" ref={modalBodyRef}>
              {/* Name */}
              <div ref={(el) => { if (el) fieldRefs.current.set('name', el); }}>
                <label className="label">שם ההתחייבות</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => { if (name) scrollToNextField('name'); }}
                  placeholder="לדוגמה: משכנתא לדירה"
                  className="input"
                  required
                />
              </div>

              {/* Type */}
              <div ref={(el) => { if (el) fieldRefs.current.set('type', el); }}>
                <label className="label">סוג התחייבות</label>
                <CategorySelect
                  value={type}
                  onChange={(val) => {
                    setType(val);
                    if (val) scrollToNextField('type');
                  }}
                  defaultCategories={liabilityTypes.default}
                  customCategories={liabilityTypes.custom}
                  placeholder="בחר סוג התחייבות"
                  onAddNew={() => setShowAddCategory(true)}
                  required
                />
              </div>

              {/* Loan Method */}
              <div ref={(el) => { if (el) fieldRefs.current.set('loanMethod', el); }}>
                <label className="label">שיטת ההלוואה</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setLoanMethod('spitzer');
                      scrollToNextField('loanMethod');
                    }}
                    className="py-2.5 px-4 rounded-xl text-sm font-medium transition-all"
                    style={{
                      backgroundColor: loanMethod === 'spitzer' ? '#69ADFF' : '#F7F7F8',
                      color: loanMethod === 'spitzer' ? '#FFFFFF' : '#7E7F90',
                      fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                    }}
                  >
                    שפיצר
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoanMethod('equal_principal');
                      scrollToNextField('loanMethod');
                    }}
                    className="py-2.5 px-4 rounded-xl text-sm font-medium transition-all"
                    style={{
                      backgroundColor: loanMethod === 'equal_principal' ? '#69ADFF' : '#F7F7F8',
                      color: loanMethod === 'equal_principal' ? '#FFFFFF' : '#7E7F90',
                      fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                    }}
                  >
                    קרן שווה
                  </button>
                </div>
              </div>

              {/* Total Amount + Interest Rate */}
              <div className="grid grid-cols-2 gap-3">
                <div ref={(el) => { if (el) fieldRefs.current.set('totalAmount', el); }}>
                  <label className="label">סכום הלוואה (₪)</label>
                  <input
                    type="number"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    onBlur={() => { if (totalAmount) scrollToNextField('totalAmount'); }}
                    placeholder="0"
                    className="input"
                    required
                    min="0"
                    step="1"
                  />
                </div>
                <div ref={(el) => { if (el) fieldRefs.current.set('interestRate', el); }}>
                  <label className="label">ריבית שנתית (%)</label>
                  <input
                    type="number"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    onBlur={() => { if (interestRate) scrollToNextField('interestRate'); }}
                    placeholder="0"
                    className="input"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Term + Start Date */}
              <div className="grid grid-cols-2 gap-3">
                <div ref={(el) => { if (el) fieldRefs.current.set('loanTermMonths', el); }}>
                  <label className="label">תקופה (חודשים)</label>
                  <input
                    type="number"
                    value={loanTermMonths}
                    onChange={(e) => setLoanTermMonths(e.target.value)}
                    onBlur={() => { if (loanTermMonths) scrollToNextField('loanTermMonths'); }}
                    placeholder="0"
                    className="input"
                    min="1"
                    step="1"
                  />
                </div>
                <div ref={(el) => { if (el) fieldRefs.current.set('startDate', el); }}>
                  <label className="label">תאריך התחלה</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (e.target.value) scrollToNextField('startDate');
                    }}
                    className="input"
                  />
                </div>
              </div>

              {/* Calculate Payment Button */}
              <div ref={(el) => { if (el) fieldRefs.current.set('monthlyPayment', el); }} className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="label">תשלום חודשי (₪)</label>
                  <input
                    type="number"
                    value={monthlyPayment}
                    onChange={(e) => setMonthlyPayment(e.target.value)}
                    onBlur={() => { if (monthlyPayment) scrollToNextField('monthlyPayment'); }}
                    placeholder="0"
                    className="input"
                    required
                    min="0"
                    step="1"
                  />
                </div>
                <button
                  type="button"
                  onClick={calculatePayment}
                  className="btn-secondary h-[46px]"
                  title="חשב תשלום לפי פרטי ההלוואה"
                >
                  <Calculator className="w-4 h-4" />
                  חשב
                </button>
              </div>

              {/* Interest Rebate */}
              <div 
                ref={(el) => { if (el) fieldRefs.current.set('hasInterestRebate', el); }}
                className="rounded-xl p-4"
                style={{ 
                  backgroundColor: 'rgba(13, 186, 204, 0.08)',
                  border: '1px solid rgba(13, 186, 204, 0.15)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p 
                      className="font-medium"
                      style={{ 
                        color: '#303150',
                        fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                      }}
                    >
                      זיכוי על הריבית
                    </p>
                    <p 
                      className="text-sm mt-0.5"
                      style={{ 
                        color: '#7E7F90',
                        fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                      }}
                    >
                      אם פעיל, רק הקרן נחשבת כהוצאה (לדוגמה: משכנתא עם החזר מס)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHasInterestRebate(!hasInterestRebate)}
                    className={cn(
                      'toggle',
                      hasInterestRebate ? 'toggle-checked' : 'toggle-unchecked'
                    )}
                  >
                    <span
                      className={cn(
                        'toggle-thumb',
                        hasInterestRebate ? 'toggle-thumb-checked' : 'toggle-thumb-unchecked'
                      )}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer">
              <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={isLoading}>
                ביטול
              </button>
              <button type="submit" className="btn-primary flex-1" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  liability ? 'עדכן' : 'הוסף'
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
        categoryType="liability"
      />
    </>
  );
}
