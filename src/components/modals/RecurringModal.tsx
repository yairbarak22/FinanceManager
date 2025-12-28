'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { RecurringTransaction } from '@/lib/types';
import { CategoryInfo } from '@/lib/categories';
import CategorySelect from '@/components/ui/CategorySelect';
import AddCategoryModal from '@/components/ui/AddCategoryModal';

interface RecurringModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<RecurringTransaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
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
      setIsActive(transaction.isActive);
    } else {
      setType('expense');
      setAmount('');
      setCategory('');
      setName('');
      setIsActive(true);
    }
  }, [transaction, isOpen]);

  const currentCategories = type === 'income' ? incomeCategories : expenseCategories;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      type,
      amount: parseFloat(amount),
      category,
      name,
      isActive,
    });
    onClose();
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
        onClick={onClose}
      >
        <div className="modal-content animate-scale-in" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="modal-header">
            <h2 className="text-xl font-bold text-slate-900">
              {transaction ? 'עריכת עסקה קבועה' : 'עסקה קבועה חדשה'}
            </h2>
            <button onClick={onClose} className="btn-icon">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {/* Type Toggle */}
              <div>
                <label className="label">סוג עסקה</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setType('expense');
                      setCategory('');
                    }}
                    className={`py-3 px-4 rounded-xl font-medium transition-all ${type === 'expense'
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
                    className={`py-3 px-4 rounded-xl font-medium transition-all ${type === 'income'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                      }`}
                  >
                    הכנסה
                  </button>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="label">שם העסקה</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="לדוגמה: משכורת יאיר"
                  className="input"
                  required
                />
              </div>

              {/* Amount */}
              <div>
                <label className="label">סכום (₪)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="input"
                  required
                  min="0"
                  step="0.01"
                />
              </div>

              {/* Category */}
              <div>
                <label className="label">קטגוריה</label>
                <CategorySelect
                  value={category}
                  onChange={setCategory}
                  defaultCategories={type === 'income' ? incomeCategories.default : expenseCategories.default}
                  customCategories={type === 'income' ? incomeCategories.custom : expenseCategories.custom}
                  placeholder="בחר קטגוריה"
                  onAddNew={() => setShowAddCategory(true)}
                  required
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between">
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

  // Render modal via portal to document.body
  return createPortal(modalContent, document.body);
}
