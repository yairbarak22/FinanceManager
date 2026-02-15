'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { CategoryInfo } from '@/lib/categories';
import CategorySelect from '@/components/ui/CategorySelect';
import AddCategoryModal from '@/components/ui/AddCategoryModal';

// Field order for auto-scroll
const FIELD_ORDER = ['name', 'type', 'totalAmount', 'monthlyPayment', 'interestRate', 'startDate'];

interface LiabilityQuickFormProps {
  liabilityCategories: { default: CategoryInfo[]; custom: CategoryInfo[] };
  onSave: (data: {
    name: string;
    type: string;
    totalAmount: number;
    monthlyPayment: number;
    interestRate?: number;
    startDate: string;
  }) => Promise<void>;
  onAddCategory: (name: string) => Promise<CategoryInfo>;
}

export default function LiabilityQuickForm({
  liabilityCategories,
  onSave,
  onAddCategory,
}: LiabilityQuickFormProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [monthlyPayment, setMonthlyPayment] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);
  
  // Refs for auto-scroll to next field
  const fieldRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Auto-scroll to next field when current field is filled
  const scrollToNextField = useCallback((currentField: string) => {
    const currentIndex = FIELD_ORDER.indexOf(currentField);
    if (currentIndex >= 0 && currentIndex < FIELD_ORDER.length - 1) {
      const nextField = FIELD_ORDER[currentIndex + 1];
      const nextFieldElement = fieldRefs.current.get(nextField);
      if (nextFieldElement) {
        setTimeout(() => {
          nextFieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    }
  }, []);

  // Auto-focus name input on mount
  useEffect(() => {
    setTimeout(() => {
      nameInputRef.current?.focus();
    }, 100);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !type || !totalAmount || !monthlyPayment) return;

    setIsLoading(true);
    try {
      await onSave({
        name,
        type,
        totalAmount: parseFloat(totalAmount),
        monthlyPayment: parseFloat(monthlyPayment),
        interestRate: interestRate ? parseFloat(interestRate) : undefined,
        startDate,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCategory = async (categoryName: string) => {
    const newCategory = await onAddCategory(categoryName);
    setType(newCategory.id);
    setShowAddCategory(false);
  };

  const handleTypeChange = (value: string) => {
    setType(value);
    scrollToNextField('type');
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div ref={(el) => { if (el) fieldRefs.current.set('name', el); }}>
          <label
            htmlFor="liability-name"
            className="block text-sm font-medium mb-1.5"
            style={{ color: '#7E7F90', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
          >
            שם ההתחייבות
          </label>
          <input
            ref={nameInputRef}
            id="liability-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => { if (name) scrollToNextField('name'); }}
            placeholder="לדוגמה: משכנתא בנק לאומי"
            className="input"
            required
            aria-required="true"
          />
        </div>

        {/* Type */}
        <div ref={(el) => { if (el) fieldRefs.current.set('type', el); }}>
          <label
            className="block text-sm font-medium mb-1.5"
            style={{ color: '#7E7F90', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
          >
            סוג התחייבות
          </label>
          <CategorySelect
            value={type}
            onChange={handleTypeChange}
            defaultCategories={liabilityCategories.default}
            customCategories={liabilityCategories.custom}
            placeholder="בחר סוג"
            required
          />
        </div>

        {/* Total Amount */}
        <div ref={(el) => { if (el) fieldRefs.current.set('totalAmount', el); }}>
          <label
            htmlFor="liability-total"
            className="block text-sm font-medium mb-1.5"
            style={{ color: '#7E7F90', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
          >
            סכום כולל (₪)
          </label>
          <input
            id="liability-total"
            type="number"
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
            onBlur={() => { if (totalAmount) scrollToNextField('totalAmount'); }}
            placeholder="0"
            className="input"
            required
            min="0"
            step="0.01"
            aria-required="true"
          />
        </div>

        {/* Monthly Payment */}
        <div ref={(el) => { if (el) fieldRefs.current.set('monthlyPayment', el); }}>
          <label
            htmlFor="liability-monthly"
            className="block text-sm font-medium mb-1.5"
            style={{ color: '#7E7F90', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
          >
            תשלום חודשי (₪)
          </label>
          <input
            id="liability-monthly"
            type="number"
            value={monthlyPayment}
            onChange={(e) => setMonthlyPayment(e.target.value)}
            onBlur={() => { if (monthlyPayment) scrollToNextField('monthlyPayment'); }}
            placeholder="0"
            className="input"
            required
            min="0"
            step="0.01"
            aria-required="true"
          />
        </div>

        {/* Interest Rate - Optional */}
        <div ref={(el) => { if (el) fieldRefs.current.set('interestRate', el); }}>
          <label
            htmlFor="liability-interest"
            className="block text-sm font-medium mb-1.5"
            style={{ color: '#7E7F90', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
          >
            ריבית שנתית (%)
          </label>
          <input
            id="liability-interest"
            type="number"
            value={interestRate}
            onChange={(e) => setInterestRate(e.target.value)}
            onBlur={() => { if (interestRate) scrollToNextField('interestRate'); }}
            placeholder="0"
            className="input"
            min="0"
            max="100"
            step="0.01"
          />
        </div>

        {/* Start Date */}
        <div ref={(el) => { if (el) fieldRefs.current.set('startDate', el); }}>
          <label
            htmlFor="liability-start"
            className="block text-sm font-medium mb-1.5"
            style={{ color: '#7E7F90', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
          >
            תאריך התחלה
          </label>
          <input
            id="liability-start"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="input"
            required
            aria-required="true"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !name || !type || !totalAmount || !monthlyPayment}
          className="btn-primary w-full py-3 text-base"
          style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin mx-auto" />
          ) : (
            'שמור'
          )}
        </button>
      </form>

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
