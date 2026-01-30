'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Transaction } from '@/lib/types';
import { CategoryInfo } from '@/lib/categories';
import CategorySelect from '@/components/ui/CategorySelect';
import AddCategoryModal from '@/components/ui/AddCategoryModal';
import { useFocusTrap } from '@/hooks/useFocusTrap';

// Field order for auto-scroll
const FIELD_ORDER = ['type', 'amount', 'category', 'description', 'date'];

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => void | Promise<void>;
  transaction?: Transaction | null;
  expenseCategories: { default: CategoryInfo[]; custom: CategoryInfo[] };
  incomeCategories: { default: CategoryInfo[]; custom: CategoryInfo[] };
  onAddCategory: (name: string, type: 'expense' | 'income') => Promise<CategoryInfo>;
}

export default function TransactionModal({
  isOpen,
  onClose,
  onSave,
  transaction,
  expenseCategories,
  incomeCategories,
  onAddCategory,
}: TransactionModalProps) {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Refs for auto-scroll to next field
  const fieldRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const modalBodyRef = useRef<HTMLDivElement>(null);

  // Accessibility: Focus trap for modal
  const { containerRef, handleKeyDown } = useFocusTrap<HTMLDivElement>(isOpen, {
    onEscape: onClose,
  });

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
    if (transaction) {
      setType(transaction.type as 'income' | 'expense');
      setAmount(transaction.amount.toString());
      setCategory(transaction.category);
      setDescription(transaction.description);
      setDate(new Date(transaction.date).toISOString().split('T')[0]);
    } else {
      setType('expense');
      setAmount('');
      setCategory('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [transaction, isOpen]);

  const currentCategories = type === 'income' ? incomeCategories : expenseCategories;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSave({
        type,
        amount: parseFloat(amount),
        category,
        description,
        date,
      });
      onClose();
    } catch (error) {
      // Error handling is done in the parent component
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCategory = async (name: string) => {
    const newCategory = await onAddCategory(name, type);
    setCategory(newCategory.id);
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="modal-overlay"
        onClick={() => !isLoading && onClose()}
        role="presentation"
      >
        <div
          ref={containerRef}
          className="modal-content animate-scale-in"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={handleKeyDown}
          role="dialog"
          aria-modal="true"
          aria-labelledby="transaction-modal-title"
        >
          {/* Header */}
          <div className="modal-header">
            <h2 
              id="transaction-modal-title" 
              className="text-xl font-bold"
              style={{ 
                color: '#303150', 
                fontFamily: 'var(--font-nunito), system-ui, sans-serif' 
              }}
            >
              {transaction ? 'עריכת עסקה' : 'עסקה חדשה'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="btn-icon"
              aria-label="סגור חלון"
              disabled={isLoading}
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="modal-body" ref={modalBodyRef}>
              {/* Type Toggle */}
              <div ref={(el) => { if (el) fieldRefs.current.set('type', el); }}>
                <fieldset>
                  <legend className="label">סוג עסקה</legend>
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

              {/* Amount */}
              <div ref={(el) => { if (el) fieldRefs.current.set('amount', el); }}>
                <label htmlFor="tx-amount" className="label">סכום (₪)</label>
                <input
                  id="tx-amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  onBlur={() => { if (amount) scrollToNextField('amount'); }}
                  placeholder="0"
                  className="input"
                  required
                  min="0"
                  step="0.01"
                  aria-required="true"
                />
              </div>

              {/* Category */}
              <div ref={(el) => { if (el) fieldRefs.current.set('category', el); }}>
                <label id="tx-category-label" className="label">קטגוריה</label>
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
                  aria-labelledby="tx-category-label"
                />
              </div>

              {/* Description */}
              <div ref={(el) => { if (el) fieldRefs.current.set('description', el); }}>
                <label htmlFor="tx-description" className="label">תיאור</label>
                <input
                  id="tx-description"
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
                <label htmlFor="tx-date" className="label">תאריך</label>
                <input
                  id="tx-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="input"
                  required
                  aria-required="true"
                />
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
}
