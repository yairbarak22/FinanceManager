'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Trash2, Receipt, Plus, Upload, CheckSquare, Square, X, Edit3, ChevronDown, Check, Pencil } from 'lucide-react';
import { Transaction } from '@/lib/types';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { getCategoryInfo, expenseCategories, incomeCategories, CategoryInfo } from '@/lib/categories';
import ConfirmDialog from './modals/ConfirmDialog';
import { SensitiveData } from './common/SensitiveData';

// Save behavior options
type SaveBehavior = 'once' | 'always' | 'alwaysAsk';

interface CategoryEditData {
  transaction: Transaction;
  newCategory: string;
  saveBehavior: SaveBehavior;
}

interface RecentTransactionsProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onDeleteMultiple?: (ids: string[]) => void;
  onUpdateCategory?: (transactionId: string, newCategory: string, merchantName: string, saveBehavior: SaveBehavior) => void;
  onNewTransaction: () => void;
  onImport: () => void;
  customExpenseCategories?: CategoryInfo[];
  customIncomeCategories?: CategoryInfo[];
}

export default function RecentTransactions({
  transactions,
  onDelete,
  onDeleteMultiple,
  onUpdateCategory,
  onNewTransaction,
  onImport,
  customExpenseCategories = [],
  customIncomeCategories = []
}: RecentTransactionsProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; description: string }>({
    isOpen: false,
    id: '',
    description: '',
  });
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [multiDeleteConfirm, setMultiDeleteConfirm] = useState(false);

  // Category edit state
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [saveBehavior, setSaveBehavior] = useState<SaveBehavior>('once');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  const openEditDialog = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setSelectedCategory(transaction.category);
    setSaveBehavior('once');
    setIsDropdownOpen(false);
  };

  const closeEditDialog = () => {
    setEditingTransaction(null);
    setSelectedCategory('');
    setSaveBehavior('once');
    setIsDropdownOpen(false);
  };

  const handleSaveCategory = () => {
    if (editingTransaction && selectedCategory && onUpdateCategory) {
      onUpdateCategory(
        editingTransaction.id,
        selectedCategory,
        editingTransaction.description,
        saveBehavior
      );
      closeEditDialog();
    }
  };

  const getCategoriesForType = (type: string): CategoryInfo[] => {
    if (type === 'income') {
      return [...incomeCategories, ...customIncomeCategories];
    } else {
      return [...expenseCategories, ...customExpenseCategories];
    }
  };

  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    setSelectedIds(new Set());
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    if (selectedIds.size === transactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(transactions.map(t => t.id)));
    }
  };

  const handleMultiDelete = () => {
    if (onDeleteMultiple && selectedIds.size > 0) {
      onDeleteMultiple(Array.from(selectedIds));
      setSelectedIds(new Set());
      setIsSelectMode(false);
    }
    setMultiDeleteConfirm(false);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header - Fixed - Matching AssetsSection Style */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(241, 138, 181, 0.1)' }}
          >
            <Receipt className="w-5 h-5" style={{ color: '#F18AB5' }} strokeWidth={1.5} />
          </div>
          <div>
            <h3 
              className="font-semibold"
              style={{ 
                fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                color: '#303150'
              }}
            >
              הוצאות שוטפות
            </h3>
            <p 
              className="text-xs font-medium"
              style={{ color: '#F18AB5' }}
            >
              {transactions.length} עסקאות
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isSelectMode ? (
            <>
              <button
                onClick={selectAll}
                className="text-sm font-medium flex items-center gap-1 hover:opacity-80 transition-opacity"
                style={{ color: '#7E7F90' }}
              >
                {selectedIds.size === transactions.length ? (
                  <CheckSquare className="w-4 h-4" strokeWidth={1.5} />
                ) : (
                  <Square className="w-4 h-4" strokeWidth={1.5} />
                )}
                {selectedIds.size === transactions.length ? 'בטל הכל' : 'בחר הכל'}
              </button>
              <button
                onClick={toggleSelectMode}
                className="text-sm font-medium flex items-center gap-1 hover:opacity-80 transition-opacity"
                style={{ color: '#7E7F90' }}
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
                ביטול
              </button>
            </>
          ) : (
            <>
              {transactions.length > 0 && onDeleteMultiple && (
                <button
                  onClick={toggleSelectMode}
                  className="text-sm font-medium flex items-center gap-1 hover:opacity-80 transition-opacity"
                  style={{ color: '#7E7F90' }}
                >
                  <CheckSquare className="w-4 h-4" strokeWidth={1.5} />
                  בחירה
                </button>
              )}
              <button
                id="btn-import-transactions"
                onClick={onImport}
                className="text-sm font-medium flex items-center gap-1 hover:opacity-80 transition-opacity"
                style={{ color: '#7E7F90' }}
              >
                <Upload className="w-4 h-4" strokeWidth={1.5} />
                ייבוא
              </button>
              <button
                id="btn-global-add"
                onClick={onNewTransaction}
                className="text-sm font-medium flex items-center gap-1 hover:opacity-80 transition-opacity"
                style={{ color: '#69ADFF' }}
              >
                <Plus className="w-4 h-4" strokeWidth={1.5} />
                הוסף
              </button>
            </>
          )}
        </div>
      </div>

      {/* Transactions List - Scrollable - Matching AssetsSection Style */}
      <div className="overflow-y-scroll flex-1 min-h-0 scrollbar-transactions scrollbar-edge-left scrollbar-fade-bottom">
        {transactions.map((transaction, index) => {
          const customCategories = transaction.type === 'income'
            ? customIncomeCategories
            : customExpenseCategories;
          const categoryInfo = getCategoryInfo(
            transaction.category,
            transaction.type as 'income' | 'expense',
            customCategories
          );
          const Icon = categoryInfo?.icon;
          const isIncome = transaction.type === 'income';
          const isSelected = selectedIds.has(transaction.id);

          // Icon colors based on transaction type
          const iconBgColor = isIncome ? 'rgba(13, 186, 204, 0.1)' : 'rgba(241, 138, 181, 0.1)';
          const iconColor = isIncome ? '#0DBACC' : '#F18AB5';
          const amountColor = isIncome ? '#0DBACC' : '#F18AB5';

          return (
            <div
              key={transaction.id}
              onClick={isSelectMode ? () => toggleSelection(transaction.id) : undefined}
              role={isSelectMode ? 'button' : undefined}
              tabIndex={isSelectMode ? 0 : undefined}
              onKeyDown={isSelectMode ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleSelection(transaction.id);
                }
              } : undefined}
              aria-pressed={isSelectMode ? isSelected : undefined}
              aria-label={isSelectMode ? `${isSelected ? 'בטל בחירה' : 'בחר'} עסקה: ${transaction.description}` : undefined}
              className={cn(
                'p-3',
                isSelectMode && 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500',
                isSelected ? 'bg-indigo-50' : 'bg-white',
                index < transactions.length - 1 && 'border-b'
              )}
              style={{ borderColor: '#F7F7F8' }}
            >
              {/* Row 1: Icon + Category + Date */}
              <div className="flex items-start gap-3 mb-2">
                {/* Checkbox (Select Mode) or Category Icon */}
                {isSelectMode ? (
                  <div
                    className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors',
                      isSelected ? 'bg-indigo-100' : 'bg-slate-100'
                    )}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-indigo-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                ) : (
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: iconBgColor }}
                  >
                    {Icon && (
                      <Icon
                        className="w-4 h-4"
                        style={{ color: iconColor }}
                        strokeWidth={1.5}
                      />
                    )}
                  </div>
                )}

                {/* Details - full width, allow wrapping */}
                <div className="flex-1 pr-3">
                  <SensitiveData 
                    as="p" 
                    className="font-medium text-sm leading-tight"
                    style={{ 
                      fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                      color: '#303150'
                    }}
                  >
                    {categoryInfo?.nameHe || transaction.category}
                  </SensitiveData>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span 
                      className="text-xs"
                      style={{ color: '#7E7F90' }}
                    >
                      {formatDate(transaction.date)}
                    </span>
                  </div>
                  <SensitiveData 
                    as="p" 
                    className="text-xs mt-0.5"
                    style={{ color: '#7E7F90' }}
                  >
                    {transaction.description}
                  </SensitiveData>
                </div>
              </div>

              {/* Row 2: Amount + Actions */}
              <div className="flex items-center justify-between mr-12 pl-3">
                {/* Amount */}
                <SensitiveData
                  as="p"
                  className="text-sm font-semibold"
                  style={{ 
                    fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                    color: amountColor
                  }}
                >
                  {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
                </SensitiveData>

                {/* Action Buttons (only in normal mode) */}
                {!isSelectMode && (
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => openEditDialog(transaction)}
                      className="p-1.5 rounded hover:bg-slate-100 transition-colors"
                      style={{ color: '#7E7F90' }}
                      aria-label={`ערוך עסקה: ${transaction.description}`}
                    >
                      <Pencil className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm({ isOpen: true, id: transaction.id, description: transaction.description })}
                      className="p-1.5 rounded hover:bg-red-50 transition-colors"
                      style={{ color: '#7E7F90' }}
                      aria-label={`מחק עסקה: ${transaction.description}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        {transactions.length === 0 && (
          <p 
            className="text-center text-sm py-4"
            style={{ color: '#7E7F90' }}
          >
            אין עסקאות להצגה
          </p>
        )}
      </div>

      {/* Floating Action Bar (Select Mode) */}
      {
        isSelectMode && selectedIds.size > 0 && (
          <div className="sticky bottom-0 mt-4 p-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl shadow-lg flex items-center justify-between">
            <span className="text-white font-medium">
              {selectedIds.size} נבחרו
            </span>
            <button
              onClick={() => setMultiDeleteConfirm(true)}
              className="px-4 py-2 bg-white text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              מחק הכל
            </button>
          </div>
        )
      }

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: '', description: '' })}
        onConfirm={() => onDelete(deleteConfirm.id)}
        title="מחיקת עסקה"
        message={`האם אתה בטוח שברצונך למחוק את העסקה "${deleteConfirm.description}"?`}
      />

      {/* Multi-Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={multiDeleteConfirm}
        onClose={() => setMultiDeleteConfirm(false)}
        onConfirm={handleMultiDelete}
        title="מחיקת עסקאות"
        message={`האם אתה בטוח שברצונך למחוק ${selectedIds.size} עסקאות?`}
      />

      {/* Category Edit Dialog - Using Portal for proper z-index */}
      {
        editingTransaction && createPortal(
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
            style={{ zIndex: 9999 }}
            onClick={closeEditDialog}
            role="presentation"
          >
            <div
              className="bg-white rounded-2xl shadow-xl w-full max-w-md"
              dir="rtl"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="edit-category-title"
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 id="edit-category-title" className="font-semibold text-slate-900">עריכת קטגוריה</h3>
                <button
                  type="button"
                  onClick={closeEditDialog}
                  className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                  aria-label="סגור"
                >
                  <X className="w-5 h-5 text-slate-500" aria-hidden="true" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 space-y-4">
                {/* Transaction info */}
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-600">עסקה:</p>
                  <SensitiveData as="p" className="font-medium text-slate-900">
                    {editingTransaction.description}
                  </SensitiveData>
                  <SensitiveData as="p" className="text-sm text-slate-500">
                    {formatCurrency(editingTransaction.amount)} • {formatDate(editingTransaction.date)}
                  </SensitiveData>
                </div>

                {/* Category dropdown */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    קטגוריה חדשה
                  </label>
                  <div ref={dropdownRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className={cn(
                        'w-full px-3 py-2.5 border-2 rounded-xl text-sm font-medium transition-all',
                        'flex items-center justify-between gap-2',
                        'focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 focus:outline-none',
                        'border-violet-300 bg-white text-indigo-700 hover:border-violet-400'
                      )}
                    >
                      <span>
                        {getCategoryInfo(
                          selectedCategory,
                          editingTransaction.type as 'income' | 'expense',
                          editingTransaction.type === 'income' ? customIncomeCategories : customExpenseCategories
                        )?.nameHe || 'בחר קטגוריה...'}
                      </span>
                      <ChevronDown className={cn(
                        'w-4 h-4 flex-shrink-0 transition-transform',
                        isDropdownOpen && 'rotate-180'
                      )} />
                    </button>

                    {isDropdownOpen && (
                      <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                        <div className="p-1">
                          {getCategoriesForType(editingTransaction.type).map((cat) => {
                            const isSelected = cat.id === selectedCategory;
                            return (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => {
                                  setSelectedCategory(cat.id);
                                  setIsDropdownOpen(false);
                                }}
                                className={cn(
                                  'w-full px-3 py-2 rounded-lg text-sm font-medium text-right',
                                  'flex items-center justify-between gap-2 transition-colors',
                                  isSelected
                                    ? 'bg-indigo-100 text-indigo-700 border-2 border-violet-300'
                                    : 'text-slate-700 hover:bg-slate-100 border-2 border-transparent'
                                )}
                              >
                                <span>{cat.nameHe}</span>
                                {isSelected && <Check className="w-4 h-4 text-indigo-600" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Save behavior options */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    שמירה לפעמים הבאות
                  </label>
                  <div className="space-y-2">
                    <label className={cn(
                      'flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all',
                      saveBehavior === 'once'
                        ? 'border-violet-300 bg-indigo-50'
                        : 'border-slate-200 hover:border-slate-300'
                    )}>
                      <input
                        type="radio"
                        name="saveBehavior"
                        value="once"
                        checked={saveBehavior === 'once'}
                        onChange={() => setSaveBehavior('once')}
                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <p className="font-medium text-slate-900">רק הפעם</p>
                        <p className="text-xs text-slate-500">העדכון יחול רק על עסקה זו</p>
                      </div>
                    </label>

                    <label className={cn(
                      'flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all',
                      saveBehavior === 'always'
                        ? 'border-violet-300 bg-indigo-50'
                        : 'border-slate-200 hover:border-slate-300'
                    )}>
                      <input
                        type="radio"
                        name="saveBehavior"
                        value="always"
                        checked={saveBehavior === 'always'}
                        onChange={() => setSaveBehavior('always')}
                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <p className="font-medium text-slate-900">זכור לפעמים הבאות</p>
                        <p className="text-xs text-slate-500">עסקאות עתידיות מעסק זה יסווגו אוטומטית</p>
                      </div>
                    </label>

                    <label className={cn(
                      'flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all',
                      saveBehavior === 'alwaysAsk'
                        ? 'border-violet-300 bg-indigo-50'
                        : 'border-slate-200 hover:border-slate-300'
                    )}>
                      <input
                        type="radio"
                        name="saveBehavior"
                        value="alwaysAsk"
                        checked={saveBehavior === 'alwaysAsk'}
                        onChange={() => setSaveBehavior('alwaysAsk')}
                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <p className="font-medium text-slate-900">תמיד תשאל אותי</p>
                        <p className="text-xs text-slate-500">לעסקים גנריים כמו העברה בביט, PayBox וכו׳</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-100 flex gap-3">
                <button
                  onClick={handleSaveCategory}
                  disabled={!selectedCategory || selectedCategory === editingTransaction.category}
                  className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  שמור
                </button>
                <button
                  onClick={closeEditDialog}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                >
                  ביטול
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      }
    </div>
  );
}
