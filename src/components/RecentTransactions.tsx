'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Receipt, Plus, Upload, CheckSquare, Square, X, Edit3, ChevronDown, Check, Pencil, Loader2, Filter } from 'lucide-react';
import { Transaction } from '@/lib/types';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { getCategoryInfo, expenseCategories, incomeCategories, CategoryInfo } from '@/lib/categories';
import ConfirmDialog from './modals/ConfirmDialog';
import { SensitiveData } from './common/SensitiveData';

// Save behavior options
type SaveBehavior = 'once' | 'always' | 'alwaysAsk';

interface RecentTransactionsProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onDeleteMultiple?: (ids: string[]) => Promise<void> | void;
  onUpdateTransaction?: (
    transactionId: string,
    newCategory: string,
    merchantName: string,
    saveBehavior: SaveBehavior,
    newDescription?: string,
    newAmount?: number,
    updateExistingTransactions?: boolean
  ) => Promise<void> | void;
  onNewTransaction: () => void;
  onImport: () => void;
  customExpenseCategories?: CategoryInfo[];
  customIncomeCategories?: CategoryInfo[];
  selectedCategory?: string | null;
  onClearCategoryFilter?: () => void;
}

export default function RecentTransactions({
  transactions,
  onDelete,
  onDeleteMultiple,
  onUpdateTransaction,
  onNewTransaction,
  onImport,
  customExpenseCategories = [],
  customIncomeCategories = [],
  selectedCategory = null,
  onClearCategoryFilter
}: RecentTransactionsProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; description: string }>({
    isOpen: false,
    id: '',
    description: '',
  });
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [multiDeleteConfirm, setMultiDeleteConfirm] = useState(false);

  // Transaction edit state
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingCategory, setEditingCategory] = useState<string>('');
  const [editingDescription, setEditingDescription] = useState<string>('');
  const [editingAmount, setEditingAmount] = useState<string>('');
  const [saveBehavior, setSaveBehavior] = useState<SaveBehavior>('once');
  const [updateExistingTransactions, setUpdateExistingTransactions] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const categoryButtonRef = useRef<HTMLButtonElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target) && 
          categoryButtonRef.current && !categoryButtonRef.current.contains(target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  // Update dropdown position when opened
  const handleToggleDropdown = () => {
    if (!isDropdownOpen && categoryButtonRef.current) {
      const rect = categoryButtonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
    setIsDropdownOpen(!isDropdownOpen);
  };

  const openEditDialog = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setEditingCategory(transaction.category);
    setEditingDescription(transaction.description);
    setEditingAmount(transaction.amount.toString());
    setSaveBehavior('once');
    setUpdateExistingTransactions(false);
    setIsDropdownOpen(false);
    setIsSaving(false);
  };

  const closeEditDialog = () => {
    setEditingTransaction(null);
    setEditingCategory('');
    setEditingDescription('');
    setEditingAmount('');
    setSaveBehavior('once');
    setUpdateExistingTransactions(false);
    setIsDropdownOpen(false);
    setIsSaving(false);
  };

  const handleSaveTransaction = async () => {
    if (!editingTransaction || !onUpdateTransaction) return;
    
    const categoryChanged = editingCategory !== editingTransaction.category;
    const hasChanges = 
      categoryChanged ||
      editingDescription !== editingTransaction.description ||
      parseFloat(editingAmount) !== editingTransaction.amount;
    
    if (!hasChanges) {
      closeEditDialog();
      return;
    }
    
    setIsSaving(true);
    try {
      await onUpdateTransaction(
        editingTransaction.id,
        editingCategory,
        editingTransaction.description, // Original description for merchant mapping
        saveBehavior,
        editingDescription !== editingTransaction.description ? editingDescription : undefined,
        parseFloat(editingAmount) !== editingTransaction.amount ? parseFloat(editingAmount) : undefined,
        categoryChanged && updateExistingTransactions ? true : undefined
      );
      closeEditDialog();
    } catch (error) {
      // Error is handled by parent, just reset saving state
      setIsSaving(false);
    }
  };

  const getCategoriesForType = (type: string): CategoryInfo[] => {
    if (type === 'income') {
      return [...incomeCategories, ...customIncomeCategories];
    } else {
      return [...expenseCategories, ...customExpenseCategories];
    }
  };

  // Memoize category info calculations to prevent recalculation on every render
  const categoryInfoMap = useMemo(() => {
    const map = new Map<string, { info: ReturnType<typeof getCategoryInfo>; isIncome: boolean }>();
    transactions.forEach((transaction) => {
      const customCategories = transaction.type === 'income'
        ? customIncomeCategories
        : customExpenseCategories;
      const info = getCategoryInfo(
        transaction.category,
        transaction.type as 'income' | 'expense',
        customCategories
      );
      map.set(transaction.id, { info, isIncome: transaction.type === 'income' });
    });
    return map;
  }, [transactions, customExpenseCategories, customIncomeCategories]);

  // Get selected category display name
  const selectedCategoryName = useMemo(() => {
    if (!selectedCategory) return null;
    const categoryInfo = getCategoryInfo(selectedCategory, 'expense', customExpenseCategories);
    return categoryInfo?.nameHe || selectedCategory;
  }, [selectedCategory, customExpenseCategories]);

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

  const handleMultiDelete = async () => {
    if (onDeleteMultiple && selectedIds.size > 0) {
      await onDeleteMultiple(Array.from(selectedIds));
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

      {/* Category Filter Chip */}
      <AnimatePresence>
        {selectedCategory && selectedCategoryName && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="mb-3 flex-shrink-0 overflow-hidden"
          >
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl"
              style={{
                backgroundColor: '#F7F7F8',
                border: '1px solid #69ADFF',
              }}
            >
              <Filter className="w-3.5 h-3.5" style={{ color: '#69ADFF' }} strokeWidth={2} />
              <span
                className="text-sm font-medium"
                style={{
                  fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                  color: '#303150',
                }}
              >
                {selectedCategoryName}
              </span>
              <button
                onClick={onClearCategoryFilter}
                className="p-0.5 rounded-md hover:bg-[#E8E8ED] transition-colors"
                style={{ color: '#7E7F90' }}
                aria-label="בטל סינון קטגוריה"
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transactions List - Scrollable - Matching AssetsSection Style */}
      <div className="overflow-y-scroll flex-1 min-h-0 scrollbar-transactions scrollbar-edge-left scrollbar-fade-bottom">
        <AnimatePresence mode="popLayout">
          {transactions.map((transaction, index) => {
            const cached = categoryInfoMap.get(transaction.id);
            const categoryInfo = cached?.info;
            const Icon = categoryInfo?.icon;
            const isIncome = cached?.isIncome ?? transaction.type === 'income';
            const isSelected = selectedIds.has(transaction.id);

            // Icon colors based on transaction type
            const iconBgColor = isIncome ? 'rgba(13, 186, 204, 0.1)' : 'rgba(241, 138, 181, 0.1)';
            const iconColor = isIncome ? '#0DBACC' : '#F18AB5';
            const amountColor = isIncome ? '#0DBACC' : '#F18AB5';

            return (
              <motion.div
                key={transaction.id}
                layout
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ 
                  type: 'spring', 
                  stiffness: 300, 
                  damping: 30,
                  opacity: { duration: 0.2 }
                }}
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
                        isSelected ? 'bg-[#C1DDFF]' : 'bg-[#F7F7F8]'
                      )}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-[#69ADFF]" />
                      ) : (
                        <Square className="w-4 h-4 text-[#7E7F90]" />
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
                    dir="ltr"
                  >
                    {`${isIncome ? '+' : '-'}${formatCurrency(transaction.amount)}`}
                  </SensitiveData>

                  {/* Action Buttons (only in normal mode) */}
                  {!isSelectMode && (
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => openEditDialog(transaction)}
                        className="p-1.5 rounded hover:bg-[#F7F7F8] transition-colors"
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
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        <AnimatePresence>
          {transactions.length === 0 && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center text-sm py-4"
              style={{ color: '#7E7F90' }}
            >
              אין עסקאות להצגה
            </motion.p>
          )}
        </AnimatePresence>
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

      {/* Transaction Edit Dialog - Using Portal for proper z-index */}
      {
        editingTransaction && createPortal(
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
            style={{ zIndex: 9999 }}
            onClick={() => !isSaving && closeEditDialog()}
            role="presentation"
          >
            <div
              className="bg-white rounded-3xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
              dir="rtl"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="edit-transaction-title"
            >
              {/* Header */}
              <div className="p-4 border-b border-[#F7F7F8] flex items-center justify-between">
                <h3 id="edit-transaction-title" className="font-semibold text-[#303150]">עריכת עסקה</h3>
                <button
                  type="button"
                  onClick={closeEditDialog}
                  className="p-1.5 hover:bg-[#F7F7F8] rounded-lg transition-colors"
                  aria-label="סגור"
                  disabled={isSaving}
                >
                  <X className="w-5 h-5 text-[#7E7F90]" aria-hidden="true" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 space-y-4">
                {/* Transaction date info */}
                <div className="p-3 bg-[#F7F7F8] rounded-xl">
                  <p className="text-sm text-[#7E7F90]">תאריך העסקה:</p>
                  <p className="font-medium text-[#303150]">
                    {formatDate(editingTransaction.date)}
                  </p>
                </div>

                {/* Description input */}
                <div>
                  <label className="block text-sm font-medium text-[#303150] mb-2">
                    תיאור העסקה
                  </label>
                  <input
                    type="text"
                    value={editingDescription}
                    onChange={(e) => setEditingDescription(e.target.value)}
                    className="w-full px-3 py-2.5 border-2 border-[#E8E8ED] rounded-xl text-sm font-medium text-[#303150] focus:border-[#69ADFF] focus:ring-2 focus:ring-[#69ADFF] focus:ring-offset-1 focus:outline-none transition-all placeholder:text-[#BDBDCB]"
                    placeholder="תיאור העסקה"
                    disabled={isSaving}
                  />
                </div>

                {/* Amount input */}
                <div>
                  <label className="block text-sm font-medium text-[#303150] mb-2">
                    סכום (₪)
                  </label>
                  <input
                    type="number"
                    value={editingAmount}
                    onChange={(e) => setEditingAmount(e.target.value)}
                    className="w-full px-3 py-2.5 border-2 border-[#E8E8ED] rounded-xl text-sm font-medium text-[#303150] focus:border-[#69ADFF] focus:ring-2 focus:ring-[#69ADFF] focus:ring-offset-1 focus:outline-none transition-all placeholder:text-[#BDBDCB]"
                    placeholder="0"
                    min="0"
                    step="0.01"
                    disabled={isSaving}
                  />
                </div>

                {/* Category dropdown */}
                <div>
                  <label className="block text-sm font-medium text-[#303150] mb-2">
                    קטגוריה
                  </label>
                  <div className="relative">
                    <button
                      ref={categoryButtonRef}
                      type="button"
                      onClick={handleToggleDropdown}
                      disabled={isSaving}
                      className={cn(
                        'w-full px-3 py-2.5 border-2 rounded-xl text-sm font-medium transition-all',
                        'flex items-center justify-between gap-2',
                        'focus:ring-2 focus:ring-[#69ADFF] focus:ring-offset-1 focus:outline-none',
                        'border-[#E8E8ED] bg-white text-[#303150] hover:border-[#69ADFF]',
                        isSaving && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <span>
                        {getCategoryInfo(
                          editingCategory,
                          editingTransaction.type as 'income' | 'expense',
                          editingTransaction.type === 'income' ? customIncomeCategories : customExpenseCategories
                        )?.nameHe || 'בחר קטגוריה...'}
                      </span>
                      <ChevronDown className={cn(
                        'w-4 h-4 flex-shrink-0 transition-transform',
                        isDropdownOpen && 'rotate-180'
                      )} />
                    </button>

                    {/* Category dropdown rendered via portal to appear above modal */}
                    {isDropdownOpen && dropdownPosition && createPortal(
                      <div
                        ref={dropdownRef}
                        className="bg-white border border-[#E8E8ED] rounded-xl shadow-lg max-h-48 overflow-y-auto"
                        style={{
                          position: 'fixed',
                          top: dropdownPosition.top,
                          left: dropdownPosition.left,
                          width: dropdownPosition.width,
                          zIndex: 10001,
                        }}
                        dir="rtl"
                      >
                        <div className="p-1">
                          {getCategoriesForType(editingTransaction.type).map((cat) => {
                            const isCatSelected = cat.id === editingCategory;
                            return (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => {
                                  setEditingCategory(cat.id);
                                  setIsDropdownOpen(false);
                                }}
                                className={cn(
                                  'w-full px-3 py-2 rounded-lg text-sm font-medium text-right',
                                  'flex items-center justify-between gap-2 transition-colors',
                                  isCatSelected
                                    ? 'bg-[#C1DDFF] text-[#303150] border-2 border-[#69ADFF]'
                                    : 'text-[#303150] hover:bg-[#F7F7F8] border-2 border-transparent'
                                )}
                              >
                                <span>{cat.nameHe}</span>
                                {isCatSelected && <Check className="w-4 h-4 text-[#69ADFF]" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>,
                      document.body
                    )}
                  </div>
                </div>

                {/* Save behavior options - only show if category changed */}
                {editingCategory !== editingTransaction.category && (
                  <div>
                    <label className="block text-sm font-medium text-[#303150] mb-2">
                      שמירת הקטגוריה לפעמים הבאות
                    </label>
                    <div className="space-y-2">
                      <label className={cn(
                        'flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all',
                        saveBehavior === 'once'
                          ? 'border-[#69ADFF] bg-[#C1DDFF]/30'
                          : 'border-[#E8E8ED] hover:border-[#69ADFF]'
                      )}>
                        <input
                          type="radio"
                          name="saveBehavior"
                          value="once"
                          checked={saveBehavior === 'once'}
                          onChange={() => setSaveBehavior('once')}
                          className="w-4 h-4 text-[#69ADFF] focus:ring-[#69ADFF]"
                          disabled={isSaving}
                        />
                        <div>
                          <p className="font-medium text-[#303150]">רק הפעם</p>
                          <p className="text-xs text-[#7E7F90]">העדכון יחול רק על עסקה זו</p>
                        </div>
                      </label>

                      <label className={cn(
                        'flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all',
                        saveBehavior === 'always'
                          ? 'border-[#69ADFF] bg-[#C1DDFF]/30'
                          : 'border-[#E8E8ED] hover:border-[#69ADFF]'
                      )}>
                        <input
                          type="radio"
                          name="saveBehavior"
                          value="always"
                          checked={saveBehavior === 'always'}
                          onChange={() => setSaveBehavior('always')}
                          className="w-4 h-4 text-[#69ADFF] focus:ring-[#69ADFF]"
                          disabled={isSaving}
                        />
                        <div>
                          <p className="font-medium text-[#303150]">זכור לפעמים הבאות</p>
                          <p className="text-xs text-[#7E7F90]">עסקאות עתידיות מעסק זה יסווגו אוטומטית</p>
                        </div>
                      </label>

                      <label className={cn(
                        'flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all',
                        saveBehavior === 'alwaysAsk'
                          ? 'border-[#69ADFF] bg-[#C1DDFF]/30'
                          : 'border-[#E8E8ED] hover:border-[#69ADFF]'
                      )}>
                        <input
                          type="radio"
                          name="saveBehavior"
                          value="alwaysAsk"
                          checked={saveBehavior === 'alwaysAsk'}
                          onChange={() => setSaveBehavior('alwaysAsk')}
                          className="w-4 h-4 text-[#69ADFF] focus:ring-[#69ADFF]"
                          disabled={isSaving}
                        />
                        <div>
                          <p className="font-medium text-[#303150]">תמיד תשאל אותי</p>
                          <p className="text-xs text-[#7E7F90]">לעסקים גנריים כמו העברה בביט, PayBox וכו׳</p>
                        </div>
                      </label>
                    </div>

                    {/* Update existing transactions checkbox */}
                    <div className="mt-4 pt-4 border-t border-[#E8E8ED]">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={updateExistingTransactions}
                          onChange={(e) => setUpdateExistingTransactions(e.target.checked)}
                          className="w-5 h-5 rounded border-gray-300 text-[#69ADFF] focus:ring-[#69ADFF]"
                          disabled={isSaving}
                        />
                        <div>
                          <p className="font-medium text-[#303150]">עדכן את כל העסקאות הקיימות מאותו עסק</p>
                          <p className="text-xs text-[#7E7F90]">שנה את הקטגוריה בכל העסקאות מעסק זה</p>
                        </div>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-[#F7F7F8] flex gap-3">
                <button
                  onClick={handleSaveTransaction}
                  disabled={isSaving || !editingDescription.trim() || !editingAmount || parseFloat(editingAmount) <= 0}
                  className="flex-1 py-2.5 bg-[#69ADFF] text-white rounded-xl font-medium hover:bg-[#5A9EE6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      שומר...
                    </>
                  ) : (
                    'שמור'
                  )}
                </button>
                <button
                  onClick={closeEditDialog}
                  disabled={isSaving}
                  className="flex-1 py-2.5 bg-[#F7F7F8] text-[#303150] rounded-xl font-medium hover:bg-[#E8E8ED] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
