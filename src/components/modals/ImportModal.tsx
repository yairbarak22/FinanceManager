'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useCategories } from '@/hooks/useCategories';
import {
  X,
  Upload,
  FileSpreadsheet,
  Loader2,
  CheckCircle,
  AlertCircle,
  Brain,
  Save,
  FolderOpen,
  HelpCircle,
  ChevronDown,
  Check,
} from 'lucide-react';
import { formatCurrency, apiFetch } from '@/lib/utils';
import { expenseCategories, incomeCategories, CategoryInfo } from '@/lib/categories';
import { cn } from '@/lib/utils';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Parsed transaction from API
interface ParsedTransaction {
  rowNum: number;
  merchantName: string;
  amount: number;
  date: string;
  type: 'income' | 'expense';
  category: string | null;
}

// Import phases
type ImportPhase = 'idle' | 'parsing' | 'classifying' | 'review' | 'saving' | 'done' | 'error';

// Stats from API
interface ImportStats {
  total: number;
  cached: number;
  aiClassified: number;
  needsReview: number;
  parseErrors: number;
}

// Helper function to translate technical errors to user-friendly messages
function translateError(error: string): string {
  // Replace technical terms with user-friendly language
  if (error.includes('פרסור')) {
    return error.replace('פרסור', 'עיבוד');
  }
  if (error.includes('שגיאה בעיבוד')) {
    return 'שורה שלא ניתן לעבד';
  }
  // Make error messages cleaner
  const match = error.match(/שורה (\d+):/);
  if (match) {
    const rowNum = match[1];
    if (error.includes('תאריך לא תקין')) {
      return `שורה ${rowNum}: תאריך לא זוהה`;
    }
    if (error.includes('סכום לא תקין')) {
      return `שורה ${rowNum}: סכום לא זוהה`;
    }
    if (error.includes('שם עסק חסר')) {
      return `שורה ${rowNum}: חסר שם עסק`;
    }
  }
  return error;
}

// Progress step component
function ProgressStep({
  step,
  label,
  icon: Icon,
  isActive,
  isComplete,
  isError,
}: {
  step: number;
  label: string;
  icon: React.ElementType;
  isActive: boolean;
  isComplete: boolean;
  isError?: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center transition-all',
          isError ? 'bg-red-100 text-red-600' :
            isComplete ? 'bg-green-100 text-green-600' :
              isActive ? 'bg-indigo-100 text-indigo-600 ring-2 ring-indigo-300 ring-offset-2' :
                'bg-slate-100 text-slate-400'
        )}
      >
        {isComplete ? (
          <CheckCircle className="w-5 h-5" />
        ) : isError ? (
          <AlertCircle className="w-5 h-5" />
        ) : isActive ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Icon className="w-5 h-5" />
        )}
      </div>
      <span
        className={cn(
          'text-xs mt-2 text-center',
          isActive || isComplete ? 'text-slate-900 font-medium' : 'text-slate-400'
        )}
      >
        {label}
      </span>
    </div>
  );
}

// Progress connector line
function ProgressLine({ isComplete }: { isComplete: boolean }) {
  return (
    <div
      className={cn(
        'flex-1 h-0.5 mx-2 transition-colors',
        isComplete ? 'bg-green-300' : 'bg-slate-200'
      )}
    />
  );
}

// Dropdown position interface
interface DropdownPosition {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  maxHeight: number;
}

