'use client';

import { useState, useRef, useEffect } from 'react';
import { Trash2, Receipt, Plus, Upload, CheckSquare, Square, X, Edit3, ChevronDown, Check } from 'lucide-react';
import { Transaction } from '@/lib/types';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { getCategoryInfo, expenseCategories, incomeCategories, CategoryInfo } from '@/lib/categories';
import ConfirmDialog from './modals/ConfirmDialog';

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
}

export default function RecentTransactions({ transactions, onDelete, onDeleteMultiple, onUpdateCategory, onNewTransaction, onImport }: RecentTransactionsProps) {
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
    return type === 'income' ? incomeCategories : expenseCategories;
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
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
            <Receipt className="w-4 h-4 text-gray-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">הוצאות שוטפות</h3>
            <p className="text-xs text-gray-500">{transactions.length} עסקאות</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {isSelectMode ? (
            <>
              <button
                onClick={selectAll}
                className="text-sm text-gray-600 hover:text-gray-700 font-medium flex items-center gap-1"
              >
                {selectedIds.size === transactions.length ? (
                  <CheckSquare className="w-4 h-4" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
                {selectedIds.size === transactions.length ? 'בטל הכל' : 'בחר הכל'}
              </button>
              <button
                onClick={toggleSelectMode}
                className="text-sm text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1 mr-2"
              >
                <X className="w-4 h-4" />
                ביטול
              </button>
            </>
          ) : (
            <>
              {transactions.length > 0 && onDeleteMultiple && (
                <button
                  onClick={toggleSelectMode}
                  className="text-sm text-gray-500 hover:text-gray-600 font-medium flex items-center gap-1"
                >
                  <CheckSquare className="w-4 h-4" />
                  בחירה
                </button>
              )}
              <button
                onClick={onImport}
                className="text-sm text-gray-600 hover:text-gray-700 font-medium flex items-center gap-1"
              >
                <Upload className="w-4 h-4" />
                ייבוא
              </button>
              <button
                onClick={onNewTransaction}
                className="text-sm text-pink-600 hover:text-pink-700 font-medium flex items-center gap-1 mr-2"
              >
                <Plus className="w-4 h-4" />
                הוסף
              </button>
            </>
          )}
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-2">
        {transactions.map((transaction) => {
          const categoryInfo = getCategoryInfo(
            transaction.category,
            transaction.type as 'income' | 'expense'
          );
          const Icon = categoryInfo?.icon;
          const isIncome = transaction.type === 'income';
          const isSelected = selectedIds.has(transaction.id);

          return (
            <div
              key={transaction.id}
              onClick={isSelectMode ? () => toggleSelection(transaction.id) : undefined}
              className={cn(
                'flex items-center gap-3 p-3 rounded-xl transition-colors group',
                isSelectMode ? 'cursor-pointer' : '',
                isSelected ? 'bg-violet-50 ring-2 ring-violet-300' : 'bg-gray-50 hover:bg-gray-100'
              )}
            >
              {/* Checkbox (Select Mode) or Category Icon */}
              {isSelectMode ? (
                <div
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors',
                    isSelected ? 'bg-violet-100' : 'bg-gray-100'
                  )}
                >
                  {isSelected ? (
                    <CheckSquare className="w-5 h-5 text-violet-600" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              ) : (
                <div
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                    categoryInfo?.bgColor || 'bg-gray-100'
                  )}
                >
                  {Icon && (
                    <Icon
                      className={cn('w-5 h-5', categoryInfo?.textColor || 'text-gray-600')}
                    />
                  )}
                </div>
              )}

              {/* Transaction Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900 text-sm truncate">
                    {categoryInfo?.nameHe || transaction.category}
                  </p>
                  <span className="text-xs text-gray-400">
                    {formatDate(transaction.date)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 truncate">{transaction.description}</p>
              </div>

              {/* Amount */}
              <p
                className={cn(
                  'text-sm font-bold flex-shrink-0',
                  isIncome ? 'text-green-600' : 'text-pink-600'
                )}
              >
                {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
              </p>

              {/* Action Buttons (only in normal mode) */}
              {!isSelectMode && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                  {/* Edit Category Button */}
                  {onUpdateCategory && (
                    <button
                      onClick={() => openEditDialog(transaction)}
                      className="p-1.5 rounded-lg text-gray-300 hover:text-violet-500 hover:bg-violet-50 transition-all"
                      title="ערוך קטגוריה"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                  {/* Delete Button */}
                  <button
                    onClick={() => setDeleteConfirm({ isOpen: true, id: transaction.id, description: transaction.description })}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
                    title="מחק"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {transactions.length === 0 && (
        <div className="text-center py-12">
          <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">אין עסקאות להצגה</p>
        </div>
      )}

      {/* Floating Action Bar (Select Mode) */}
      {isSelectMode && selectedIds.size > 0 && (
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
      )}

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

      {/* Category Edit Dialog */}
      {editingTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" dir="rtl">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">עריכת קטגוריה</h3>
              <button
                onClick={closeEditDialog}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Transaction info */}
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-600">עסקה:</p>
                <p className="font-medium text-gray-900">{editingTransaction.description}</p>
                <p className="text-sm text-gray-500">
                  {formatCurrency(editingTransaction.amount)} • {formatDate(editingTransaction.date)}
                </p>
              </div>

              {/* Category dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  קטגוריה חדשה
                </label>
                <div ref={dropdownRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={cn(
                      'w-full px-3 py-2.5 border-2 rounded-xl text-sm font-medium transition-all',
                      'flex items-center justify-between gap-2',
                      'focus:ring-2 focus:ring-violet-500 focus:ring-offset-1 focus:outline-none',
                      'border-violet-300 bg-white text-violet-700 hover:border-violet-400'
                    )}
                  >
                    <span>
                      {getCategoryInfo(selectedCategory, editingTransaction.type as 'income' | 'expense')?.nameHe || 'בחר קטגוריה...'}
                    </span>
                    <ChevronDown className={cn(
                      'w-4 h-4 flex-shrink-0 transition-transform',
                      isDropdownOpen && 'rotate-180'
                    )} />
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
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
                                  ? 'bg-violet-100 text-violet-700 border-2 border-violet-300' 
                                  : 'text-gray-700 hover:bg-gray-100 border-2 border-transparent'
                              )}
                            >
                              <span>{cat.nameHe}</span>
                              {isSelected && <Check className="w-4 h-4 text-violet-600" />}
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  שמירה לפעמים הבאות
                </label>
                <div className="space-y-2">
                  <label className={cn(
                    'flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all',
                    saveBehavior === 'once' 
                      ? 'border-violet-300 bg-violet-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  )}>
                    <input
                      type="radio"
                      name="saveBehavior"
                      value="once"
                      checked={saveBehavior === 'once'}
                      onChange={() => setSaveBehavior('once')}
                      className="w-4 h-4 text-violet-600 focus:ring-violet-500"
                    />
                    <div>
                      <p className="font-medium text-gray-900">רק הפעם</p>
                      <p className="text-xs text-gray-500">העדכון יחול רק על עסקה זו</p>
                    </div>
                  </label>

                  <label className={cn(
                    'flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all',
                    saveBehavior === 'always' 
                      ? 'border-violet-300 bg-violet-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  )}>
                    <input
                      type="radio"
                      name="saveBehavior"
                      value="always"
                      checked={saveBehavior === 'always'}
                      onChange={() => setSaveBehavior('always')}
                      className="w-4 h-4 text-violet-600 focus:ring-violet-500"
                    />
                    <div>
                      <p className="font-medium text-gray-900">זכור לפעמים הבאות</p>
                      <p className="text-xs text-gray-500">עסקאות עתידיות מעסק זה יסווגו אוטומטית</p>
                    </div>
                  </label>

                  <label className={cn(
                    'flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all',
                    saveBehavior === 'alwaysAsk' 
                      ? 'border-violet-300 bg-violet-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  )}>
                    <input
                      type="radio"
                      name="saveBehavior"
                      value="alwaysAsk"
                      checked={saveBehavior === 'alwaysAsk'}
                      onChange={() => setSaveBehavior('alwaysAsk')}
                      className="w-4 h-4 text-violet-600 focus:ring-violet-500"
                    />
                    <div>
                      <p className="font-medium text-gray-900">תמיד תשאל אותי</p>
                      <p className="text-xs text-gray-500">לעסקים גנריים כמו העברה בביט, PayBox וכו׳</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={handleSaveCategory}
                disabled={!selectedCategory || selectedCategory === editingTransaction.category}
                className="flex-1 py-2.5 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                שמור
              </button>
              <button
                onClick={closeEditDialog}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
