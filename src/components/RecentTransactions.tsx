'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Receipt, Plus, Upload, CheckSquare, Square, X, ChevronDown, ChevronLeft, Check, Loader2, Filter, Search, Tag, Calculator, SlidersHorizontal, FileSpreadsheet, ArrowUpDown } from 'lucide-react';
import ExportExcelModal from './modals/ExportExcelModal';
import { Transaction } from '@/lib/types';
import { formatCurrency, formatCurrencyAmount, formatDate, cn } from '@/lib/utils';
import { getCategoryInfo, expenseCategories, incomeCategories, CategoryInfo } from '@/lib/categories';
import ConfirmDialog from './modals/ConfirmDialog';
import { SensitiveData } from './common/SensitiveData';

// Sort options
type SortOption = 'date' | 'category' | 'amount';

const SORT_LABELS: Record<SortOption, string> = {
  date: 'לפי תאריך',
  category: 'לפי קטגוריה',
  amount: 'לפי סכום',
};

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
  onBulkUpdateCategory?: (ids: string[], category: string) => Promise<void> | void;
  onNewTransaction: () => void;
  onImport: () => void;
  customExpenseCategories?: CategoryInfo[];
  customIncomeCategories?: CategoryInfo[];
  selectedCategory?: string | null;
  onClearCategoryFilter?: () => void;
  onOpenMaaserCalculator?: () => void;
}