// Custom Category Dropdown component with Portal
function CategoryDropdown({
  value,
  onChange,
  categories,
  isOpen,
  onToggle,
  onClose,
}: {
  value: string;
  onChange: (value: string) => void;
  categories: CategoryInfo[];
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<DropdownPosition>({ left: 0, width: 0, maxHeight: 256 });
  const selectedCategory = categories.find(c => c.id === value);

  // Set mounted for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate dropdown position
  const updatePosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom - 16;
      const spaceAbove = rect.top - 16;
      const preferredHeight = 256; // max-h-64

      const openBelow = spaceBelow >= Math.min(preferredHeight, 100) || spaceBelow >= spaceAbove;

      if (openBelow) {
        setPosition({
          top: rect.bottom + 4,
          bottom: undefined,
          left: rect.left,
          width: rect.width,
          maxHeight: Math.min(preferredHeight, spaceBelow),
        });
      } else {
        setPosition({
          top: undefined,
          bottom: window.innerHeight - rect.top + 4,
          left: rect.left,
          width: rect.width,
          maxHeight: Math.min(preferredHeight, spaceAbove),
        });
      }
    }
  }, []);

  // Update position when open
  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
      };
    }
  }, [isOpen, updatePosition]);

  // Handle click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const isOutsideTrigger = triggerRef.current && !triggerRef.current.contains(target);
      const isOutsideDropdown = dropdownRef.current && !dropdownRef.current.contains(target);

      if (isOutsideTrigger && isOutsideDropdown) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Dropdown content rendered via portal
  const dropdownContent = (
    <div
      ref={dropdownRef}
      className="fixed z-[10000] bg-white border border-slate-200 rounded-xl shadow-lg overflow-y-auto"
      style={{
        top: position.top,
        bottom: position.bottom,
        left: position.left,
        width: position.width,
        maxHeight: position.maxHeight,
      }}
      dir="rtl"
    >
      <div className="p-1">
        {categories.map((cat) => {
          const isSelected = cat.id === value;
          return (
            <button
              key={cat.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onChange(cat.id);
                onClose();
              }}
              className={cn(
                'w-full px-3 py-2 rounded-lg text-sm font-medium text-right',
                'flex items-center justify-between gap-2 transition-colors',
                isSelected
                  ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-300'
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
  );

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={onToggle}
        className={cn(
          'w-full px-3 py-2.5 border-2 rounded-xl text-sm font-medium transition-all',
          'flex items-center justify-between gap-2',
          'focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 focus:outline-none',
          value
            ? 'border-indigo-300 bg-indigo-50 text-indigo-700 hover:border-indigo-400'
            : 'border-amber-300 bg-amber-50 text-amber-700 hover:border-amber-400'
        )}
      >
        <span className="truncate">
          {selectedCategory ? selectedCategory.nameHe : 'בחר קטגוריה...'}
        </span>
        <ChevronDown className={cn(
          'w-4 h-4 flex-shrink-0 transition-transform',
          isOpen && 'rotate-180'
        )} />
      </button>

      {/* Dropdown via Portal */}
      {mounted && isOpen && createPortal(dropdownContent, document.body)}
    </div>
  );
}

// Mobile transaction card component for review
function TransactionCard({
  transaction,
  selectedCategory,
  onCategoryChange,
  categories,
  isDropdownOpen,
  onDropdownToggle,
  onDropdownClose,
}: {
  transaction: ParsedTransaction;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories: CategoryInfo[];
  isDropdownOpen: boolean;
  onDropdownToggle: () => void;
  onDropdownClose: () => void;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
      {/* Merchant name and amount */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-900 truncate">{transaction.merchantName}</p>
          <p className="text-sm text-slate-500">
            {new Date(transaction.date).toLocaleDateString('he-IL')}
          </p>
        </div>
        <span className={cn(
          'font-bold text-lg whitespace-nowrap',
          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
        )}>
          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
        </span>
      </div>
      
      {/* Category selector - full width on mobile */}
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1.5">קטגוריה</label>
        <CategoryDropdown
          value={selectedCategory}
          onChange={onCategoryChange}
          categories={categories}
          isOpen={isDropdownOpen}
          onToggle={onDropdownToggle}
          onClose={onDropdownClose}
        />
      </div>
    </div>
  );
}

export default function ImportModal({ isOpen, onClose, onSuccess }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<ImportPhase>('idle');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Data from API
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
  const [needsReview, setNeedsReview] = useState<ParsedTransaction[]>([]);
  const [stats, setStats] = useState<ImportStats | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [savedCount, setSavedCount] = useState(0);

  // Manual category selections for review items
  const [reviewCategories, setReviewCategories] = useState<Record<number, string>>({});

  // Track which dropdown is open (by rowNum)
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);

  // Fetch custom categories
  const { getCustomByType, loading: categoriesLoading } = useCategories();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      resetState();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      setFile(droppedFile);
      resetState();
    }
  };

  const resetState = () => {
    setPhase('idle');
    setTransactions([]);
    setNeedsReview([]);
    setStats(null);
    setErrors([]);
    setSavedCount(0);
    setReviewCategories({});
    setOpenDropdown(null);
  };

  const handleClose = () => {
    setFile(null);
    resetState();
    onClose();
  };

  // Start import process
  const handleStartImport = async () => {
    if (!file) return;

    setPhase('parsing');
    setErrors([]);

    const formData = new FormData();
    formData.append('file', file);

    try {
      setPhase('classifying');

      const res = await apiFetch('/api/transactions/import', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setPhase('error');
        setErrors([data.error || 'שגיאה בעיבוד הקובץ']);
        return;
      }

      setTransactions(data.transactions || []);
      setNeedsReview(data.needsReview || []);
      setStats(data.stats || null);
      setErrors(data.errors || []);

      // If there are items needing review, go to review phase
      if (data.needsReview?.length > 0) {
        setPhase('review');
      } else if (data.transactions?.length > 0) {
        // Auto-save if no review needed
        await saveTransactions(data.transactions, []);
      } else {
        setPhase('done');
      }
    } catch {
      setPhase('error');
      setErrors(['שגיאה בעיבוד הקובץ']);
    }
  };

  // Save transactions (both auto-classified and manually reviewed)
  const saveTransactions = async (
    classified: ParsedTransaction[],
    reviewed: ParsedTransaction[]
  ) => {
    setPhase('saving');

    try {
      // Prepare transactions for saving
      const toSave = [
        ...classified.map(t => ({
          merchantName: t.merchantName,
          amount: t.amount,
          date: typeof t.date === 'string' ? t.date : new Date(t.date).toISOString(),
          type: t.type,
          category: t.category!,
          isManualCategory: false,
        })),
        ...reviewed.map(t => ({
          merchantName: t.merchantName,
          amount: t.amount,
          date: typeof t.date === 'string' ? t.date : new Date(t.date).toISOString(),
          type: t.type,
          category: t.category!,
          isManualCategory: true,
        })),
      ];

      const res = await apiFetch('/api/transactions/import/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: toSave }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPhase('error');
        setErrors([data.error || 'שגיאה בשמירת העסקאות']);
        return;
      }

      setSavedCount(data.count || 0);
      setPhase('done');
      onSuccess();
    } catch {
      setPhase('error');
      setErrors(['שגיאה בשמירת העסקאות']);
    }
  };

  // Handle manual category selection during review
  const handleCategoryChange = (rowNum: number, category: string) => {
    setReviewCategories(prev => ({ ...prev, [rowNum]: category }));
  };

  // Complete review and save
  const handleCompleteReview = async () => {
    // Check all review items have categories selected
    const allReviewed = needsReview.every(t => reviewCategories[t.rowNum]);
    if (!allReviewed) {
      setErrors(['נא לבחור קטגוריה לכל העסקאות']);
      return;
    }

    // Apply manual categories
    const reviewedWithCategories = needsReview.map(t => ({
      ...t,
      category: reviewCategories[t.rowNum],
    }));

    await saveTransactions(transactions, reviewedWithCategories);
  };

  // Get categories based on transaction type (includes custom categories)
  const getCategoriesForType = (type: 'income' | 'expense') => {
    const defaultCats = type === 'income' ? incomeCategories : expenseCategories;
    const customCats = getCustomByType(type);
    return [...defaultCats, ...customCats];
  };

  if (!isOpen) return null;

  // Determine which step is active
  const stepStatus = {
    parse: phase === 'parsing' ? 'active' : ['classifying', 'review', 'saving', 'done'].includes(phase) ? 'complete' : 'pending',
    classify: phase === 'classifying' ? 'active' : ['review', 'saving', 'done'].includes(phase) ? 'complete' : 'pending',
    review: phase === 'review' ? 'active' : ['saving', 'done'].includes(phase) && needsReview.length > 0 ? 'complete' : 'pending',
    save: phase === 'saving' ? 'active' : phase === 'done' ? 'complete' : 'pending',
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal-content max-w-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-200">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">ייבוא עסקאות חכם</h3>
              <p className="text-sm text-slate-500">סיווג אוטומטי עם AI</p>
            </div>
          </div>
          <button onClick={handleClose} className="btn-icon">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Progress Stepper (show when processing) */}
        {phase !== 'idle' && phase !== 'error' && (
          <div className="px-6 py-4 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <ProgressStep
                step={1}
                label="ניתוח קובץ"
                icon={FolderOpen}
                isActive={stepStatus.parse === 'active'}
                isComplete={stepStatus.parse === 'complete'}
              />
              <ProgressLine isComplete={stepStatus.parse === 'complete'} />
              <ProgressStep
                step={2}
                label="סיווג AI"
                icon={Brain}
                isActive={stepStatus.classify === 'active'}
                isComplete={stepStatus.classify === 'complete'}
              />
              <ProgressLine isComplete={stepStatus.classify === 'complete'} />
              <ProgressStep
                step={3}
                label="בדיקה ידנית"
                icon={HelpCircle}
                isActive={stepStatus.review === 'active'}
                isComplete={stepStatus.review === 'complete'}
              />
              <ProgressLine isComplete={stepStatus.review === 'complete'} />
              <ProgressStep
                step={4}
                label="שמירה"
                icon={Save}
                isActive={stepStatus.save === 'active'}
                isComplete={stepStatus.save === 'complete'}
              />
            </div>
          </div>
        )}

        {/* Body */}
        <div className="modal-body flex-1 overflow-y-auto">
          {/* Idle state - file upload */}
          {phase === 'idle' && (
            <>
              <div
                className={cn(
                  'border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer',
                  isDragging
                    ? 'border-indigo-400 bg-indigo-50'
                    : 'border-slate-200 hover:border-slate-300'
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                />
                <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <p className="text-sm text-slate-600 mb-1">
                  גרור קובץ לכאן או לחץ לבחירה
                </p>
                <p className="text-xs text-slate-400">
                  Excel (.xlsx, .xls) או CSV
                </p>
              </div>

              {file && (
                <div className="mt-4 p-3 bg-slate-50 rounded-xl flex items-center gap-3">
                  <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-4 p-3 bg-blue-50 rounded-xl">
                <p className="text-sm text-blue-800 font-medium mb-1">ייבוא מכל בנק או חברת אשראי</p>
                <p className="text-xs text-blue-600">
                  ניתן להעלות קבצי Excel מבנק לאומי, פועלים, דיסקונט, ישראכרט, מקס ועוד.
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  המערכת תזהה אוטומטית את מבנה הקובץ ותסווג את העסקאות.
                </p>
                <p className="text-xs text-amber-600 mt-2 font-medium">
                  💡 לפרטיות מומלץ למחוק עמודות עם מידע אישי (מספר כרטיס, יתרה) לפני ההעלאה.
                </p>
              </div>
            </>
          )}

          {/* Processing states */}
          {(phase === 'parsing' || phase === 'classifying' || phase === 'saving') && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
              <p className="text-slate-700 font-medium">
                {phase === 'parsing' && 'מנתח את הקובץ...'}
                {phase === 'classifying' && 'מסווג עסקאות עם AI...'}
                {phase === 'saving' && 'שומר עסקאות...'}
              </p>
              {phase === 'classifying' && (
                <p className="text-sm text-slate-500 mt-2">
                  זה עשוי לקחת מספר שניות
                </p>
              )}
            </div>
          )}

          {/* Review mode */}
          {phase === 'review' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <HelpCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800">
                      נדרשת עזרתך ב-{needsReview.length} עסקאות
                    </p>
                    <p className="text-sm text-amber-700 mt-1">
                      ה-AI לא הצליח לזהות את הקטגוריה. בחר קטגוריה לכל עסקה.
                    </p>
                  </div>
                </div>
              </div>

              {stats && (
                <div className="flex gap-3 text-sm flex-wrap">
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg">
                    ✓ {stats.cached + stats.aiClassified} סווגו אוטומטית
                  </span>
                  {stats.parseErrors > 0 && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded-lg">
                      ✗ {stats.parseErrors} שורות לא זוהו
                    </span>
                  )}
                </div>
              )}

              {/* Desktop: Table view */}
              {categoriesLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
                  <p className="text-slate-700 font-medium">טוען קטגוריות...</p>
                </div>
              ) : (
                <>
                  <div className="hidden md:block border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="text-right px-4 py-3 font-medium text-slate-600">עסק</th>
                          <th className="text-right px-4 py-3 font-medium text-slate-600">סכום</th>
                          <th className="text-right px-4 py-3 font-medium text-slate-600">תאריך</th>
                          <th className="text-right px-4 py-3 font-medium text-slate-600 min-w-[160px]">קטגוריה</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {needsReview.map((t) => (
                          <tr key={t.rowNum} className="hover:bg-slate-50">
                            <td className="px-4 py-3">
                              <span className="font-medium text-slate-900">{t.merchantName}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={cn(
                                'font-medium',
                                t.type === 'income' ? 'text-green-600' : 'text-red-600'
                              )}>
                                {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {new Date(t.date).toLocaleDateString('he-IL')}
                            </td>
                            <td className="px-4 py-3">
                              <CategoryDropdown
                                value={reviewCategories[t.rowNum] || ''}
                                onChange={(value) => handleCategoryChange(t.rowNum, value)}
                                categories={getCategoriesForType(t.type)}
                                isOpen={openDropdown === t.rowNum}
                                onToggle={() => setOpenDropdown(openDropdown === t.rowNum ? null : t.rowNum)}
                                onClose={() => setOpenDropdown(null)}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile: Card view */}
                  <div className="md:hidden space-y-3">
                    {needsReview.map((t) => (
                      <TransactionCard
                        key={t.rowNum}
                        transaction={t}
                        selectedCategory={reviewCategories[t.rowNum] || ''}
                        onCategoryChange={(category) => handleCategoryChange(t.rowNum, category)}
                        categories={getCategoriesForType(t.type)}
                        isDropdownOpen={openDropdown === t.rowNum}
                        onDropdownToggle={() => setOpenDropdown(openDropdown === t.rowNum ? null : t.rowNum)}
                        onDropdownClose={() => setOpenDropdown(null)}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Done state */}
          {phase === 'done' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold text-slate-900 mb-2">הייבוא הושלם!</h4>
              <p className="text-slate-600 text-center">
                {savedCount > 0 ? (
                  <>נשמרו <span className="font-bold text-indigo-600">{savedCount}</span> עסקאות בהצלחה</>
                ) : (
                  'לא נמצאו עסקאות לייבוא'
                )}
              </p>
              {stats && (
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  {stats.cached > 0 && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      📚 {stats.cached} שמורים
                    </span>
                  )}
                  {stats.aiClassified > 0 && (
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                      🧠 {stats.aiClassified} סווגו ע&quot;י AI
                    </span>
                  )}
                  {stats.needsReview > 0 && (
                    <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">
                      ✍️ {stats.needsReview} סווגו ידנית
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Error state */}
          {phase === 'error' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h4 className="text-lg font-semibold text-slate-900 mb-2">שגיאה</h4>
              <div className="space-y-1 text-center">
                {errors.map((err, i) => (
                  <p key={i} className="text-red-600">{err}</p>
                ))}
              </div>
            </div>
          )}

          {/* Parse errors list */}
          {errors.length > 0 && phase !== 'error' && (
            <div className="mt-4 p-3 bg-amber-50 rounded-xl max-h-32 overflow-y-auto border border-amber-200">
              <p className="text-sm font-medium text-amber-800 mb-1">שורות שלא זוהו:</p>
              {errors.slice(0, 5).map((err, i) => (
                <p key={i} className="text-xs text-amber-700">{translateError(err)}</p>
              ))}
              {errors.length > 5 && (
                <p className="text-xs text-amber-600 mt-1">
                  ועוד {errors.length - 5} שורות...
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button onClick={handleClose} className="btn-secondary flex-1">
            {phase === 'done' ? 'סגור' : 'ביטול'}
          </button>

          {phase === 'idle' && file && (
            <button
              onClick={handleStartImport}
              className="btn-primary flex-1 justify-center"
            >
              <Upload className="w-4 h-4" />
              התחל ייבוא
            </button>
          )}

          {phase === 'review' && (
            <button
              onClick={handleCompleteReview}
              disabled={!needsReview.every(t => reviewCategories[t.rowNum])}
              className="btn-primary flex-1 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Brain className="w-4 h-4" />
              שמור ולמד
            </button>
          )}

          {phase === 'error' && (
            <button
              onClick={resetState}
              className="btn-primary flex-1 justify-center"
            >
              נסה שוב
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
