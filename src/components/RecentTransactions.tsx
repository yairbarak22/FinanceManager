'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trash2, Receipt, Plus, Upload, CheckSquare, Square, X,
  ChevronDown, ChevronLeft, Check, Loader2, Filter, Search,
  Tag, Calculator, SlidersHorizontal, FileSpreadsheet, ArrowUpDown,
} from 'lucide-react';
import ExportExcelModal from './modals/ExportExcelModal';
import { Transaction } from '@/lib/types';
import { formatCurrency, formatCurrencyAmount, formatDate, cn } from '@/lib/utils';
import { getCategoryInfo, expenseCategories, incomeCategories, CategoryInfo } from '@/lib/categories';
import ConfirmDialog from './modals/ConfirmDialog';
import { SensitiveData } from './common/SensitiveData';

type SortOption = 'date' | 'category' | 'amount';
type SaveBehavior = 'once' | 'always' | 'alwaysAsk';

const SORT_LABELS: Record<SortOption, string> = {
  date: 'לפי תאריך',
  category: 'לפי קטגוריה',
  amount: 'לפי סכום',
};

const GRID_COLS = 'grid grid-cols-[minmax(110px,1.2fr)_minmax(130px,2fr)_88px_105px_24px]';
const GRID_COLS_SELECT = 'grid grid-cols-[36px_minmax(110px,1.2fr)_minmax(130px,2fr)_88px_105px_24px]';

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
    updateExistingTransactions?: boolean,
    newDate?: string
  ) => Promise<void> | void;
  onBulkUpdateCategory?: (ids: string[], category: string) => Promise<void> | void;
  onNewTransaction: () => void;
  onSaveTransaction?: (data: {
    type: 'income' | 'expense';
    amount: number;
    category: string;
    description: string;
    date: string;
  }) => Promise<void>;
  onImport: () => void;
  customExpenseCategories?: CategoryInfo[];
  customIncomeCategories?: CategoryInfo[];
  selectedCategory?: string | null;
  onClearCategoryFilter?: () => void;
  onOpenMaaserCalculator?: () => void;
  onAddCategory?: (name: string, type: 'expense' | 'income') => Promise<CategoryInfo | void>;
  onDeleteCategory?: (categoryId: string, type: 'expense' | 'income') => Promise<void>;
}

