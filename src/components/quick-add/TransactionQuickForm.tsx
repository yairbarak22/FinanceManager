'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { CategoryInfo } from '@/lib/categories';
import CategorySelect from '@/components/ui/CategorySelect';
import AddCategoryModal from '@/components/ui/AddCategoryModal';

// Field order for auto-scroll
const FIELD_ORDER = ['amount', 'type', 'category', 'description', 'date'];

interface TransactionQuickFormProps {
  expenseCategories: { default: CategoryInfo[]; custom: CategoryInfo[] };
  incomeCategories: { default: CategoryInfo[]; custom: CategoryInfo[] };
  onSave: (data: {
    type: 'income' | 'expense';
    amount: number;
    category: string;
    description: string;
    date: string;
  }) => Promise<void>;
  onAddCategory: (name: string, type: 'expense' | 'income') => Promise<CategoryInfo>;
}

export default function TransactionQuickForm({
  expenseCategories,
  incomeCategories,
  onSave,
  onAddCategory,
}: TransactionQuickFormProps) {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  
  const amountInputRef = useRef<HTMLInputElement>(null);
  
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

  // Auto-focus amount input on mount
  useEffect(() => {
    setTimeout(() => {
      amountInputRef.current?.focus();
    }, 100);
  }, []);

  const currentCategories = type === 'income' ? incomeCategories : expenseCategories;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category || !description) return;

    setIsLoading(true);
    try {
      await onSave({
        type,
        amount: parseFloat(amount),
        category,
        description,
        date,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCategory = async (name: string) => {
    const newCategory = await onAddCategory(name, type);
    setCategory(newCategory.id);
    setShowAddCategory(false);
  };

  const handleCategorySelect = (categoryId: string) => {
    setCategory(categoryId);
    if (categoryId) {
      scrollToNextField('category');
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Amount - Large centered input */}
        <div 
          className="text-center"
          ref={(el) => { if (el) fieldRefs.current.set('amount', el); }}
        >
          <label
            htmlFor="quick-amount"
            className="block text-sm font-medium mb-2"
            style={{ color: '#7E7F90', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
          >
            סכום
          </label>
          <div className="relative inline-flex items-center justify-center">
            <span
              className="text-3xl font-bold ml-1"
              style={{ color: '#303150', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
            >
              ₪
            </span>
            <input
              ref={amountInputRef}
              id="quick-amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onBlur={() => { if (amount) scrollToNextField('amount'); }}
              placeholder="0"
              className="text-4xl font-bold text-center bg-transparent border-none outline-none w-40"
              style={{
                color: '#303150',
                fontFamily: 'var(--font-nunito), system-ui, sans-serif',
              }}
              required
              min="0"
              step="0.01"
              aria-required="true"
            />
          </div>
        </div>

        {/* Type Toggle - Segmented Control */}
        <div ref={(el) => { if (el) fieldRefs.current.set('type', el); }}>
          <fieldset>
            <legend
              className="block text-sm font-medium mb-2"
              style={{ color: '#7E7F90', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
            >
              סוג עסקה
            </legend>
            <div className="grid grid-cols-2 gap-2" role="group" aria-label="סוג עסקה">
              <button
                type="button"
                onClick={() => {
                  setType('expense');
                  setCategory('');
                  scrollToNextField('type');
                }}
                aria-pressed={type === 'expense'}
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
                aria-pressed={type === 'income'}
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
          </fieldset>
        </div>

        {/* Category - Full Select */}
        <div ref={(el) => { if (el) fieldRefs.current.set('category', el); }}>
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: '#7E7F90', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
          >
            קטגוריה
          </label>
          <CategorySelect
            value={category}
            onChange={handleCategorySelect}
            defaultCategories={currentCategories.default}
            customCategories={currentCategories.custom}
            placeholder="בחר קטגוריה"
            onAddNew={() => setShowAddCategory(true)}
            required
          />
        </div>

        {/* Description - Required */}
        <div ref={(el) => { if (el) fieldRefs.current.set('description', el); }}>
          <label
            htmlFor="quick-description"
            className="block text-sm font-medium mb-1.5"
            style={{ color: '#7E7F90', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
          >
            תיאור
          </label>
          <input
            id="quick-description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => { if (description) scrollToNextField('description'); }}
            placeholder="תיאור העסקה"
            className="input"
            required
            aria-required="true"
          />
        </div>

        {/* Date */}
        <div ref={(el) => { if (el) fieldRefs.current.set('date', el); }}>
          <label
            htmlFor="quick-date"
            className="block text-sm font-medium mb-1.5"
            style={{ color: '#7E7F90', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
          >
            תאריך
          </label>
          <input
            id="quick-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input"
            required
            aria-required="true"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !amount || !category || !description}
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
        categoryType={type}
      />
    </>
  );
}
