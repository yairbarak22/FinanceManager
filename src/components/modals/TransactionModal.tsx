'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Transaction } from '@/lib/types';
import { CategoryInfo } from '@/lib/categories';
import CategorySelect from '@/components/ui/CategorySelect';
import AddCategoryModal from '@/components/ui/AddCategoryModal';
import { useFocusTrap } from '@/hooks/useFocusTrap';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
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

  // Accessibility: Focus trap for modal
  const { containerRef, handleKeyDown } = useFocusTrap<HTMLDivElement>(isOpen, {
    onEscape: onClose,
  });

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      type,
      amount: parseFloat(amount),
      category,
      description,
      date,
    });
    onClose();
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
        onClick={onClose}
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
            <h2 id="transaction-modal-title" className="text-xl font-bold text-slate-900">
              {transaction ? 'עריכת עסקה' : 'עסקה חדשה'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="btn-icon"
              aria-label="סגור חלון"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {/* Type Toggle */}
              <fieldset>
                <legend className="label">סוג עסקה</legend>
                <div className="grid grid-cols-2 gap-2" role="group" aria-label="סוג עסקה">
                  <button
                    type="button"
                    onClick={() => {
                      setType('expense');
                      setCategory('');
                    }}
                    aria-pressed={type === 'expense'}
                    className={`py-3 px-4 rounded-xl font-medium transition-all ${
                      type === 'expense'
                        ? 'bg-indigo-500 text-white'
                        : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                    }`}
                  >
                    הוצאה
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setType('income');
                      setCategory('');
                    }}
                    aria-pressed={type === 'income'}
                    className={`py-3 px-4 rounded-xl font-medium transition-all ${
                      type === 'income'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                    }`}
                  >
                    הכנסה
                  </button>
                </div>
              </fieldset>

              {/* Amount */}
              <div>
                <label htmlFor="tx-amount" className="label">סכום (₪)</label>
                <input
                  id="tx-amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="input"
                  required
                  min="0"
                  step="0.01"
                  aria-required="true"
                />
              </div>

              {/* Category */}
              <div>
                <label id="tx-category-label" className="label">קטגוריה</label>
                <CategorySelect
                  value={category}
                  onChange={setCategory}
                  defaultCategories={type === 'income' ? incomeCategories.default : expenseCategories.default}
                  customCategories={type === 'income' ? incomeCategories.custom : expenseCategories.custom}
                  placeholder="בחר קטגוריה"
                  onAddNew={() => setShowAddCategory(true)}
                  required
                  aria-labelledby="tx-category-label"
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="tx-description" className="label">תיאור</label>
                <input
                  id="tx-description"
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="תיאור העסקה"
                  className="input"
                  required
                  aria-required="true"
                />
              </div>

              {/* Date */}
              <div>
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
              <button type="button" onClick={onClose} className="btn-secondary flex-1">
                ביטול
              </button>
              <button type="submit" className="btn-primary flex-1">
                {transaction ? 'עדכן' : 'הוסף'}
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