export default function RecentTransactions({
  transactions,
  onDelete,
  onDeleteMultiple,
  onUpdateTransaction,
  onBulkUpdateCategory,
  onNewTransaction,
  onImport,
  customExpenseCategories = [],
  customIncomeCategories = [],
  selectedCategory = null,
  onClearCategoryFilter,
  onOpenMaaserCalculator,
}: RecentTransactionsProps) {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; description: string }>({
    isOpen: false,
    id: '',
    description: '',
  });
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [multiDeleteConfirm, setMultiDeleteConfirm] = useState(false);

  // Sort state
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const sortButtonRef = useRef<HTMLButtonElement>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [isCategoryFilterOpen, setIsCategoryFilterOpen] = useState(false);
  const categoryFilterRef = useRef<HTMLDivElement>(null);
  const categoryFilterBtnRef = useRef<HTMLButtonElement>(null);

  // Bulk category edit state
  const [isBulkCategoryModalOpen, setIsBulkCategoryModalOpen] = useState(false);
  const [bulkCategory, setBulkCategory] = useState<string>('');
  const [isBulkSaving, setIsBulkSaving] = useState(false);
  const [bulkDropdownOpen, setBulkDropdownOpen] = useState(false);
  const [bulkDropdownPosition, setBulkDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const bulkCategoryButtonRef = useRef<HTMLButtonElement>(null);
  const bulkDropdownRef = useRef<HTMLDivElement>(null);

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

  // Close sort dropdown on click outside
  useEffect(() => {
    if (!isSortOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        sortDropdownRef.current && !sortDropdownRef.current.contains(target) &&
        sortButtonRef.current && !sortButtonRef.current.contains(target)
      ) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSortOpen]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close category filter on click outside
  useEffect(() => {
    if (!isCategoryFilterOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (categoryFilterRef.current && !categoryFilterRef.current.contains(target) &&
          categoryFilterBtnRef.current && !categoryFilterBtnRef.current.contains(target)) {
        setIsCategoryFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCategoryFilterOpen]);

  // Close bulk dropdown on click outside
  useEffect(() => {
    if (!bulkDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (bulkDropdownRef.current && !bulkDropdownRef.current.contains(target) &&
          bulkCategoryButtonRef.current && !bulkCategoryButtonRef.current.contains(target)) {
        setBulkDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [bulkDropdownOpen]);

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

  // Build unique category list from current transactions
  const availableCategories = useMemo(() => {
    const seen = new Map<string, { info: ReturnType<typeof getCategoryInfo>; count: number }>();
    transactions.forEach((tx) => {
      if (seen.has(tx.category)) {
        seen.get(tx.category)!.count++;
        return;
      }
      const custom = tx.type === 'income' ? customIncomeCategories : customExpenseCategories;
      const info = getCategoryInfo(tx.category, tx.type as 'income' | 'expense', custom);
      seen.set(tx.category, { info, count: 1 });
    });
    return Array.from(seen.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .map(([id, { info, count }]) => ({ id, info, count }));
  }, [transactions, customExpenseCategories, customIncomeCategories]);

  const toggleCategoryFilter = useCallback((categoryId: string) => {
    setSelectedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setSelectedCategories(new Set());
    if (selectedCategory && onClearCategoryFilter) {
      onClearCategoryFilter();
    }
  }, [selectedCategory, onClearCategoryFilter]);

  const hasActiveFilters = debouncedSearchQuery.trim().length > 0 || selectedCategories.size > 0 || !!selectedCategory;

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    let result = transactions;

    if (selectedCategories.size > 0) {
      result = result.filter(t => selectedCategories.has(t.category));
    }

    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      result = result.filter(t => t.description?.toLowerCase().includes(query));
    }

    const sorted = [...result];
    switch (sortBy) {
      case 'date':
        sorted.sort((a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        break;
      case 'category': {
        sorted.sort((a, b) => {
          const aCats = a.type === 'income' ? customIncomeCategories : customExpenseCategories;
          const bCats = b.type === 'income' ? customIncomeCategories : customExpenseCategories;
          const aName = getCategoryInfo(a.category, a.type as 'income' | 'expense', aCats)?.nameHe || '';
          const bName = getCategoryInfo(b.category, b.type as 'income' | 'expense', bCats)?.nameHe || '';
          const cmp = aName.localeCompare(bName, 'he');
          return cmp !== 0 ? cmp : (a.description || '').localeCompare(b.description || '', 'he');
        });
        break;
      }
      case 'amount':
        sorted.sort((a, b) => b.amount - a.amount);
        break;
    }

    return sorted;
  }, [transactions, debouncedSearchQuery, selectedCategories, sortBy, customExpenseCategories, customIncomeCategories]);

  // Grouped view for category sort mode
  const groupedByCategory = useMemo(() => {
    if (sortBy !== 'category') return [];

    const groups = new Map<string, { transactions: Transaction[]; total: number; info: ReturnType<typeof getCategoryInfo>; isIncome: boolean }>();

    filteredTransactions.forEach((tx) => {
      const existing = groups.get(tx.category);
      if (existing) {
        existing.transactions.push(tx);
        existing.total += tx.type === 'income' ? tx.amount : -tx.amount;
      } else {
        const customCats = tx.type === 'income' ? customIncomeCategories : customExpenseCategories;
        const info = getCategoryInfo(tx.category, tx.type as 'income' | 'expense', customCats);
        groups.set(tx.category, {
          transactions: [tx],
          total: tx.type === 'income' ? tx.amount : -tx.amount,
          info,
          isIncome: tx.type === 'income',
        });
      }
    });

    return Array.from(groups.entries())
      .sort(([, a], [, b]) => (a.info?.nameHe || '').localeCompare(b.info?.nameHe || '', 'he'))
      .map(([categoryId, data]) => ({ categoryId, ...data }));
  }, [filteredTransactions, sortBy, customExpenseCategories, customIncomeCategories]);

  const toggleCategoryExpanded = useCallback((categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }, []);

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

  // Bulk category edit handlers
  const openBulkCategoryModal = () => {
    setBulkCategory('');
    setIsBulkCategoryModalOpen(true);
    setBulkDropdownOpen(false);
    setIsBulkSaving(false);
  };

  const closeBulkCategoryModal = () => {
    setIsBulkCategoryModalOpen(false);
    setBulkCategory('');
    setBulkDropdownOpen(false);
    setIsBulkSaving(false);
  };

  const handleToggleBulkDropdown = () => {
    if (!bulkDropdownOpen && bulkCategoryButtonRef.current) {
      const rect = bulkCategoryButtonRef.current.getBoundingClientRect();
      setBulkDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
    setBulkDropdownOpen(!bulkDropdownOpen);
  };

  // Determine the dominant type of selected transactions for category filtering
  const selectedTransactionsType = useMemo(() => {
    if (selectedIds.size === 0) return 'expense';
    const selectedTxns = transactions.filter(t => selectedIds.has(t.id));
    const expenseCount = selectedTxns.filter(t => t.type === 'expense').length;
    const incomeCount = selectedTxns.filter(t => t.type === 'income').length;
    return expenseCount >= incomeCount ? 'expense' : 'income';
  }, [selectedIds, transactions]);

  const bulkCategoriesList = useMemo(() => {
    if (selectedTransactionsType === 'income') {
      return [...incomeCategories, ...customIncomeCategories];
    }
    return [...expenseCategories, ...customExpenseCategories];
  }, [selectedTransactionsType, customExpenseCategories, customIncomeCategories]);

  const handleBulkSave = async () => {
    if (!onBulkUpdateCategory || selectedIds.size === 0 || !bulkCategory) return;
    setIsBulkSaving(true);
    try {
      await onBulkUpdateCategory(Array.from(selectedIds), bulkCategory);
      closeBulkCategoryModal();
      setSelectedIds(new Set());
      setIsSelectMode(false);
    } catch {
      setIsBulkSaving(false);
    }
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
              עסקאות שוטפות
            </h3>
            <p 
              className="text-xs font-medium"
              style={{ color: '#F18AB5' }}
            >
              {hasActiveFilters
                ? `${filteredTransactions.length} מתוך ${transactions.length} עסקאות`
                : `${transactions.length} עסקאות`
              }
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
                  בחירה
                  <CheckSquare className="w-4 h-4" strokeWidth={1.5} />
                </button>
              )}
              {onOpenMaaserCalculator && (
                <button
                  onClick={onOpenMaaserCalculator}
                  className="text-sm font-medium flex items-center gap-1 hover:opacity-80 transition-opacity"
                  style={{ color: '#7E7F90' }}
                >
                  מעשרות
                  <Calculator className="w-4 h-4" strokeWidth={1.5} />
                </button>
              )}
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="text-sm font-medium flex items-center gap-1 hover:opacity-80 transition-opacity"
                style={{ color: '#7E7F90' }}
              >
                ייצוא
                <FileSpreadsheet className="w-4 h-4" strokeWidth={1.5} />
              </button>
              <button
                id="btn-import-transactions"
                onClick={onImport}
                className="text-sm font-medium flex items-center gap-1 hover:opacity-80 transition-opacity"
                style={{ color: '#7E7F90' }}
              >
                ייבוא
                <Upload className="w-4 h-4" strokeWidth={1.5} />
              </button>
              <button
                id="btn-global-add"
                onClick={onNewTransaction}
                className="text-sm font-medium flex items-center gap-1 hover:opacity-80 transition-opacity"
                style={{ color: '#69ADFF' }}
              >
                הוסף
                <Plus className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Search & Filter Bar */}
      {transactions.length > 0 && (
        <div className="mb-3 flex-shrink-0 space-y-2">
          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                style={{ color: '#BDBDCB' }}
                strokeWidth={1.75}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="חיפוש לפי שם עסק..."
                dir="rtl"
                aria-label="חיפוש לפי שם עסק"
                className="w-full pr-10 pl-9 py-2.5 bg-white rounded-xl text-sm transition-all outline-none"
                style={{
                  fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                  color: '#303150',
                  border: '1px solid #E8E8ED',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#69ADFF';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(105, 173, 255, 0.2)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#E8E8ED';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-0.5 rounded-md hover:bg-[#F7F7F8] transition-colors"
                  style={{ color: '#7E7F90' }}
                  aria-label="נקה חיפוש"
                >
                  <X className="w-4 h-4" strokeWidth={2} />
                </button>
              )}
            </div>

            {/* Category Filter Toggle */}
            <div className="relative">
              <button
                ref={categoryFilterBtnRef}
                onClick={() => setIsCategoryFilterOpen(prev => !prev)}
                className={cn(
                  'p-2.5 rounded-xl transition-all relative',
                  'hover:scale-[1.05] active:scale-[0.95]'
                )}
                style={{
                  border: isCategoryFilterOpen || selectedCategories.size > 0
                    ? '1px solid #69ADFF'
                    : '1px solid #E8E8ED',
                  backgroundColor: selectedCategories.size > 0 ? 'rgba(105, 173, 255, 0.08)' : '#FFFFFF',
                }}
                aria-label="סינון לפי קטגוריה"
                aria-expanded={isCategoryFilterOpen}
              >
                <SlidersHorizontal
                  className="w-4 h-4"
                  style={{ color: selectedCategories.size > 0 ? '#69ADFF' : '#7E7F90' }}
                  strokeWidth={1.75}
                />
                {selectedCategories.size > 0 && (
                  <span
                    className="absolute -top-1.5 -left-1.5 rounded-full flex items-center justify-center text-[10px] font-bold"
                    style={{
                      backgroundColor: '#69ADFF',
                      color: '#FFFFFF',
                      minWidth: '18px',
                      height: '18px',
                      lineHeight: '18px',
                      fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                    }}
                  >
                    {selectedCategories.size}
                  </span>
                )}
              </button>

              {/* Category Filter Dropdown */}
              <AnimatePresence>
                {isCategoryFilterOpen && (
                  <motion.div
                    ref={categoryFilterRef}
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className="absolute left-0 top-full mt-2 rounded-2xl overflow-hidden"
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E8E8ED',
                      width: '280px',
                      zIndex: 50,
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                    }}
                    dir="rtl"
                  >
                    <div
                      className="px-4 py-3 flex items-center justify-between"
                      style={{ borderBottom: '1px solid #F7F7F8' }}
                    >
                      <span
                        className="text-sm font-semibold"
                        style={{
                          fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                          color: '#303150',
                        }}
                      >
                        סינון לפי קטגוריה
                      </span>
                      {selectedCategories.size > 0 && (
                        <button
                          onClick={() => setSelectedCategories(new Set())}
                          className="text-xs font-medium transition-colors hover:opacity-80"
                          style={{
                            fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                            color: '#69ADFF',
                          }}
                        >
                          נקה הכל
                        </button>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto scrollbar-ghost p-2 space-y-0.5">
                      {availableCategories.map(({ id, info, count }) => {
                        const isActive = selectedCategories.has(id);
                        const CatIcon = info?.icon;
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => toggleCategoryFilter(id)}
                            className={cn(
                              'w-full px-3 py-2 rounded-xl text-sm transition-all',
                              'flex items-center gap-2.5',
                              'hover:scale-[1.01] active:scale-[0.99]'
                            )}
                            style={{
                              fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                              backgroundColor: isActive ? 'rgba(105, 173, 255, 0.1)' : 'transparent',
                              color: '#303150',
                            }}
                          >
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{
                                background: info?.bgColor || '#F7F7F8',
                                color: info?.color || '#7E7F90',
                              }}
                            >
                              {CatIcon && <CatIcon className="w-3.5 h-3.5" strokeWidth={1.75} />}
                            </div>
                            <span className="flex-1 text-right font-medium truncate">
                              {info?.nameHe || id}
                            </span>
                            <span
                              className="text-xs flex-shrink-0"
                              style={{ color: '#BDBDCB' }}
                            >
                              {count}
                            </span>
                            <div
                              className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-colors"
                              style={{
                                border: isActive ? 'none' : '1.5px solid #E8E8ED',
                                backgroundColor: isActive ? '#69ADFF' : 'transparent',
                              }}
                            >
                              {isActive && <Check className="w-3 h-3 text-white" strokeWidth={2.5} />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sort Toggle */}
            <div className="relative">
              <button
                ref={sortButtonRef}
                onClick={() => setIsSortOpen(prev => !prev)}
                className={cn(
                  'p-2.5 rounded-xl transition-all',
                  'hover:scale-[1.05] active:scale-[0.95]'
                )}
                style={{
                  border: isSortOpen
                    ? '1px solid #69ADFF'
                    : '1px solid #E8E8ED',
                  backgroundColor: sortBy !== 'date' ? 'rgba(105, 173, 255, 0.08)' : '#FFFFFF',
                }}
                aria-label="מיון עסקאות"
                aria-expanded={isSortOpen}
              >
                <ArrowUpDown
                  className="w-4 h-4"
                  style={{ color: sortBy !== 'date' ? '#69ADFF' : '#7E7F90' }}
                  strokeWidth={1.75}
                />
              </button>

              <AnimatePresence>
                {isSortOpen && (
                  <motion.div
                    ref={sortDropdownRef}
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className="absolute left-0 top-full mt-2 rounded-xl overflow-hidden"
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E8E8ED',
                      minWidth: '160px',
                      zIndex: 50,
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                    }}
                    dir="rtl"
                  >
                    {(['date', 'category', 'amount'] as SortOption[]).map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          setSortBy(option);
                          setIsSortOpen(false);
                        }}
                        className="w-full px-4 py-2.5 text-right text-sm transition-colors first:rounded-t-xl last:rounded-b-xl"
                        style={{
                          fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                          color: sortBy === option ? '#69ADFF' : '#303150',
                          fontWeight: sortBy === option ? 600 : 400,
                          backgroundColor: sortBy === option ? 'rgba(105, 173, 255, 0.06)' : 'transparent',
                        }}
                        onMouseEnter={(e) => {
                          if (sortBy !== option) e.currentTarget.style.backgroundColor = '#F7F7F8';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = sortBy === option
                            ? 'rgba(105, 173, 255, 0.06)'
                            : 'transparent';
                        }}
                      >
                        {SORT_LABELS[option]}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Active Filter Chips */}
          <AnimatePresence>
            {(selectedCategories.size > 0 || (selectedCategory && selectedCategoryName)) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="flex flex-wrap gap-1.5 overflow-hidden"
              >
                {selectedCategory && selectedCategoryName && (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                    style={{
                      backgroundColor: 'rgba(105, 173, 255, 0.1)',
                      border: '1px solid rgba(105, 173, 255, 0.25)',
                    }}
                  >
                    <span
                      className="text-xs font-medium"
                      style={{
                        fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                        color: '#303150',
                      }}
                    >
                      {selectedCategoryName}
                    </span>
                    <button
                      onClick={onClearCategoryFilter}
                      className="p-0.5 rounded hover:bg-[#E8E8ED] transition-colors"
                      style={{ color: '#7E7F90' }}
                      aria-label={`הסר סינון ${selectedCategoryName}`}
                    >
                      <X className="w-3 h-3" strokeWidth={2.5} />
                    </button>
                  </motion.div>
                )}

                {Array.from(selectedCategories).map(catId => {
                  const catInfo = getCategoryInfo(catId, 'expense', customExpenseCategories)
                    || getCategoryInfo(catId, 'income', customIncomeCategories);
                  return (
                    <motion.div
                      key={catId}
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                      style={{
                        backgroundColor: 'rgba(105, 173, 255, 0.1)',
                        border: '1px solid rgba(105, 173, 255, 0.25)',
                      }}
                    >
                      <span
                        className="text-xs font-medium"
                        style={{
                          fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                          color: '#303150',
                        }}
                      >
                        {catInfo?.nameHe || catId}
                      </span>
                      <button
                        onClick={() => toggleCategoryFilter(catId)}
                        className="p-0.5 rounded hover:bg-[#E8E8ED] transition-colors"
                        style={{ color: '#7E7F90' }}
                        aria-label={`הסר סינון ${catInfo?.nameHe || catId}`}
                      >
                        <X className="w-3 h-3" strokeWidth={2.5} />
                      </button>
                    </motion.div>
                  );
                })}

                {hasActiveFilters && (selectedCategories.size + (selectedCategory ? 1 : 0)) > 1 && (
                  <motion.button
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={clearAllFilters}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors hover:opacity-80"
                    style={{
                      fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                      color: '#F18AB5',
                      backgroundColor: 'rgba(241, 138, 181, 0.08)',
                    }}
                  >
                    נקה הכל
                    <X className="w-3 h-3" strokeWidth={2.5} />
                  </motion.button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Transactions List - Scrollable */}
      <div className="overflow-y-scroll flex-1 min-h-0 scrollbar-transactions scrollbar-edge-left scrollbar-fade-bottom">

        {/* ── Grouped by Category View ── */}
        {sortBy === 'category' && groupedByCategory.length > 0 && (
          <div className="space-y-1.5 pb-2">
            {groupedByCategory.map((group) => {
              const CatIcon = group.info?.icon;
              const isExpanded = expandedCategories.has(group.categoryId);
              const hasExpense = group.transactions.some(t => t.type === 'expense');
              const hasIncome = group.transactions.some(t => t.type === 'income');
              const accentColor = hasIncome && !hasExpense ? '#0DBACC' : '#F18AB5';
              const accentBg = hasIncome && !hasExpense ? 'rgba(13, 186, 204, 0.08)' : 'rgba(241, 138, 181, 0.08)';

              return (
                <div key={group.categoryId}>
                  {/* Category Header */}
                  <button
                    type="button"
                    onClick={() => toggleCategoryExpanded(group.categoryId)}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 hover:shadow-sm active:scale-[0.99] cursor-pointer"
                    style={{
                      backgroundColor: isExpanded ? 'rgba(105, 173, 255, 0.04)' : '#FFFFFF',
                      border: isExpanded ? '1px solid rgba(105, 173, 255, 0.15)' : '1px solid #F7F7F8',
                    }}
                    aria-expanded={isExpanded}
                    aria-controls={`cat-group-${group.categoryId}`}
                  >
                    {/* Chevron */}
                    <ChevronLeft
                      className="w-4 h-4 flex-shrink-0 transition-transform duration-300"
                      style={{
                        color: isExpanded ? '#69ADFF' : '#BDBDCB',
                        transform: isExpanded ? 'rotate(-90deg)' : 'rotate(0deg)',
                      }}
                      strokeWidth={2}
                    />

                    {/* Category Icon */}
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        background: group.info?.bgColor || '#F7F7F8',
                      }}
                    >
                      {CatIcon && (
                        <CatIcon
                          className="w-4 h-4"
                          style={{ color: group.info?.color || '#7E7F90' }}
                          strokeWidth={1.5}
                        />
                      )}
                    </div>

                    {/* Name + Count */}
                    <div className="flex-1 text-right">
                      <p
                        className="text-sm font-semibold leading-tight"
                        style={{
                          fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                          color: '#303150',
                        }}
                      >
                        {group.info?.nameHe || group.categoryId}
                      </p>
                      <p
                        className="text-[11px] mt-0.5"
                        style={{ color: '#BDBDCB' }}
                      >
                        {group.transactions.length} עסקאות
                      </p>
                    </div>

                    {/* Total */}
                    <SensitiveData
                      as="span"
                      className="text-sm font-bold flex-shrink-0 px-2.5 py-1 rounded-lg"
                      style={{
                        fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                        color: accentColor,
                        backgroundColor: accentBg,
                      }}
                      dir="ltr"
                    >
                      {formatCurrency(Math.abs(group.total))}
                    </SensitiveData>
                  </button>

                  {/* Expanded Transactions */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        id={`cat-group-${group.categoryId}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 350, damping: 35 }}
                        className="overflow-hidden"
                      >
                        <div
                          className="mr-5 pr-4 border-r-2 mt-1 mb-2"
                          style={{ borderColor: group.info?.color || '#E8E8ED' }}
                        >
                          {group.transactions.map((transaction, txIndex) => {
                            const txIsIncome = transaction.type === 'income';
                            const txAmountColor = txIsIncome ? '#0DBACC' : '#F18AB5';
                            const txIsSelected = selectedIds.has(transaction.id);

                            return (
                              <motion.div
                                key={transaction.id}
                                initial={{ opacity: 0, x: 8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: txIndex * 0.03, duration: 0.2 }}
                                onClick={isSelectMode ? () => toggleSelection(transaction.id) : () => openEditDialog(transaction)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    if (isSelectMode) toggleSelection(transaction.id);
                                    else openEditDialog(transaction);
                                  }
                                }}
                                className={cn(
                                  'group relative flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150',
                                  isSelectMode
                                    ? 'focus:outline-none focus:ring-2 focus:ring-indigo-500'
                                    : 'hover:bg-[#F7F7F8] active:scale-[0.98]',
                                  txIsSelected ? 'bg-indigo-50' : '',
                                  txIndex < group.transactions.length - 1 && 'mb-0.5'
                                )}
                              >
                                {/* Select Mode Checkbox */}
                                {isSelectMode && (
                                  <div
                                    className={cn(
                                      'w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 transition-colors',
                                      txIsSelected ? 'bg-[#C1DDFF]' : 'bg-[#F7F7F8]'
                                    )}
                                  >
                                    {txIsSelected ? (
                                      <CheckSquare className="w-3.5 h-3.5 text-[#69ADFF]" />
                                    ) : (
                                      <Square className="w-3.5 h-3.5 text-[#7E7F90]" />
                                    )}
                                  </div>
                                )}

                                {/* Transaction Details */}
                                <div className="flex-1 min-w-0">
                                  <SensitiveData
                                    as="p"
                                    className="text-sm font-medium truncate"
                                    style={{
                                      fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                                      color: '#303150',
                                    }}
                                  >
                                    {transaction.description}
                                  </SensitiveData>
                                  <span
                                    className="text-[11px]"
                                    style={{ color: '#BDBDCB' }}
                                  >
                                    {formatDate(transaction.date)}
                                  </span>
                                </div>

                                {/* Amount */}
                                <SensitiveData
                                  as="span"
                                  className="text-sm font-semibold flex-shrink-0"
                                  style={{
                                    fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                                    color: txAmountColor,
                                  }}
                                  dir="ltr"
                                >
                                  {`${txIsIncome ? '+' : '-'}${formatCurrencyAmount(transaction.amount, transaction.currency || 'ILS')}`}
                                </SensitiveData>

                                {/* Delete (normal mode) */}
                                {!isSelectMode && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeleteConfirm({ isOpen: true, id: transaction.id, description: transaction.description });
                                    }}
                                    className="p-1 rounded hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                                    style={{ color: '#7E7F90' }}
                                    aria-label={`מחק עסקה: ${transaction.description}`}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                                  </button>
                                )}
                              </motion.div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Flat List View (date / amount sort) ── */}
        {sortBy !== 'category' && (
          <AnimatePresence mode="popLayout">
            {filteredTransactions.map((transaction, index) => {
              const cached = categoryInfoMap.get(transaction.id);
              const categoryInfo = cached?.info;
              const Icon = categoryInfo?.icon;
              const isIncome = cached?.isIncome ?? transaction.type === 'income';
              const isSelected = selectedIds.has(transaction.id);

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
                  onClick={isSelectMode ? () => toggleSelection(transaction.id) : () => openEditDialog(transaction)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (isSelectMode) {
                        toggleSelection(transaction.id);
                      } else {
                        openEditDialog(transaction);
                      }
                    }
                  }}
                  aria-pressed={isSelectMode ? isSelected : undefined}
                  aria-label={isSelectMode 
                    ? `${isSelected ? 'בטל בחירה' : 'בחר'} עסקה: ${transaction.description}` 
                    : `ערוך עסקה: ${transaction.description}`}
                  className={cn(
                    'group relative p-3 transition-all duration-200 cursor-pointer',
                    isSelectMode 
                      ? 'focus:outline-none focus:ring-2 focus:ring-indigo-500'
                      : 'hover:bg-[#F7F7F8] hover:shadow-sm active:scale-[0.98]',
                    isSelected ? 'bg-indigo-50' : 'bg-white',
                    index < filteredTransactions.length - 1 && 'border-b'
                  )}
                  style={{ borderColor: '#F7F7F8' }}
                >
                  {!isSelectMode && (
                    <div className="absolute right-0 top-2 bottom-2 w-0.5 bg-[#69ADFF] opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
                  )}
                  <div className="flex items-start gap-3 mb-2">
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

                  <div className="flex items-center justify-between mr-12 pl-3">
                    <SensitiveData
                      as="p"
                      className="text-sm font-semibold"
                      style={{ 
                        fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                        color: amountColor
                      }}
                      dir="ltr"
                    >
                      {`${isIncome ? '+' : '-'}${formatCurrencyAmount(transaction.amount, transaction.currency || 'ILS')}`}
                    </SensitiveData>

                    {!isSelectMode && (
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirm({ isOpen: true, id: transaction.id, description: transaction.description });
                          }}
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
        )}
        
        {/* ── Empty States ── */}
        <AnimatePresence>
          {transactions.length === 0 && !hasActiveFilters && (
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
          {filteredTransactions.length === 0 && transactions.length > 0 && hasActiveFilters && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="text-center py-8"
              aria-live="polite"
            >
              <Filter className="w-8 h-8 mx-auto mb-2" style={{ color: '#BDBDCB' }} strokeWidth={1.5} />
              <p
                className="text-sm font-medium mb-1"
                style={{
                  fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                  color: '#7E7F90',
                }}
              >
                לא נמצאו עסקאות תואמות
              </p>
              <p
                className="text-xs mb-3"
                style={{ color: '#BDBDCB' }}
              >
                {debouncedSearchQuery && `חיפוש: "${debouncedSearchQuery}"`}
                {debouncedSearchQuery && selectedCategories.size > 0 && ' · '}
                {selectedCategories.size > 0 && `${selectedCategories.size} קטגוריות נבחרו`}
              </p>
              <button
                onClick={clearAllFilters}
                className="text-xs font-medium transition-colors hover:opacity-80"
                style={{
                  fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                  color: '#69ADFF',
                }}
              >
                נקה את כל הסינונים
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Action Bar (Select Mode) */}
      <AnimatePresence>
        {isSelectMode && selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="sticky bottom-0 mt-4 p-3 rounded-xl shadow-lg flex items-center justify-between"
            style={{
              background: 'linear-gradient(135deg, #303150 0%, #3D3E68 100%)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            }}
            dir="rtl"
          >
            <span
              className="text-sm font-semibold"
              style={{
                fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                color: '#FFFFFF',
              }}
            >
              {selectedIds.size} נבחרו
            </span>
            <div className="flex items-center gap-2">
              {onBulkUpdateCategory && (
                <button
                  onClick={openBulkCategoryModal}
                  className="px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                    backgroundColor: '#69ADFF',
                    color: '#FFFFFF',
                  }}
                  aria-label="עריכת קטגוריה לעסקאות שנבחרו"
                >
                  <Tag className="w-4 h-4" strokeWidth={1.75} />
                  קטגוריה
                </button>
              )}
              <button
                onClick={() => setMultiDeleteConfirm(true)}
                className="px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                  backgroundColor: '#F18AB5',
                  color: '#FFFFFF',
                }}
                aria-label="מחיקת עסקאות שנבחרו"
              >
                <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                מחק
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* Bulk Category Edit Modal */}
      {isBulkCategoryModalOpen && createPortal(
        <div
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => !isBulkSaving && closeBulkCategoryModal()}
          role="presentation"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="bg-white rounded-3xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="bulk-category-title"
            onKeyDown={(e) => {
              if (e.key === 'Escape' && !isBulkSaving) closeBulkCategoryModal();
            }}
          >
            {/* Header */}
            <div
              className="p-6 flex items-center justify-between"
              style={{ borderBottom: '1px solid #F7F7F8' }}
            >
              <h3
                id="bulk-category-title"
                className="font-semibold text-lg"
                style={{
                  fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                  color: '#303150',
                }}
              >
                עריכת קטגוריה ל-{selectedIds.size} עסקאות
              </h3>
              <button
                type="button"
                onClick={closeBulkCategoryModal}
                className="p-2 rounded-lg transition-colors"
                style={{ color: '#7E7F90' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F7F7F8'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                aria-label="סגור"
                disabled={isBulkSaving}
              >
                <X className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <p
                className="text-sm"
                style={{
                  fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                  color: '#7E7F90',
                }}
              >
                בחר קטגוריה חדשה שתוחל על כל {selectedIds.size} העסקאות שנבחרו.
              </p>

              {/* Category dropdown */}
              <div>
                <label
                  className="block text-sm font-medium mb-1.5"
                  style={{
                    fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                    color: '#7E7F90',
                  }}
                >
                  קטגוריה
                </label>
                <div className="relative">
                  <button
                    ref={bulkCategoryButtonRef}
                    type="button"
                    onClick={handleToggleBulkDropdown}
                    disabled={isBulkSaving}
                    className={cn(
                      'w-full px-4 py-3 rounded-xl text-sm font-medium transition-all',
                      'flex items-center justify-between gap-2',
                      'focus:outline-none',
                      isBulkSaving && 'opacity-50 cursor-not-allowed'
                    )}
                    style={{
                      fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                      backgroundColor: '#FFFFFF',
                      border: bulkDropdownOpen ? '1px solid #69ADFF' : '1px solid #E8E8ED',
                      color: bulkCategory ? '#303150' : '#BDBDCB',
                      boxShadow: bulkDropdownOpen ? '0 0 0 3px rgba(105, 173, 255, 0.2)' : 'none',
                    }}
                  >
                    <span>
                      {bulkCategory
                        ? (getCategoryInfo(
                            bulkCategory,
                            selectedTransactionsType as 'income' | 'expense',
                            selectedTransactionsType === 'income' ? customIncomeCategories : customExpenseCategories
                          )?.nameHe || 'בחר קטגוריה...')
                        : 'בחר קטגוריה...'}
                    </span>
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 flex-shrink-0 transition-transform',
                        bulkDropdownOpen && 'rotate-180'
                      )}
                      style={{ color: '#7E7F90' }}
                    />
                  </button>

                  {/* Category dropdown rendered via portal */}
                  {bulkDropdownOpen && bulkDropdownPosition && createPortal(
                    <div
                      ref={bulkDropdownRef}
                      className="rounded-xl shadow-lg max-h-48 overflow-y-auto"
                      style={{
                        position: 'fixed',
                        top: bulkDropdownPosition.top,
                        left: bulkDropdownPosition.left,
                        width: bulkDropdownPosition.width,
                        zIndex: 10001,
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E8E8ED',
                      }}
                      dir="rtl"
                    >
                      <div className="p-1">
                        {bulkCategoriesList.map((cat) => {
                          const isCatSelected = cat.id === bulkCategory;
                          const CatIcon = cat.icon;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => {
                                setBulkCategory(cat.id);
                                setBulkDropdownOpen(false);
                              }}
                              className={cn(
                                'w-full px-3 py-2 rounded-lg text-sm font-medium text-right',
                                'flex items-center gap-2 transition-colors'
                              )}
                              style={{
                                fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                                backgroundColor: isCatSelected ? '#C1DDFF' : 'transparent',
                                color: '#303150',
                                border: isCatSelected ? '2px solid #69ADFF' : '2px solid transparent',
                              }}
                              onMouseEnter={(e) => {
                                if (!isCatSelected) e.currentTarget.style.backgroundColor = '#F7F7F8';
                              }}
                              onMouseLeave={(e) => {
                                if (!isCatSelected) e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                            >
                              <div
                                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ background: cat.bgColor, color: cat.color }}
                              >
                                {CatIcon && <CatIcon className="w-3.5 h-3.5" strokeWidth={1.75} />}
                              </div>
                              <span className="flex-1 text-right">{cat.nameHe}</span>
                              {isCatSelected && <Check className="w-4 h-4" style={{ color: '#69ADFF' }} />}
                            </button>
                          );
                        })}
                      </div>
                    </div>,
                    document.body
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div
              className="p-6 flex gap-3"
              style={{ borderTop: '1px solid #F7F7F8' }}
            >
              <button
                onClick={handleBulkSave}
                disabled={isBulkSaving || !bulkCategory}
                className="flex-1 py-2.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                  backgroundColor: '#69ADFF',
                  color: '#FFFFFF',
                }}
                onMouseEnter={(e) => {
                  if (!isBulkSaving && bulkCategory) e.currentTarget.style.backgroundColor = '#5A9EE6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#69ADFF';
                }}
              >
                {isBulkSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    שומר...
                  </>
                ) : (
                  'שמור'
                )}
              </button>
              <button
                onClick={closeBulkCategoryModal}
                disabled={isBulkSaving}
                className="flex-1 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                  backgroundColor: '#F7F7F8',
                  color: '#303150',
                }}
                onMouseEnter={(e) => {
                  if (!isBulkSaving) e.currentTarget.style.backgroundColor = '#E8E8ED';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#F7F7F8';
                }}
              >
                ביטול
              </button>
            </div>
          </motion.div>
        </div>,
        document.body
      )}

      <ExportExcelModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
}
