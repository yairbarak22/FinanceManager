'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { RecurringTransaction } from '@/lib/types';
import { expenseCategories, incomeCategories } from '@/lib/categories';

interface RecurringModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<RecurringTransaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
  transaction?: RecurringTransaction | null;
}

export default function RecurringModal({
  isOpen,
  onClose,
  onSave,
  transaction,
}: RecurringModalProps) {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [name, setName] = useState('');
  const [isActive, setIsActive] = useState(true);

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

  const categories = type === 'income' ? incomeCategories : expenseCategories;

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

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-scale-in" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2 className="text-xl font-bold text-gray-900">
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
                  className={`py-3 px-4 rounded-xl font-medium transition-all ${
                    type === 'expense'
                      ? 'bg-pink-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
                  className={`py-3 px-4 rounded-xl font-medium transition-all ${
                    type === 'income'
                      ? 'bg-teal-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="select"
                required
              >
                <option value="">בחר קטגוריה</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nameHe}
                  </option>
                ))}
              </select>
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
                  className={`toggle-thumb ${
                    isActive ? 'toggle-thumb-checked' : 'toggle-thumb-unchecked'
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
  );
}