export default function RecentTransactions({
  transactions,
  onDelete,
  onDeleteMultiple,
  onUpdateTransaction,
  onBulkUpdateCategory,
  onNewTransaction,
  onSaveTransaction,
  onImport,
  customExpenseCategories = [],
  customIncomeCategories = [],
  selectedCategory = null,
  onClearCategoryFilter,
  onOpenMaaserCalculator,
  onAddCategory,
  onDeleteCategory,
}: RecentTransactionsProps) {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; description: string }>({
    isOpen: false, id: '', description: '',
  });
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [multiDeleteConfirm, setMultiDeleteConfirm] = useState(false);

  // Sort state
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [sortDropdownPos, setSortDropdownPos] = useState<{ top: number; left: number } | null>(null);
  const sortButtonRef = useRef<HTMLButtonElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [isCategoryFilterOpen, setIsCategoryFilterOpen] = useState(false);
  const [categoryFilterPos, setCategoryFilterPos] = useState<{ top: number; left: number } | null>(null);
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

  // Inline editing state
  const [editingCell, setEditingCell] = useState<{ id: string; field: 'description' | 'amount' | 'date' } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [cellSaving, setCellSaving] = useState(false);

  // Inline category edit
  const [categoryEditTarget, setCategoryEditTarget] = useState<{
    transaction: Transaction;
    position: { top: number; left: number };
  } | null>(null);
  const inlineCatDropdownRef = useRef<HTMLDivElement>(null);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addingCategorySaving, setAddingCategorySaving] = useState(false);
  const categorySearchInputRef = useRef<HTMLInputElement>(null);

  // Category save-behavior popover
  const [categorySavePopover, setCategorySavePopover] = useState<{
    transaction: Transaction;
    newCategory: string;
    position: { top: number; left: number };
  } | null>(null);
  const [popoverSaveBehavior, setPopoverSaveBehavior] = useState<SaveBehavior>('once');
  const [popoverUpdateExisting, setPopoverUpdateExisting] = useState(false);
  const [popoverSaving, setPopoverSaving] = useState(false);
  const savePopoverRef = useRef<HTMLDivElement>(null);

  // Quick-add state
  const [isQuickAddActive, setIsQuickAddActive] = useState(false);
  const [quickAddValues, setQuickAddValues] = useState({ description: '', amount: '', category: '', type: 'expense' as 'income' | 'expense', date: new Date().toISOString().split('T')[0] });
  const [quickAddSaving, setQuickAddSaving] = useState(false);
  const quickAddDescRef = useRef<HTMLInputElement>(null);
  const [isQuickAddCategoryOpen, setIsQuickAddCategoryOpen] = useState(false);
  const [quickAddCatDropdownPos, setQuickAddCatDropdownPos] = useState<{ top: number; left: number } | null>(null);
  const quickAddCategoryButtonRef = useRef<HTMLButtonElement>(null);
  const quickAddCategoryDropdownRef = useRef<HTMLDivElement>(null);
  const [isQuickAddTypeOpen, setIsQuickAddTypeOpen] = useState(false);
  const [quickAddTypeDropdownPos, setQuickAddTypeDropdownPos] = useState<{ top: number; left: number } | null>(null);
  const quickAddTypeButtonRef = useRef<HTMLButtonElement>(null);
  const quickAddTypeDropdownRef = useRef<HTMLDivElement>(null);

  /* ──────────────────────── Effects ──────────────────────── */

  // Close sort dropdown on click outside
  useEffect(() => {
    if (!isSortOpen) return;
    const handle = (e: MouseEvent) => {
      const t = e.target as Node;
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(t) &&
          sortButtonRef.current && !sortButtonRef.current.contains(t)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [isSortOpen]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close category filter on click outside
  useEffect(() => {
    if (!isCategoryFilterOpen) return;
    const handle = (e: MouseEvent) => {
      const t = e.target as Node;
      if (categoryFilterRef.current && !categoryFilterRef.current.contains(t) &&
          categoryFilterBtnRef.current && !categoryFilterBtnRef.current.contains(t)) {
        setIsCategoryFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [isCategoryFilterOpen]);

  // Close bulk dropdown on click outside
  useEffect(() => {
    if (!bulkDropdownOpen) return;
    const handle = (e: MouseEvent) => {
      const t = e.target as Node;
      if (bulkDropdownRef.current && !bulkDropdownRef.current.contains(t) &&
          bulkCategoryButtonRef.current && !bulkCategoryButtonRef.current.contains(t)) {
        setBulkDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [bulkDropdownOpen]);

  // Close inline category dropdown on click outside
  useEffect(() => {
    if (!categoryEditTarget) return;
    const handle = (e: MouseEvent) => {
      const t = e.target as Node;
      if (inlineCatDropdownRef.current && !inlineCatDropdownRef.current.contains(t)) {
        setCategoryEditTarget(null);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [categoryEditTarget]);

  // Auto-focus category search input & reset state when dropdown opens/closes
  useEffect(() => {
    if (categoryEditTarget) {
      setTimeout(() => categorySearchInputRef.current?.focus(), 50);
    } else {
      setCategorySearchQuery('');
      setNewCategoryName('');
    }
  }, [categoryEditTarget]);

  // Close save-behavior popover on click outside
  useEffect(() => {
    if (!categorySavePopover) return;
    const handle = (e: MouseEvent) => {
      const t = e.target as Node;
      if (savePopoverRef.current && !savePopoverRef.current.contains(t)) {
        setCategorySavePopover(null);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [categorySavePopover]);

  // Close category dropdown & save popover on any scroll (except inside the dropdown itself)
  useEffect(() => {
    if (!categoryEditTarget && !categorySavePopover && !isQuickAddCategoryOpen && !isQuickAddTypeOpen) return;
    const close = (e: Event) => {
      if (inlineCatDropdownRef.current?.contains(e.target as Node)) return;
      if (quickAddCategoryDropdownRef.current?.contains(e.target as Node)) return;
      setCategoryEditTarget(null);
      setCategorySavePopover(null);
      setIsQuickAddCategoryOpen(false);
      setIsQuickAddTypeOpen(false);
    };
    window.addEventListener('scroll', close, true);
    return () => window.removeEventListener('scroll', close, true);
  }, [categoryEditTarget, categorySavePopover, isQuickAddCategoryOpen, isQuickAddTypeOpen]);

  // Close Quick-Add category dropdown on click outside
  useEffect(() => {
    if (!isQuickAddCategoryOpen) return;
    const handle = (e: MouseEvent) => {
      const t = e.target as Node;
      if (quickAddCategoryDropdownRef.current && !quickAddCategoryDropdownRef.current.contains(t) &&
          quickAddCategoryButtonRef.current && !quickAddCategoryButtonRef.current.contains(t)) {
        setIsQuickAddCategoryOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [isQuickAddCategoryOpen]);

  // Close Quick-Add type dropdown on click outside
  useEffect(() => {
    if (!isQuickAddTypeOpen) return;
    const handle = (e: MouseEvent) => {
      const t = e.target as Node;
      if (quickAddTypeDropdownRef.current && !quickAddTypeDropdownRef.current.contains(t) &&
          quickAddTypeButtonRef.current && !quickAddTypeButtonRef.current.contains(t)) {
        setIsQuickAddTypeOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [isQuickAddTypeOpen]);

  // Auto-focus quick-add description input
  useEffect(() => {
    if (isQuickAddActive && quickAddDescRef.current) {
      quickAddDescRef.current.focus();
    }
  }, [isQuickAddActive]);

  /* ──────────────────────── Inline Edit Handlers ──────────────────────── */

  const startCellEdit = useCallback((tx: Transaction, field: 'description' | 'amount' | 'date') => {
    setEditingCell({ id: tx.id, field });
    if (field === 'description') setEditValue(tx.description);
    else if (field === 'amount') setEditValue(tx.amount.toString());
    else setEditValue(new Date(tx.date).toISOString().split('T')[0]);
  }, []);

  const cancelCellEdit = useCallback(() => {
    setEditingCell(null);
    setEditValue('');
  }, []);

  const saveCellEdit = useCallback(async (tx: Transaction) => {
    if (!editingCell || !onUpdateTransaction) {
      setCellSaving(false);
      cancelCellEdit();
      return;
    }
    const { field } = editingCell;
    let hasChanges = false;
    let newDesc: string | undefined;
    let newAmt: number | undefined;
    let newDate: string | undefined;

    if (field === 'description' && editValue.trim() && editValue !== tx.description) {
      hasChanges = true;
      newDesc = editValue;
    } else if (field === 'amount') {
      const parsed = parseFloat(editValue);
      if (!isNaN(parsed) && parsed > 0 && parsed !== tx.amount) {
        hasChanges = true;
        newAmt = parsed;
      }
    } else if (field === 'date') {
      const currentDate = new Date(tx.date).toISOString().split('T')[0];
      if (editValue && editValue !== currentDate) {
        hasChanges = true;
        newDate = new Date(editValue + 'T12:00:00').toISOString();
      }
    }

    if (!hasChanges) {
      setCellSaving(false);
      cancelCellEdit();
      return;
    }

    setCellSaving(true);
    try {
      await onUpdateTransaction(tx.id, tx.category, tx.description, 'once', newDesc, newAmt, undefined, newDate);
    } catch { /* parent handles error */ } finally {
      setCellSaving(false);
    }
    cancelCellEdit();
  }, [editingCell, editValue, onUpdateTransaction, cancelCellEdit]);

  // Category inline edit
  const startCategoryEdit = useCallback((tx: Transaction, e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setCategoryEditTarget({
      transaction: tx,
      position: { top: rect.bottom + 4, left: rect.left },
    });
  }, []);

  const handleCategorySelected = useCallback((newCategory: string) => {
    if (!categoryEditTarget) return;
    const tx = categoryEditTarget.transaction;
    const pos = categoryEditTarget.position;
    setCategoryEditTarget(null);

    if (newCategory === tx.category) return;

    setCategorySavePopover({ transaction: tx, newCategory, position: pos });
    setPopoverSaveBehavior('once');
    setPopoverUpdateExisting(false);
    setPopoverSaving(false);
  }, [categoryEditTarget]);

  const handleAddNewCategory = useCallback(async (nameOverride?: string) => {
    if (!categoryEditTarget || !onAddCategory) return;
    const trimmedName = (nameOverride ?? newCategoryName).trim();
    if (!trimmedName) return;

    const categoryType = categoryEditTarget.transaction.type as 'expense' | 'income';
    setAddingCategorySaving(true);
    try {
      const created = await onAddCategory(trimmedName, categoryType);
      if (created) {
        handleCategorySelected(created.id);
        setNewCategoryName('');
      }
    } catch {
      /* parent handles error */
    } finally {
      setAddingCategorySaving(false);
    }
  }, [categoryEditTarget, onAddCategory, newCategoryName, handleCategorySelected]);

  const getCategoriesForType = useCallback((type: string): CategoryInfo[] => {
    const defaults = type === 'income' ? incomeCategories : expenseCategories;
    const customs = type === 'income' ? customIncomeCategories : customExpenseCategories;
    return [...customs, ...defaults];
  }, [customExpenseCategories, customIncomeCategories]);

  const handleDeleteCategoryInline = useCallback(async (categoryId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!categoryEditTarget || !onDeleteCategory) return;

    const categoryType = categoryEditTarget.transaction.type as 'expense' | 'income';
    const allCats = getCategoriesForType(categoryType);
    const cat = allCats.find(c => c.id === categoryId);
    if (!cat) return;

    if (!cat.isCustom) return;

    try {
      await onDeleteCategory(categoryId, categoryType);
    } catch {
      /* parent handles error */
    }
  }, [categoryEditTarget, onDeleteCategory, getCategoriesForType]);

  const handleConfirmCategoryChange = useCallback(async () => {
    if (!categorySavePopover || !onUpdateTransaction) return;
    setPopoverSaving(true);
    try {
      await onUpdateTransaction(
        categorySavePopover.transaction.id,
        categorySavePopover.newCategory,
        categorySavePopover.transaction.description,
        popoverSaveBehavior,
        undefined,
        undefined,
        popoverUpdateExisting || undefined,
      );
      setCategorySavePopover(null);
    } catch {
      setPopoverSaving(false);
    }
  }, [categorySavePopover, onUpdateTransaction, popoverSaveBehavior, popoverUpdateExisting]);

  /* ──────────────────────── Quick-Add Handlers ──────────────────────── */

  const resetQuickAdd = useCallback(() => {
    setIsQuickAddActive(false);
    setQuickAddValues({ description: '', amount: '', category: '', type: 'expense', date: new Date().toISOString().split('T')[0] });
    setQuickAddSaving(false);
  }, []);

  const handleQuickAddSave = useCallback(async () => {
    if (!quickAddValues.description.trim()) return;
    const amount = parseFloat(quickAddValues.amount);
    if (isNaN(amount) || amount <= 0) return;

    if (onSaveTransaction) {
      setQuickAddSaving(true);
      try {
        await onSaveTransaction({
          type: quickAddValues.type,
          amount,
          category: quickAddValues.category || (quickAddValues.type === 'expense' ? 'other' : 'other_income'),
          description: quickAddValues.description,
          date: new Date(quickAddValues.date + 'T12:00:00').toISOString(),
        });
        resetQuickAdd();
        setIsQuickAddActive(true); // reopen for next entry
      } catch {
        setQuickAddSaving(false);
      }
    } else {
      onNewTransaction();
      resetQuickAdd();
    }
  }, [quickAddValues, onSaveTransaction, onNewTransaction, resetQuickAdd]);

  /* ──────────────────────── Shared Helpers ──────────────────────── */

  const filterCategoriesBySearch = useCallback((categories: CategoryInfo[], query: string): CategoryInfo[] => {
    if (!query.trim()) return categories;
    const lowerQuery = query.toLowerCase();
    return categories.filter(cat => cat.nameHe.toLowerCase().includes(lowerQuery));
  }, []);

  /* ──────────────────────── Memoised Data ──────────────────────── */

  const categoryInfoMap = useMemo(() => {
    const map = new Map<string, { info: ReturnType<typeof getCategoryInfo>; isIncome: boolean }>();
    transactions.forEach((tx) => {
      const custom = tx.type === 'income' ? customIncomeCategories : customExpenseCategories;
      map.set(tx.id, { info: getCategoryInfo(tx.category, tx.type as 'income' | 'expense', custom), isIncome: tx.type === 'income' });
    });
    return map;
  }, [transactions, customExpenseCategories, customIncomeCategories]);

  const selectedCategoryName = useMemo(() => {
    if (!selectedCategory) return null;
    return getCategoryInfo(selectedCategory, 'expense', customExpenseCategories)?.nameHe || selectedCategory;
  }, [selectedCategory, customExpenseCategories]);

  const availableCategories = useMemo(() => {
    const seen = new Map<string, { info: ReturnType<typeof getCategoryInfo>; count: number }>();
    transactions.forEach((tx) => {
      if (seen.has(tx.category)) { seen.get(tx.category)!.count++; return; }
      const custom = tx.type === 'income' ? customIncomeCategories : customExpenseCategories;
      seen.set(tx.category, { info: getCategoryInfo(tx.category, tx.type as 'income' | 'expense', custom), count: 1 });
    });
    return Array.from(seen.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .map(([id, { info, count }]) => ({ id, info, count }));
  }, [transactions, customExpenseCategories, customIncomeCategories]);

  const toggleCategoryFilter = useCallback((categoryId: string) => {
    setSelectedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId); else next.add(categoryId);
      return next;
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setSelectedCategories(new Set());
    if (selectedCategory && onClearCategoryFilter) onClearCategoryFilter();
  }, [selectedCategory, onClearCategoryFilter]);

  const hasActiveFilters = debouncedSearchQuery.trim().length > 0 || selectedCategories.size > 0 || !!selectedCategory;

  const filteredTransactions = useMemo(() => {
    let result = transactions;
    if (selectedCategories.size > 0) result = result.filter(t => selectedCategories.has(t.category));
    if (debouncedSearchQuery.trim()) {
      const q = debouncedSearchQuery.toLowerCase();
      result = result.filter(t => t.description?.toLowerCase().includes(q));
    }
    const sorted = [...result];
    switch (sortBy) {
      case 'date':
        sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        break;
      case 'category': {
        sorted.sort((a, b) => {
          const aC = a.type === 'income' ? customIncomeCategories : customExpenseCategories;
          const bC = b.type === 'income' ? customIncomeCategories : customExpenseCategories;
          const aName = getCategoryInfo(a.category, a.type as 'income' | 'expense', aC)?.nameHe || '';
          const bName = getCategoryInfo(b.category, b.type as 'income' | 'expense', bC)?.nameHe || '';
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
        groups.set(tx.category, {
          transactions: [tx],
          total: tx.type === 'income' ? tx.amount : -tx.amount,
          info: getCategoryInfo(tx.category, tx.type as 'income' | 'expense', customCats),
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
      if (next.has(categoryId)) next.delete(categoryId); else next.add(categoryId);
      return next;
    });
  }, []);

  /* ──────────────────────── Select-mode helpers ──────────────────────── */

  const toggleSelectMode = () => { setIsSelectMode(!isSelectMode); setSelectedIds(new Set()); };
  const toggleSelection = (id: string) => {
    const n = new Set(selectedIds);
    if (n.has(id)) n.delete(id); else n.add(id);
    setSelectedIds(n);
  };
  const selectAll = () => {
    setSelectedIds(selectedIds.size === filteredTransactions.length ? new Set() : new Set(filteredTransactions.map(t => t.id)));
  };
  const handleMultiDelete = async () => {
    if (onDeleteMultiple && selectedIds.size > 0) {
      await onDeleteMultiple(Array.from(selectedIds));
      setSelectedIds(new Set());
      setIsSelectMode(false);
    }
    setMultiDeleteConfirm(false);
  };

  /* ──────────────────────── Bulk-category helpers ──────────────────────── */

  const openBulkCategoryModal = () => { setBulkCategory(''); setIsBulkCategoryModalOpen(true); setBulkDropdownOpen(false); setIsBulkSaving(false); };
  const closeBulkCategoryModal = () => { setIsBulkCategoryModalOpen(false); setBulkCategory(''); setBulkDropdownOpen(false); setIsBulkSaving(false); };
  const handleToggleBulkDropdown = () => {
    if (!bulkDropdownOpen && bulkCategoryButtonRef.current) {
      const rect = bulkCategoryButtonRef.current.getBoundingClientRect();
      setBulkDropdownPosition({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
    setBulkDropdownOpen(!bulkDropdownOpen);
  };

  const selectedTransactionsType = useMemo(() => {
    if (selectedIds.size === 0) return 'expense';
    const sel = transactions.filter(t => selectedIds.has(t.id));
    return sel.filter(t => t.type === 'expense').length >= sel.filter(t => t.type === 'income').length ? 'expense' : 'income';
  }, [selectedIds, transactions]);

  const bulkCategoriesList = useMemo(() => {
    if (selectedTransactionsType === 'income') return [...incomeCategories, ...customIncomeCategories];
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
    } catch { setIsBulkSaving(false); }
  };

  /* ──────────────────────── Toolbar dropdown helpers ──────────────────────── */

  const handleToggleSortDropdown = useCallback(() => {
    if (!isSortOpen && sortButtonRef.current) {
      const rect = sortButtonRef.current.getBoundingClientRect();
      setSortDropdownPos({ top: rect.bottom + 8, left: rect.left });
    }
    setIsSortOpen(prev => !prev);
  }, [isSortOpen]);

  const handleToggleCategoryFilter = useCallback(() => {
    if (!isCategoryFilterOpen && categoryFilterBtnRef.current) {
      const rect = categoryFilterBtnRef.current.getBoundingClientRect();
      setCategoryFilterPos({ top: rect.bottom + 8, left: rect.left });
    }
    setIsCategoryFilterOpen(prev => !prev);
  }, [isCategoryFilterOpen]);

  /* ──────────────────────── Computed grid class ──────────────────────── */

  const gridCols = isSelectMode ? GRID_COLS_SELECT : GRID_COLS;

  /* ──────────────────────── Row renderer (shared between flat & grouped) ──────────────────────── */

  const renderGridRow = (transaction: Transaction, isLast: boolean) => {
    const cached = categoryInfoMap.get(transaction.id);
    const catInfo = cached?.info;
    const Icon = catInfo?.icon;
    const isIncome = cached?.isIncome ?? transaction.type === 'income';
    const isSelected = selectedIds.has(transaction.id);

    const isEditingDesc = editingCell?.id === transaction.id && editingCell?.field === 'description';
    const isEditingAmt = editingCell?.id === transaction.id && editingCell?.field === 'amount';
    const isEditingDate = editingCell?.id === transaction.id && editingCell?.field === 'date';

    const iconBg = isIncome ? 'rgba(13, 186, 204, 0.1)' : 'rgba(241, 138, 181, 0.1)';
    const iconColor = isIncome ? '#0DBACC' : '#F18AB5';
    const amountColor = isIncome ? '#0DBACC' : '#F18AB5';

    return (
      <div
        key={transaction.id}
        className={cn(
          gridCols,
          'items-center group bg-white transition-colors duration-150',
          !isLast && 'border-b border-[#F7F7F8]',
          isSelected ? 'bg-indigo-50/60' : 'hover:bg-[#FAFAFA]',
        )}
      >
        {/* Checkbox (select mode) */}
        {isSelectMode && (
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={() => toggleSelection(transaction.id)}
              className={cn(
                'w-7 h-7 rounded-md flex items-center justify-center transition-colors',
                isSelected ? 'bg-[#C1DDFF]' : 'bg-[#F7F7F8] hover:bg-[#E8E8ED]',
              )}
            >
              {isSelected
                ? <CheckSquare className="w-3.5 h-3.5 text-[#69ADFF]" strokeWidth={1.75} />
                : <Square className="w-3.5 h-3.5 text-[#7E7F90]" strokeWidth={1.75} />}
            </button>
          </div>
        )}

        {/* Category cell */}
        <div
          className="px-3 py-2.5 flex items-center gap-2 min-w-0 cursor-pointer"
          onClick={(e) => { if (!isSelectMode) startCategoryEdit(transaction, e); }}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: iconBg }}
          >
            {Icon && <Icon className="w-3.5 h-3.5" style={{ color: iconColor }} strokeWidth={1.5} />}
          </div>
          <SensitiveData
            as="span"
            className="text-sm font-medium truncate"
            style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif', color: '#303150' }}
          >
            {catInfo?.nameHe || transaction.category}
          </SensitiveData>
        </div>

        {/* Description cell */}
        <div className="px-3 py-2.5 min-w-0">
          {isEditingDesc ? (
            <div className="relative">
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => saveCellEdit(transaction)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveCellEdit(transaction);
                  if (e.key === 'Escape') cancelCellEdit();
                }}
                autoFocus
                disabled={cellSaving}
                className="w-full px-2 py-1 text-sm rounded-lg outline-none transition-all"
                style={{
                  fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                  color: '#303150',
                  border: '1.5px solid #69ADFF',
                  boxShadow: '0 0 0 3px rgba(105, 173, 255, 0.15)',
                  opacity: cellSaving ? 0.6 : 1,
                  cursor: cellSaving ? 'wait' : 'text',
                }}
              />
              {cellSaving && (
                <div className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Loader2 className="w-3 h-3 animate-spin" style={{ color: '#69ADFF' }} strokeWidth={2} />
                </div>
              )}
            </div>
          ) : (
            <SensitiveData
              as="p"
              className="text-sm truncate cursor-pointer hover:text-[#69ADFF] transition-colors"
              style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif', color: '#7E7F90' }}
              onClick={() => { if (!isSelectMode) startCellEdit(transaction, 'description'); }}
            >
              {transaction.description}
            </SensitiveData>
          )}
        </div>

        {/* Date cell */}
        <div className="px-3 py-2.5">
          {isEditingDate ? (
            <div className="relative">
              <input
                type="date"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => saveCellEdit(transaction)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveCellEdit(transaction);
                  if (e.key === 'Escape') cancelCellEdit();
                }}
                autoFocus
                disabled={cellSaving}
                className="w-full px-1.5 py-1 text-xs rounded-lg outline-none transition-all"
                style={{
                  fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                  color: '#303150',
                  border: '1.5px solid #69ADFF',
                  boxShadow: '0 0 0 3px rgba(105, 173, 255, 0.15)',
                  opacity: cellSaving ? 0.6 : 1,
                  cursor: cellSaving ? 'wait' : 'text',
                }}
              />
              {cellSaving && (
                <div className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Loader2 className="w-3 h-3 animate-spin" style={{ color: '#69ADFF' }} strokeWidth={2} />
                </div>
              )}
            </div>
          ) : (
            <span
              className="text-xs whitespace-nowrap cursor-pointer hover:text-[#69ADFF] transition-colors"
              style={{ color: '#BDBDCB' }}
              onClick={() => { if (!isSelectMode) startCellEdit(transaction, 'date'); }}
            >
              {formatDate(transaction.date)}
            </span>
          )}
        </div>

        {/* Amount cell */}
        <div className="px-3 py-2.5">
          {isEditingAmt ? (
            <div className="relative">
              <input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => saveCellEdit(transaction)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveCellEdit(transaction);
                  if (e.key === 'Escape') cancelCellEdit();
                }}
                autoFocus
                disabled={cellSaving}
                min="0"
                step="0.01"
                className="w-full px-2 py-1 text-sm rounded-lg outline-none transition-all"
                style={{
                  fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                  color: '#303150',
                  border: '1.5px solid #69ADFF',
                  boxShadow: '0 0 0 3px rgba(105, 173, 255, 0.15)',
                  opacity: cellSaving ? 0.6 : 1,
                  cursor: cellSaving ? 'wait' : 'text',
                }}
                dir="ltr"
              />
              {cellSaving && (
                <div className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Loader2 className="w-3 h-3 animate-spin" style={{ color: '#69ADFF' }} strokeWidth={2} />
                </div>
              )}
            </div>
          ) : (
            <SensitiveData
              as="span"
              className="text-sm font-semibold cursor-pointer whitespace-nowrap hover:opacity-75 transition-opacity"
              style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif', color: amountColor }}
              dir="ltr"
              onClick={() => { if (!isSelectMode) startCellEdit(transaction, 'amount'); }}
            >
              {`${isIncome ? '+' : '-'}${formatCurrencyAmount(transaction.amount, transaction.currency || 'ILS')}`}
            </SensitiveData>
          )}
        </div>

        {/* Actions cell */}
        <div className="flex items-center justify-center">
          {!isSelectMode && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteConfirm({ isOpen: true, id: transaction.id, description: transaction.description });
              }}
              className="p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
              aria-label={`מחק עסקה: ${transaction.description}`}
            >
              <Trash2 className="w-3 h-3 text-[#BDBDCB] hover:text-red-500 transition-colors" strokeWidth={1.5} />
            </button>
          )}
        </div>
      </div>
    );
  };

  /* ══════════════════════════════ RENDER ══════════════════════════════ */

  return (
    <div className="h-full flex flex-col">
      {/* ── Header ── */}
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
              style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif', color: '#303150' }}
            >
              עסקאות שוטפות
            </h3>
            <p className="text-xs font-medium" style={{ color: '#F18AB5' }}>
              {hasActiveFilters
                ? `${filteredTransactions.length} מתוך ${transactions.length} עסקאות`
                : `${transactions.length} עסקאות`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isSelectMode ? (
            <>
              <button onClick={selectAll} className="text-sm font-medium flex items-center gap-1 hover:opacity-80 transition-opacity" style={{ color: '#7E7F90' }}>
                {selectedIds.size === filteredTransactions.length ? <CheckSquare className="w-4 h-4" strokeWidth={1.5} /> : <Square className="w-4 h-4" strokeWidth={1.5} />}
                {selectedIds.size === filteredTransactions.length ? 'בטל הכל' : 'בחר הכל'}
              </button>
              <button onClick={toggleSelectMode} className="text-sm font-medium flex items-center gap-1 hover:opacity-80 transition-opacity" style={{ color: '#7E7F90' }}>
                <X className="w-4 h-4" strokeWidth={1.5} />
                ביטול
              </button>
            </>
          ) : (
            <>
              {transactions.length > 0 && onDeleteMultiple && (
                <button onClick={toggleSelectMode} className="text-sm font-medium flex items-center gap-1 hover:opacity-80 transition-opacity" style={{ color: '#7E7F90' }}>
                  בחירה
                  <CheckSquare className="w-4 h-4" strokeWidth={1.5} />
                </button>
              )}
              {onOpenMaaserCalculator && (
                <button onClick={onOpenMaaserCalculator} className="text-sm font-medium flex items-center gap-1 hover:opacity-80 transition-opacity" style={{ color: '#7E7F90' }}>
                  מעשרות
                  <Calculator className="w-4 h-4" strokeWidth={1.5} />
                </button>
              )}
              <button onClick={() => setIsExportModalOpen(true)} className="text-sm font-medium flex items-center gap-1 hover:opacity-80 transition-opacity" style={{ color: '#7E7F90' }}>
                ייצוא
                <FileSpreadsheet className="w-4 h-4" strokeWidth={1.5} />
              </button>
              <button id="btn-import-transactions" onClick={onImport} className="text-sm font-medium flex items-center gap-1 hover:opacity-80 transition-opacity" style={{ color: '#7E7F90' }}>
                ייבוא
                <Upload className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Search & Filter Toolbar ── */}
      {transactions.length > 0 && (
        <div className="mb-3 flex-shrink-0 space-y-2">
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative flex-1 min-w-0">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#BDBDCB' }} strokeWidth={1.75} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="חיפוש לפי שם עסק..."
                dir="rtl"
                aria-label="חיפוש לפי שם עסק"
                className="w-full pr-10 pl-9 py-2.5 bg-white rounded-xl text-sm transition-all outline-none"
                style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif', color: '#303150', border: '1px solid #E8E8ED' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#69ADFF'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(105, 173, 255, 0.2)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#E8E8ED'; e.currentTarget.style.boxShadow = 'none'; }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute left-3 top-1/2 -translate-y-1/2 p-0.5 rounded-md hover:bg-[#F7F7F8] transition-colors" style={{ color: '#7E7F90' }} aria-label="נקה חיפוש">
                  <X className="w-4 h-4" strokeWidth={2} />
                </button>
              )}
            </div>

            {/* Category Filter Toggle */}
            <button
              ref={categoryFilterBtnRef}
              onClick={handleToggleCategoryFilter}
              className={cn('p-2.5 rounded-xl transition-all relative', 'hover:scale-[1.05] active:scale-[0.95]')}
              style={{
                border: isCategoryFilterOpen || selectedCategories.size > 0 ? '1px solid #69ADFF' : '1px solid #E8E8ED',
                backgroundColor: selectedCategories.size > 0 ? 'rgba(105, 173, 255, 0.08)' : '#FFFFFF',
              }}
              aria-label="סינון לפי קטגוריה"
              aria-expanded={isCategoryFilterOpen}
            >
              <SlidersHorizontal className="w-4 h-4" style={{ color: selectedCategories.size > 0 ? '#69ADFF' : '#7E7F90' }} strokeWidth={1.75} />
              {selectedCategories.size > 0 && (
                <span className="absolute -top-1.5 -left-1.5 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: '#69ADFF', color: '#FFFFFF', minWidth: '18px', height: '18px', lineHeight: '18px' }}>
                  {selectedCategories.size}
                </span>
              )}
            </button>

            {/* Sort Toggle */}
            <button
              ref={sortButtonRef}
              onClick={handleToggleSortDropdown}
              className={cn('p-2.5 rounded-xl transition-all flex items-center gap-1.5', 'hover:scale-[1.05] active:scale-[0.95]')}
              style={{
                border: isSortOpen ? '1px solid #69ADFF' : '1px solid #E8E8ED',
                backgroundColor: sortBy !== 'date' ? 'rgba(105, 173, 255, 0.08)' : '#FFFFFF',
              }}
              aria-label="מיון עסקאות"
              aria-expanded={isSortOpen}
            >
              <ArrowUpDown className="w-4 h-4" style={{ color: sortBy !== 'date' ? '#69ADFF' : '#7E7F90' }} strokeWidth={1.75} />
              {sortBy !== 'date' && (
                <span className="text-xs font-medium" style={{ color: '#69ADFF', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}>
                  {SORT_LABELS[sortBy]}
                </span>
              )}
            </button>
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
                  <motion.div layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ backgroundColor: 'rgba(105, 173, 255, 0.1)', border: '1px solid rgba(105, 173, 255, 0.25)' }}>
                    <span className="text-xs font-medium" style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif', color: '#303150' }}>{selectedCategoryName}</span>
                    <button onClick={onClearCategoryFilter} className="p-0.5 rounded hover:bg-[#E8E8ED] transition-colors" style={{ color: '#7E7F90' }} aria-label={`הסר סינון ${selectedCategoryName}`}>
                      <X className="w-3 h-3" strokeWidth={2.5} />
                    </button>
                  </motion.div>
                )}
                {Array.from(selectedCategories).map(catId => {
                  const catInfo = getCategoryInfo(catId, 'expense', customExpenseCategories) || getCategoryInfo(catId, 'income', customIncomeCategories);
                  return (
                    <motion.div key={catId} layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ backgroundColor: 'rgba(105, 173, 255, 0.1)', border: '1px solid rgba(105, 173, 255, 0.25)' }}>
                      <span className="text-xs font-medium" style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif', color: '#303150' }}>{catInfo?.nameHe || catId}</span>
                      <button onClick={() => toggleCategoryFilter(catId)} className="p-0.5 rounded hover:bg-[#E8E8ED] transition-colors" style={{ color: '#7E7F90' }} aria-label={`הסר סינון ${catInfo?.nameHe || catId}`}>
                        <X className="w-3 h-3" strokeWidth={2.5} />
                      </button>
                    </motion.div>
                  );
                })}
                {hasActiveFilters && (selectedCategories.size + (selectedCategory ? 1 : 0)) > 1 && (
                  <motion.button layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} onClick={clearAllFilters} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors hover:opacity-80" style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif', color: '#F18AB5', backgroundColor: 'rgba(241, 138, 181, 0.08)' }}>
                    נקה הכל
                    <X className="w-3 h-3" strokeWidth={2.5} />
                  </motion.button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── Grid Table ── */}
      <div className="flex-1 min-h-0 flex flex-col">
        {/* Grid Header */}
        {(filteredTransactions.length > 0 || isQuickAddActive) && (
          <div
            className={cn(gridCols, 'items-center bg-[#FAFAFA] border-b border-[#E8E8ED] flex-shrink-0 rounded-t-xl')}
            style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
          >
            {isSelectMode && (
              <div className="flex items-center justify-center">
                <button type="button" onClick={selectAll} className="p-1 rounded hover:bg-[#E8E8ED] transition-colors">
                  {selectedIds.size === filteredTransactions.length
                    ? <CheckSquare className="w-4 h-4 text-[#69ADFF]" strokeWidth={1.75} />
                    : <Square className="w-4 h-4 text-[#BDBDCB]" strokeWidth={1.75} />}
                </button>
              </div>
            )}
            <div className="px-3 py-2.5 text-xs font-semibold" style={{ color: '#7E7F90' }}>קטגוריה</div>
            <div className="px-3 py-2.5 text-xs font-semibold" style={{ color: '#7E7F90' }}>תיאור</div>
            <div className="px-3 py-2.5 text-xs font-semibold" style={{ color: '#7E7F90' }}>תאריך</div>
            <div className="px-3 py-2.5 text-xs font-semibold" style={{ color: '#7E7F90' }}>סכום</div>
            <div />
          </div>
        )}

        {/* Quick-Add Row (above scrollable rows) */}
        {!isSelectMode && (
          <div className={cn('border-b border-dashed border-[#E8E8ED] flex-shrink-0', isQuickAddActive ? '' : 'hover:bg-[#FAFAFA] transition-colors')}>
            {isQuickAddActive ? (
              <div className={cn(gridCols, 'items-center bg-[#F9FBFF]')}>
                {/* Type + Category */}
                <div className="px-3 py-2 space-y-1">
                  <button
                    ref={quickAddTypeButtonRef}
                    type="button"
                    onClick={() => {
                      if (quickAddTypeButtonRef.current) {
                        const rect = quickAddTypeButtonRef.current.getBoundingClientRect();
                        setQuickAddTypeDropdownPos({ top: rect.bottom + 4, left: rect.left });
                      }
                      setIsQuickAddTypeOpen(prev => !prev);
                    }}
                    className="w-full px-2 py-1 text-[11px] rounded-lg border border-[#E8E8ED] bg-white outline-none focus:border-[#69ADFF] flex items-center justify-between gap-1"
                    style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif', color: '#303150' }}
                    disabled={quickAddSaving}
                  >
                    <span className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: quickAddValues.type === 'income' ? '#0DBACC' : '#F18AB5' }}
                      />
                      {quickAddValues.type === 'income' ? 'הכנסה' : 'הוצאה'}
                    </span>
                    <ChevronDown className="w-3 h-3 flex-shrink-0" style={{ color: '#BDBDCB' }} strokeWidth={2} />
                  </button>
                  <button
                    ref={quickAddCategoryButtonRef}
                    type="button"
                    onClick={() => {
                      if (quickAddCategoryButtonRef.current) {
                        const rect = quickAddCategoryButtonRef.current.getBoundingClientRect();
                        setQuickAddCatDropdownPos({ top: rect.bottom + 4, left: rect.left });
                      }
                      setIsQuickAddCategoryOpen(prev => !prev);
                    }}
                    className="w-full px-2 py-1 text-[11px] rounded-lg border border-[#E8E8ED] bg-white outline-none focus:border-[#69ADFF] flex items-center justify-between gap-1 truncate"
                    style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif', color: quickAddValues.category ? '#303150' : '#BDBDCB' }}
                    disabled={quickAddSaving}
                  >
                    <span className="truncate">
                      {quickAddValues.category
                        ? getCategoryInfo(quickAddValues.category, quickAddValues.type, quickAddValues.type === 'income' ? customIncomeCategories : customExpenseCategories)?.nameHe || 'בחר קטגוריה'
                        : 'קטגוריה'}
                    </span>
                    <ChevronDown className="w-3 h-3 flex-shrink-0" strokeWidth={2} />
                  </button>
                </div>

                {/* Description input */}
                <div className="px-3 py-2">
                  <input
                    ref={quickAddDescRef}
                    type="text"
                    value={quickAddValues.description}
                    onChange={(e) => setQuickAddValues(v => ({ ...v, description: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleQuickAddSave();
                      if (e.key === 'Escape') resetQuickAdd();
                    }}
                    placeholder="תיאור עסקה..."
                    disabled={quickAddSaving}
                    className="w-full px-2 py-1.5 text-sm rounded-lg border border-[#E8E8ED] bg-white outline-none focus:border-[#69ADFF] transition-colors placeholder:text-[#BDBDCB]"
                    style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif', color: '#303150' }}
                    dir="rtl"
                  />
                </div>

                {/* Date input */}
                <div className="px-3 py-2">
                  <input
                    type="date"
                    value={quickAddValues.date}
                    onChange={(e) => setQuickAddValues(v => ({ ...v, date: e.target.value }))}
                    disabled={quickAddSaving}
                    className="w-full px-1.5 py-1.5 text-xs rounded-lg border border-[#E8E8ED] bg-white outline-none focus:border-[#69ADFF] transition-colors"
                    style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif', color: '#303150' }}
                  />
                </div>

                {/* Amount input */}
                <div className="px-3 py-2">
                  <input
                    type="number"
                    value={quickAddValues.amount}
                    onChange={(e) => setQuickAddValues(v => ({ ...v, amount: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleQuickAddSave();
                      if (e.key === 'Escape') resetQuickAdd();
                    }}
                    placeholder="0"
                    min="0"
                    step="0.01"
                    disabled={quickAddSaving}
                    className="w-full px-2 py-1.5 text-sm rounded-lg border border-[#E8E8ED] bg-white outline-none focus:border-[#69ADFF] transition-colors"
                    style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif', color: '#303150' }}
                    dir="ltr"
                  />
                </div>

                {/* Action: confirm / cancel */}
                <div className="flex items-center justify-center gap-0.5">
                  {quickAddSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#69ADFF]" />
                  ) : (
                    <>
                      <button onClick={handleQuickAddSave} className="p-1 rounded hover:bg-emerald-50 transition-colors" aria-label="שמור">
                        <Check className="w-3.5 h-3.5 text-emerald-500" strokeWidth={2} />
                      </button>
                      <button onClick={resetQuickAdd} className="p-1 rounded hover:bg-red-50 transition-colors" aria-label="בטל">
                        <X className="w-3.5 h-3.5 text-[#BDBDCB]" strokeWidth={2} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onSaveTransaction ? setIsQuickAddActive(true) : onNewTransaction()}
                className="w-full px-4 py-2.5 text-sm font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
                style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif', color: '#69ADFF' }}
              >
                <Plus className="w-4 h-4" strokeWidth={1.75} />
                הוסף עסקה
              </button>
            )}
          </div>
        )}

        {/* Scrollable rows */}
        <div className="overflow-y-auto flex-1 min-h-0 scrollbar-transactions scrollbar-edge-left scrollbar-fade-bottom">
          {/* Grouped by category */}
          {sortBy === 'category' && groupedByCategory.length > 0 && (
            <div>
              {groupedByCategory.map((group) => {
                const CatIcon = group.info?.icon;
                const isExpanded = expandedCategories.has(group.categoryId);
                const hasExpense = group.transactions.some(t => t.type === 'expense');
                const hasIncome = group.transactions.some(t => t.type === 'income');
                const accentColor = hasIncome && !hasExpense ? '#0DBACC' : '#F18AB5';
                const accentBg = hasIncome && !hasExpense ? 'rgba(13, 186, 204, 0.08)' : 'rgba(241, 138, 181, 0.08)';

                return (
                  <div key={group.categoryId}>
                    <button
                      type="button"
                      onClick={() => toggleCategoryExpanded(group.categoryId)}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-[#FAFAFA] border-b border-[#E8E8ED] transition-colors hover:bg-[#F0F0F2] cursor-pointer"
                      aria-expanded={isExpanded}
                    >
                      <ChevronLeft
                        className="w-4 h-4 flex-shrink-0 transition-transform duration-300"
                        style={{ color: isExpanded ? '#69ADFF' : '#BDBDCB', transform: isExpanded ? 'rotate(-90deg)' : 'rotate(0deg)' }}
                        strokeWidth={2}
                      />
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: group.info?.bgColor || '#F7F7F8' }}>
                        {CatIcon && <CatIcon className="w-4 h-4" style={{ color: group.info?.color || '#7E7F90' }} strokeWidth={1.5} />}
                      </div>
                      <span className="flex-1 text-right text-sm font-semibold" style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif', color: '#303150' }}>
                        {group.info?.nameHe || group.categoryId}
                      </span>
                      <span className="text-xs" style={{ color: '#BDBDCB' }}>{group.transactions.length} עסקאות</span>
                      <SensitiveData as="span" className="text-sm font-bold px-2.5 py-1 rounded-lg" style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif', color: accentColor, backgroundColor: accentBg }} dir="ltr">
                        {formatCurrency(Math.abs(group.total))}
                      </SensitiveData>
                    </button>

                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ type: 'spring', stiffness: 350, damping: 35 }}
                          className="overflow-hidden"
                        >
                          {group.transactions.map((tx, idx) => renderGridRow(tx, idx === group.transactions.length - 1))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}

          {/* Flat list (date / amount sort) */}
          {sortBy !== 'category' && filteredTransactions.map((tx, idx) => renderGridRow(tx, idx === filteredTransactions.length - 1))}

          {/* Empty States */}
          {transactions.length === 0 && !hasActiveFilters && (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm" style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif', color: '#7E7F90' }}>
                אין עסקאות להצגה
              </p>
            </div>
          )}
          {filteredTransactions.length === 0 && transactions.length > 0 && hasActiveFilters && (
            <div className="text-center py-8">
              <Filter className="w-8 h-8 mx-auto mb-2" style={{ color: '#BDBDCB' }} strokeWidth={1.5} />
              <p className="text-sm font-medium mb-1" style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif', color: '#7E7F90' }}>
                לא נמצאו עסקאות תואמות
              </p>
              <p className="text-xs mb-3" style={{ color: '#BDBDCB' }}>
                {debouncedSearchQuery && `חיפוש: "${debouncedSearchQuery}"`}
                {debouncedSearchQuery && selectedCategories.size > 0 && ' · '}
                {selectedCategories.size > 0 && `${selectedCategories.size} קטגוריות נבחרו`}
              </p>
              <button onClick={clearAllFilters} className="text-xs font-medium transition-colors hover:opacity-80" style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif', color: '#69ADFF' }}>
                נקה את כל הסינונים
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Floating Action Bar (Select Mode) ── */}
      <AnimatePresence>
        {isSelectMode && selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="sticky bottom-0 mt-4 p-3 rounded-xl shadow-lg flex items-center justify-between"
            style={{ background: 'linear-gradient(135deg, #303150 0%, #3D3E68 100%)', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)' }}
            dir="rtl"
          >
            <span className="text-sm font-semibold" style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif', color: '#FFFFFF' }}>
              {selectedIds.size} נבחרו
            </span>
            <div className="flex items-center gap-2">
              {onBulkUpdateCategory && (
                <button onClick={openBulkCategoryModal} className="px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]" style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif', backgroundColor: '#69ADFF', color: '#FFFFFF' }}>
                  <Tag className="w-4 h-4" strokeWidth={1.75} />
                  קטגוריה
                </button>
              )}
              <button onClick={() => setMultiDeleteConfirm(true)} className="px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]" style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif', backgroundColor: '#F18AB5', color: '#FFFFFF' }}>
                <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                מחק
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Confirm Dialogs ── */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: '', description: '' })}
        onConfirm={() => onDelete(deleteConfirm.id)}
        title="מחיקת עסקה"
        message={`האם אתה בטוח שברצונך למחוק את העסקה "${deleteConfirm.description}"?`}
      />
      <ConfirmDialog
        isOpen={multiDeleteConfirm}
        onClose={() => setMultiDeleteConfirm(false)}
        onConfirm={handleMultiDelete}
        title="מחיקת עסקאות"
        message={`האם אתה בטוח שברצונך למחוק ${selectedIds.size} עסקאות?`}
      />

      {/* ══════════ Portal-based Dropdowns ══════════ */}

      {/* Category Filter Dropdown (portal) */}
      {isCategoryFilterOpen && categoryFilterPos && createPortal(
        <div
          ref={categoryFilterRef}
          className="fixed rounded-2xl overflow-hidden"
          style={{
            top: categoryFilterPos.top,
            left: categoryFilterPos.left,
            width: 280,
            zIndex: 10000,
            backgroundColor: '#FFFFFF',
            border: '1px solid #E8E8ED',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          }}
          dir="rtl"
        >
          <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #F7F7F8' }}>
            <span className="text-sm font-semibold" style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif', color: '#303150' }}>סינון לפי קטגוריה</span>
            {selectedCategories.size > 0 && (
              <button onClick={() => setSelectedCategories(new Set())} className="text-xs font-medium transition-colors hover:opacity-80" style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif', color: '#69ADFF' }}>נקה הכל</button>
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
                  className={cn('w-full px-3 py-2 rounded-xl text-sm transition-all flex items-center gap-2.5', 'hover:scale-[1.01] active:scale-[0.99]')}
                  style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif', backgroundColor: isActive ? 'rgba(105, 173, 255, 0.1)' : 'transparent', color: '#303150' }}
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: info?.bgColor || '#F7F7F8', color: info?.color || '#7E7F90' }}>
                    {CatIcon && <CatIcon className="w-3.5 h-3.5" strokeWidth={1.75} />}
                  </div>
                  <span className="flex-1 text-right font-medium truncate">{info?.nameHe || id}</span>
                  <span className="text-xs flex-shrink-0" style={{ color: '#BDBDCB' }}>{count}</span>
                  <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-colors" style={{ border: isActive ? 'none' : '1.5px solid #E8E8ED', backgroundColor: isActive ? '#69ADFF' : 'transparent' }}>
                    {isActive && <Check className="w-3 h-3 text-white" strokeWidth={2.5} />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>,
        document.body,
      )}

      {/* Sort Dropdown (portal) */}
      {isSortOpen && sortDropdownPos && createPortal(
        <div
          ref={sortDropdownRef}
          className="fixed rounded-xl overflow-hidden"
          style={{
            top: sortDropdownPos.top,
            left: sortDropdownPos.left,
            minWidth: 160,
            zIndex: 10000,
            backgroundColor: '#FFFFFF',
            border: '1px solid #E8E8ED',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          }}
          dir="rtl"
        >
          {(['date', 'category', 'amount'] as SortOption[]).map((option) => (
            <button
              key={option}
              onClick={() => { setSortBy(option); setIsSortOpen(false); }}
              className="w-full px-4 py-2.5 text-right text-sm transition-colors first:rounded-t-xl last:rounded-b-xl"
              style={{
                fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                color: sortBy === option ? '#69ADFF' : '#303150',
                fontWeight: sortBy === option ? 600 : 400,
                backgroundColor: sortBy === option ? 'rgba(105, 173, 255, 0.06)' : 'transparent',
              }}
              onMouseEnter={(e) => { if (sortBy !== option) e.currentTarget.style.backgroundColor = '#F7F7F8'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = sortBy === option ? 'rgba(105, 173, 255, 0.06)' : 'transparent'; }}
            >
              {SORT_LABELS[option]}
            </button>
          ))}
        </div>,
        document.body,
      )}

      {/* Inline Category Dropdown (portal) */}
      {categoryEditTarget && createPortal(
        (() => {
          const allCats = getCategoriesForType(categoryEditTarget.transaction.type);
          const filtered = filterCategoriesBySearch(allCats, categorySearchQuery);
          return (
            <div
              ref={inlineCatDropdownRef}
              className="fixed rounded-xl shadow-lg"
              style={{
                top: categoryEditTarget.position.top,
                left: categoryEditTarget.position.left,
                minWidth: 280,
                maxWidth: 320,
                zIndex: 10000,
                backgroundColor: '#FFFFFF',
                border: '1px solid #E8E8ED',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.12)',
                maxHeight: '400px',
                display: 'flex',
                flexDirection: 'column',
              }}
              dir="rtl"
            >
              {/* Search */}
              <div className="p-2 flex-shrink-0" style={{ borderBottom: '1px solid #F7F7F8' }}>
                <div className="relative">
                  <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: '#BDBDCB' }} strokeWidth={1.75} />
                  <input
                    ref={categorySearchInputRef}
                    type="text"
                    value={categorySearchQuery}
                    onChange={(e) => setCategorySearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setCategoryEditTarget(null);
                      } else if (e.key === 'Enter' && filtered.length === 1) {
                        handleCategorySelected(filtered[0].id);
                      }
                    }}
                    placeholder="חפש קטגוריה..."
                    className="w-full pe-8 ps-3 py-2 rounded-lg text-sm outline-none transition-colors"
                    style={{
                      fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                      color: '#303150',
                      border: '1.5px solid #E8E8ED',
                      backgroundColor: '#FAFAFA',
                    }}
                    onFocus={(e) => { e.target.style.borderColor = '#69ADFF'; e.target.style.backgroundColor = '#FFFFFF'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#E8E8ED'; e.target.style.backgroundColor = '#FAFAFA'; }}
                  />
                </div>
              </div>

              {/* Add New Category - Always Visible, Above List */}
              {onAddCategory && (
                <div className="flex-shrink-0 p-2" style={{ borderBottom: '1px solid #F7F7F8' }}>
                  <div className="relative flex items-center gap-1.5">
                    <div className="relative flex-1">
                      <Plus className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: '#BDBDCB' }} strokeWidth={1.75} />
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newCategoryName.trim()) {
                            handleAddNewCategory();
                          } else if (e.key === 'Escape') {
                            setNewCategoryName('');
                          }
                        }}
                        placeholder="הוסף קטגוריה חדשה..."
                        disabled={addingCategorySaving}
                        className="w-full pe-8 ps-3 py-2 rounded-lg text-sm outline-none transition-colors"
                        style={{
                          fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                          color: '#303150',
                          border: '1.5px solid #E8E8ED',
                          backgroundColor: '#FAFAFA',
                          opacity: addingCategorySaving ? 0.6 : 1,
                          cursor: addingCategorySaving ? 'wait' : 'text',
                        }}
                        onFocus={(e) => { e.target.style.borderColor = '#69ADFF'; e.target.style.backgroundColor = '#FFFFFF'; }}
                        onBlur={(e) => { e.target.style.borderColor = '#E8E8ED'; e.target.style.backgroundColor = '#FAFAFA'; }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => { if (newCategoryName.trim()) handleAddNewCategory(); }}
                      disabled={!newCategoryName.trim() || addingCategorySaving}
                      className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                      style={{
                        backgroundColor: newCategoryName.trim() ? '#69ADFF' : '#F0F0F4',
                        color: newCategoryName.trim() ? '#FFFFFF' : '#BDBDCB',
                        cursor: !newCategoryName.trim() || addingCategorySaving ? 'default' : 'pointer',
                        opacity: addingCategorySaving ? 0.6 : 1,
                      }}
                    >
                      {addingCategorySaving ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2} />
                      ) : (
                        <Plus className="w-4 h-4" strokeWidth={2} />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Categories List */}
              <div className="overflow-y-auto scrollbar-ghost flex-1" style={{ maxHeight: '280px' }}>
                <div className="p-1.5">
                  {filtered.length === 0 ? (
                    <div className="px-3 py-4 text-center text-sm" style={{ color: '#7E7F90', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}>
                      לא נמצאו קטגוריות
                    </div>
                  ) : (
                    filtered.map((cat) => {
                      const isCurrentCat = cat.id === categoryEditTarget.transaction.category;
                      const CatIcon = cat.icon;
                      return (
                        <div key={cat.id} className="group relative">
                          <button
                            type="button"
                            onClick={() => handleCategorySelected(cat.id)}
                            className={cn('w-full px-3 py-2 rounded-lg text-sm text-right flex items-center gap-2 transition-colors', isCurrentCat ? 'bg-[#C1DDFF]/40' : 'hover:bg-[#F7F7F8]')}
                            style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif', color: '#303150' }}
                          >
                            <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: cat.bgColor, color: cat.color }}>
                              {CatIcon && <CatIcon className="w-3 h-3" strokeWidth={1.75} />}
                            </div>
                            <span className="flex-1 text-right font-medium">{cat.nameHe}</span>
                            {isCurrentCat && <Check className="w-4 h-4 text-[#69ADFF]" strokeWidth={2} />}
                          </button>
                          {cat.isCustom && onDeleteCategory && (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteCategoryInline(cat.id, e)}
                              className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50"
                              style={{ color: '#F18AB5' }}
                              title="מחק קטגוריה"
                            >
                              <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          );
        })(),
        document.body,
      )}

      {/* Quick-Add Category Dropdown (portal) */}
      {isQuickAddCategoryOpen && quickAddCatDropdownPos && createPortal(
        <div
          ref={quickAddCategoryDropdownRef}
          className="fixed rounded-xl shadow-lg max-h-64 overflow-y-auto scrollbar-ghost"
          style={{
            top: quickAddCatDropdownPos.top,
            left: quickAddCatDropdownPos.left,
            minWidth: 220,
            zIndex: 10000,
            backgroundColor: '#FFFFFF',
            border: '1px solid #E8E8ED',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.12)',
          }}
          dir="rtl"
        >
          <div className="p-1.5">
            {getCategoriesForType(quickAddValues.type).map((cat) => {
              const isCurrentCat = cat.id === quickAddValues.category;
              const CatIcon = cat.icon;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setQuickAddValues(v => ({ ...v, category: cat.id }));
                    setIsQuickAddCategoryOpen(false);
                  }}
                  className={cn('w-full px-3 py-2 rounded-lg text-sm text-right flex items-center gap-2 transition-colors', isCurrentCat ? 'bg-[#C1DDFF]/40' : 'hover:bg-[#F7F7F8]')}
                  style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif', color: '#303150' }}
                >
                  <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: cat.bgColor, color: cat.color }}>
                    {CatIcon && <CatIcon className="w-3 h-3" strokeWidth={1.75} />}
                  </div>
                  <span className="flex-1 text-right font-medium">{cat.nameHe}</span>
                  {isCurrentCat && <Check className="w-4 h-4 text-[#69ADFF]" strokeWidth={2} />}
                </button>
              );
            })}
          </div>
        </div>,
        document.body,
      )}

      {/* Quick-Add Type Dropdown (portal) */}
      {isQuickAddTypeOpen && quickAddTypeDropdownPos && createPortal(
        <div
          ref={quickAddTypeDropdownRef}
          className="fixed rounded-xl shadow-lg overflow-hidden"
          style={{
            top: quickAddTypeDropdownPos.top,
            left: quickAddTypeDropdownPos.left,
            minWidth: 140,
            zIndex: 10000,
            backgroundColor: '#FFFFFF',
            border: '1px solid #E8E8ED',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.12)',
          }}
          dir="rtl"
        >
          <div className="p-1.5">
            {([
              { value: 'expense' as const, label: 'הוצאה', color: '#F18AB5' },
              { value: 'income' as const, label: 'הכנסה', color: '#0DBACC' },
            ]).map((opt) => {
              const isActive = quickAddValues.type === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setQuickAddValues(v => ({ ...v, type: opt.value, category: '' }));
                    setIsQuickAddTypeOpen(false);
                  }}
                  className={cn('w-full px-3 py-2 rounded-lg text-sm text-right flex items-center gap-2.5 transition-colors', isActive ? 'bg-[#F7F7F8]' : 'hover:bg-[#F7F7F8]')}
                  style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif', color: '#303150' }}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: opt.color }}
                  />
                  <span className="flex-1 text-right font-medium">{opt.label}</span>
                  {isActive && <Check className="w-4 h-4 text-[#69ADFF]" strokeWidth={2} />}
                </button>
              );
            })}
          </div>
        </div>,
        document.body,
      )}

      {/* Category Save-Behavior Popover (portal) */}
      {categorySavePopover && createPortal(
        <div
          ref={savePopoverRef}
          className="fixed rounded-2xl shadow-xl"
          style={{
            top: categorySavePopover.position.top,
            left: categorySavePopover.position.left,
            width: 280,
            zIndex: 10001,
            backgroundColor: '#FFFFFF',
            border: '1px solid #E8E8ED',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
          }}
          dir="rtl"
        >
          <div className="p-4 space-y-3">
            <p className="text-sm font-semibold" style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif', color: '#303150' }}>
              שמירת הקטגוריה
            </p>

            <div className="space-y-1.5">
              {([
                { value: 'once' as const, label: 'רק הפעם', desc: 'העדכון יחול רק על עסקה זו' },
                { value: 'always' as const, label: 'זכור לפעמים הבאות', desc: 'עסקאות עתידיות יסווגו אוטומטית. גם בייבוא קבצים, בית העסק יסווג אוטומטית לקטגוריה זו' },
                { value: 'alwaysAsk' as const, label: 'תמיד תשאל אותי', desc: 'לעסקים גנריים כמו ביט, PayBox' },
              ] as const).map(opt => (
                <label
                  key={opt.value}
                  className={cn('flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all', popoverSaveBehavior === opt.value ? 'border-[#69ADFF] bg-[#C1DDFF]/20' : 'border-[#F7F7F8] hover:border-[#E8E8ED]')}
                >
                  <input
                    type="radio"
                    name="popoverSaveBehavior"
                    value={opt.value}
                    checked={popoverSaveBehavior === opt.value}
                    onChange={() => setPopoverSaveBehavior(opt.value)}
                    className="mt-0.5 w-3.5 h-3.5 text-[#69ADFF] focus:ring-[#69ADFF]"
                    disabled={popoverSaving}
                  />
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#303150' }}>{opt.label}</p>
                    <p className="text-[11px]" style={{ color: '#BDBDCB' }}>{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-2 border-t border-[#F7F7F8]">
              <input
                type="checkbox"
                checked={popoverUpdateExisting}
                onChange={(e) => setPopoverUpdateExisting(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-[#69ADFF] focus:ring-[#69ADFF]"
                disabled={popoverSaving}
              />
              <span className="text-xs font-medium" style={{ color: '#7E7F90' }}>עדכן עסקאות קיימות מאותו עסק</span>
            </label>

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleConfirmCategoryChange}
                disabled={popoverSaving}
                className="flex-1 py-2 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1.5 hover:shadow-md disabled:opacity-50"
                style={{ backgroundColor: '#69ADFF', color: '#FFFFFF' }}
              >
                {popoverSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                {popoverSaving ? 'שומר...' : 'שמור'}
              </button>
              <button
                onClick={() => setCategorySavePopover(null)}
                disabled={popoverSaving}
                className="flex-1 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                style={{ backgroundColor: '#F7F7F8', color: '#303150' }}
              >
                ביטול
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* ── Bulk Category Edit Modal (portal) ── */}
      {isBulkCategoryModalOpen && createPortal(
        <div
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ zIndex: 9999, backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)' }}
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
            onKeyDown={(e) => { if (e.key === 'Escape' && !isBulkSaving) closeBulkCategoryModal(); }}
          >
            <div className="p-6 flex items-center justify-between" style={{ borderBottom: '1px solid #F7F7F8' }}>
              <h3 id="bulk-category-title" className="font-semibold text-lg" style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif', color: '#303150' }}>
                עריכת קטגוריה ל-{selectedIds.size} עסקאות
              </h3>
              <button type="button" onClick={closeBulkCategoryModal} className="p-2 rounded-lg transition-colors hover:bg-[#F7F7F8]" style={{ color: '#7E7F90' }} aria-label="סגור" disabled={isBulkSaving}>
                <X className="w-5 h-5" strokeWidth={1.75} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm" style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif', color: '#7E7F90' }}>
                בחר קטגוריה חדשה שתוחל על כל {selectedIds.size} העסקאות שנבחרו.
              </p>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif', color: '#7E7F90' }}>קטגוריה</label>
                <div className="relative">
                  <button
                    ref={bulkCategoryButtonRef}
                    type="button"
                    onClick={handleToggleBulkDropdown}
                    disabled={isBulkSaving}
                    className={cn('w-full px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-between gap-2 focus:outline-none', isBulkSaving && 'opacity-50 cursor-not-allowed')}
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
                        ? (getCategoryInfo(bulkCategory, selectedTransactionsType as 'income' | 'expense', selectedTransactionsType === 'income' ? customIncomeCategories : customExpenseCategories)?.nameHe || 'בחר קטגוריה...')
                        : 'בחר קטגוריה...'}
                    </span>
                    <ChevronDown className={cn('w-4 h-4 flex-shrink-0 transition-transform', bulkDropdownOpen && 'rotate-180')} style={{ color: '#7E7F90' }} />
                  </button>

                  {bulkDropdownOpen && bulkDropdownPosition && createPortal(
                    <div ref={bulkDropdownRef} className="rounded-xl shadow-lg max-h-48 overflow-y-auto" style={{ position: 'fixed', top: bulkDropdownPosition.top, left: bulkDropdownPosition.left, width: bulkDropdownPosition.width, zIndex: 10001, backgroundColor: '#FFFFFF', border: '1px solid #E8E8ED' }} dir="rtl">
                      <div className="p-1">
                        {bulkCategoriesList.map((cat) => {
                          const isCatSelected = cat.id === bulkCategory;
                          const CatIcon = cat.icon;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => { setBulkCategory(cat.id); setBulkDropdownOpen(false); }}
                              className="w-full px-3 py-2 rounded-lg text-sm font-medium text-right flex items-center gap-2 transition-colors"
                              style={{
                                fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                                backgroundColor: isCatSelected ? '#C1DDFF' : 'transparent',
                                color: '#303150',
                                border: isCatSelected ? '2px solid #69ADFF' : '2px solid transparent',
                              }}
                              onMouseEnter={(e) => { if (!isCatSelected) e.currentTarget.style.backgroundColor = '#F7F7F8'; }}
                              onMouseLeave={(e) => { if (!isCatSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
                            >
                              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: cat.bgColor, color: cat.color }}>
                                {CatIcon && <CatIcon className="w-3.5 h-3.5" strokeWidth={1.75} />}
                              </div>
                              <span className="flex-1 text-right">{cat.nameHe}</span>
                              {isCatSelected && <Check className="w-4 h-4" style={{ color: '#69ADFF' }} />}
                            </button>
                          );
                        })}
                      </div>
                    </div>,
                    document.body,
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 flex gap-3" style={{ borderTop: '1px solid #F7F7F8' }}>
              <button
                onClick={handleBulkSave}
                disabled={isBulkSaving || !bulkCategory}
                className="flex-1 py-2.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif', backgroundColor: '#69ADFF', color: '#FFFFFF' }}
              >
                {isBulkSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> שומר...</> : 'שמור'}
              </button>
              <button
                onClick={closeBulkCategoryModal}
                disabled={isBulkSaving}
                className="flex-1 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif', backgroundColor: '#F7F7F8', color: '#303150' }}
              >
                ביטול
              </button>
            </div>
          </motion.div>
        </div>,
        document.body,
      )}

      <ExportExcelModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
}
