'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2 } from 'lucide-react';
import { RecurringTransaction } from '@/lib/types';
import { CategoryInfo } from '@/lib/categories';
import CategorySelect from '@/components/ui/CategorySelect';
import AddCategoryModal from '@/components/ui/AddCategoryModal';

// Field order for auto-scroll
const FIELD_ORDER = ['type', 'name', 'amount', 'category', 'isActive'];

interface RecurringModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    transaction: Omit<RecurringTransaction, 'id' | 'createdAt' | 'updatedAt'>,
    updateExistingTransactions?: boolean
  ) => void | Promise<void>;
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
  const [isActive, setIsActive] = useState(true);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [updateExistingTransactions, setUpdateExistingTransactions] = useState(false);
  const [originalCategory, setOriginalCategory] = useState('');

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

  // Set mounted state for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (transaction) {
      setType(transaction.type as 'income' | 'expense');
      setAmount(transaction.amount.toString());
      setCategory(transaction.category);
      setOriginalCategory(transaction.category);
      setName(transaction.name);
      setIsActive(transaction.isActive);
    } else {
      setType('expense');
      setAmount('');
      setCategory('');
      setOriginalCategory('');
      setName('');
      setIsActive(true);
    }
    // Reset the "update existing" checkbox when modal opens/closes
    setUpdateExistingTransactions(false);
  }, [transaction, isOpen]);

  const currentCategories = type === 'income' ? incomeCategories : expenseCategories;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Only pass updateExistingTransactions if editing and category changed
      const shouldUpdateExisting = transaction && category !== originalCategory && updateExistingTransactions;
      await onSave({
        type,
        amount: parseFloat(amount),
        category,
        name,
        isActive,
      }, shouldUpdateExisting);
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

              {/* Update Existing Transactions Checkbox - Only show when editing and category changed */}
              {transaction && category !== originalCategory && (
                <div className="flex items-center gap-3 py-2">
                  <input
                    type="checkbox"
                    id="updateExistingTransactions"
                    checked={updateExistingTransactions}
                    onChange={(e) => setUpdateExistingTransactions(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                  />
                  <label 
                    htmlFor="updateExistingTransactions" 
                    className="text-sm cursor-pointer"
                    style={{ color: '#303150' }}
                  >
                    עדכן את כל העסקאות הקיימות מאותו עסק
                  </label>
                </div>
              )}

              {/* Active Toggle */}
              <div ref={(el) => { if (el) fieldRefs.current.set('isActive', el); }} className="flex items-center justify-between">
                <label className="label mb-0">פעיל</label>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`toggle ${isActive ? 'toggle-checked' : 'toggle-unchecked'}`}
                >
                  <span
                    className={`toggle-thumb ${isActive ? 'toggle-thumb-checked' : 'toggle-thumb-unchecked'
                      }`}
                  />
                </button>
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

  // Render modal via portal to document.body
  return createPortal(modalContent, document.body);
}
