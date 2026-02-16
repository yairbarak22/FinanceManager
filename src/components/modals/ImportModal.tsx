'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useCategories } from '@/hooks/useCategories';
import { useAnalytics } from '@/hooks/useAnalytics';
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
  CheckSquare,
  Square,
  Calendar,
  ArrowUpDown,
  CreditCard,
} from 'lucide-react';
import { formatCurrency, apiFetch } from '@/lib/utils';
import { expenseCategories, incomeCategories, CategoryInfo } from '@/lib/categories';
import { cn } from '@/lib/utils';
import { SensitiveData } from '../common/SensitiveData';

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
type ImportPhase = 'idle' | 'importType' | 'detectingFormat' | 'dateFormat' | 'parsing' | 'classifying' | 'review' | 'duplicates' | 'saving' | 'done' | 'error';

// Import type selection
type ImportType = 'expenses' | 'roundTrip';

// Date format options
type DateFormatOption = 'AUTO' | 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';

// Detection result from API
interface DateFormatDetection {
  detectedFormat: DateFormatOption;
  confidence: 'high' | 'medium' | 'low';
  sampleDates: string[];
  sampleParsed: string[];
  isHtmlFile: boolean;
  isExcelSerial: boolean;
}

const DATE_FORMAT_OPTIONS: { value: DateFormatOption; label: string; example: string; description: string }[] = [
  { value: 'DD/MM/YYYY', label: 'יום/חודש/שנה', example: '15/03/2024', description: 'פורמט ישראלי' },
  { value: 'MM/DD/YYYY', label: 'חודש/יום/שנה', example: '03/15/2024', description: 'פורמט אמריקאי' },
  { value: 'YYYY-MM-DD', label: 'שנה-חודש-יום', example: '2024-03-15', description: 'פורמט בינלאומי' },
];

// Stats from API
interface ImportStats {
  total: number;
  cached: number;
  aiClassified: number;
  needsReview: number;
  parseErrors: number;
}

// Duplicate transaction info from API
interface DuplicateInfo {
  transaction: {
    merchantName: string;
    amount: number;
    date: string;
    type: 'income' | 'expense';
    category: string;
  };
  existing: {
    id: string;
    date: string;
    amount: number;
    description: string;
  };
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
  const getStepStyle = () => {
    if (isError) return { backgroundColor: 'rgba(241, 138, 181, 0.15)', color: '#F18AB5' };
    if (isComplete) return { backgroundColor: 'rgba(13, 186, 204, 0.15)', color: '#0DBACC' };
    if (isActive) return { 
      backgroundColor: 'rgba(105, 173, 255, 0.15)', 
      color: '#69ADFF',
      boxShadow: '0 0 0 2px #69ADFF, 0 0 0 4px rgba(105, 173, 255, 0.2)',
    };
    return { backgroundColor: '#F7F7F8', color: '#BDBDCB' };
  };

  return (
    <div className="flex flex-col items-center">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
        style={getStepStyle()}
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
        className="text-xs mt-2 text-center"
        style={{
          color: isActive || isComplete ? '#303150' : '#BDBDCB',
          fontWeight: isActive || isComplete ? 500 : 400,
          fontFamily: 'var(--font-nunito), system-ui, sans-serif',
        }}
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
      className="flex-1 h-0.5 mx-2 transition-colors"
      style={{
        backgroundColor: isComplete ? 'rgba(13, 186, 204, 0.5)' : '#E8E8ED',
      }}
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
      className="fixed z-[10000] bg-white rounded-xl shadow-lg overflow-y-auto"
      style={{
        top: position.top,
        bottom: position.bottom,
        left: position.left,
        width: position.width,
        maxHeight: position.maxHeight,
        border: '1px solid #F7F7F8',
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
              className="w-full px-3 py-2 rounded-lg text-sm font-medium text-right flex items-center justify-between gap-2 transition-colors"
              style={{
                backgroundColor: isSelected ? 'rgba(105, 173, 255, 0.15)' : 'transparent',
                color: isSelected ? '#69ADFF' : '#303150',
                border: isSelected ? '2px solid rgba(105, 173, 255, 0.4)' : '2px solid transparent',
                fontFamily: 'var(--font-nunito), system-ui, sans-serif',
              }}
            >
              <span>{cat.nameHe}</span>
              {isSelected && <Check className="w-4 h-4" style={{ color: '#69ADFF' }} />}
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
        className="w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-between gap-2 focus:ring-2 focus:ring-offset-1 focus:outline-none"
        style={{
          border: value ? '2px solid rgba(105, 173, 255, 0.4)' : '2px solid rgba(241, 138, 181, 0.4)',
          backgroundColor: value ? 'rgba(105, 173, 255, 0.1)' : 'rgba(241, 138, 181, 0.1)',
          color: value ? '#69ADFF' : '#F18AB5',
          fontFamily: 'var(--font-nunito), system-ui, sans-serif',
        }}
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
  rowRef,
}: {
  transaction: ParsedTransaction;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories: CategoryInfo[];
  isDropdownOpen: boolean;
  onDropdownToggle: () => void;
  onDropdownClose: () => void;
  rowRef?: (el: HTMLDivElement | null) => void;
}) {
  return (
    <div 
      ref={rowRef}
      className="bg-white rounded-xl p-4 space-y-3"
      style={{ border: '1px solid #F7F7F8' }}
    >
      {/* Merchant name and amount */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <SensitiveData as="p" className="font-medium truncate" style={{ color: '#303150' }}>
            {transaction.merchantName}
          </SensitiveData>
          <p className="text-sm" style={{ color: '#7E7F90' }}>
            {new Date(transaction.date).toLocaleDateString('he-IL')}
          </p>
        </div>
        <SensitiveData 
          className="font-bold text-lg whitespace-nowrap"
          style={{ color: transaction.type === 'income' ? '#0DBACC' : '#F18AB5' }}
          dir="ltr"
        >
          {`${transaction.type === 'income' ? '+' : '-'}${formatCurrency(transaction.amount)}`}
        </SensitiveData>
      </div>
      
      {/* Category selector - full width on mobile */}
      <div>
        <label 
          className="block text-xs font-medium mb-1.5"
          style={{ color: '#7E7F90' }}
        >
          קטגוריה
        </label>
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
  const analytics = useAnalytics();
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

  // Duplicate detection
  const [duplicates, setDuplicates] = useState<DuplicateInfo[]>([]);
  const [pendingTransactions, setPendingTransactions] = useState<Array<{
    merchantName: string;
    amount: number;
    date: string;
    type: 'income' | 'expense';
    category: string;
    isManualCategory: boolean;
  }>>([]);
  
  // Selected duplicates for import (indices of duplicates to include)
  const [selectedDuplicateIndices, setSelectedDuplicateIndices] = useState<Set<number>>(new Set());

  // Import type
  const [importType, setImportType] = useState<ImportType | null>(null);

  // Date format selection & detection
  const [dateFormat, setDateFormat] = useState<DateFormatOption>('AUTO');
  const [detection, setDetection] = useState<DateFormatDetection | null>(null);
  const [showManualFormat, setShowManualFormat] = useState(false);

  // Manual category selections for review items
  const [reviewCategories, setReviewCategories] = useState<Record<number, string>>({});

  // Track which dropdown is open (by rowNum)
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);

  // Refs for each review row (for auto-scroll after categorization)
  const rowRefs = useRef<Map<number, HTMLElement>>(new Map());
  const setRowRef = useCallback((rowNum: number, element: HTMLElement | null) => {
    if (element) {
      rowRefs.current.set(rowNum, element);
    } else {
      rowRefs.current.delete(rowNum);
    }
  }, []);

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
    setDuplicates([]);
    setPendingTransactions([]);
    setSelectedDuplicateIndices(new Set());
    setImportType(null);
    setDateFormat('AUTO');
    setDetection(null);
    setShowManualFormat(false);
  };

  // Duplicate selection helper functions
  const toggleDuplicateSelection = (index: number) => {
    setSelectedDuplicateIndices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const selectAllDuplicates = () => {
    setSelectedDuplicateIndices(new Set(duplicates.map((_, idx) => idx)));
  };

  const deselectAllDuplicates = () => {
    setSelectedDuplicateIndices(new Set());
  };

  const isAllDuplicatesSelected = duplicates.length > 0 && selectedDuplicateIndices.size === duplicates.length;
  const selectedDuplicatesCount = selectedDuplicateIndices.size;
  const nonDuplicateCount = pendingTransactions.length - duplicates.length;
  const totalToImport = selectedDuplicatesCount + nonDuplicateCount;

  const handleClose = () => {
    setFile(null);
    resetState();
    onClose();
  };

  // Start date format detection when user clicks "Start Import"
  const handleDetectDateFormat = async () => {
    if (!file) return;

    setPhase('detectingFormat');
    setDetection(null);
    setShowManualFormat(false);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await apiFetch('/api/transactions/import/detect-date-format', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        // If detection fails, fall back to manual selection
        setDetection(null);
        setShowManualFormat(true);
        setPhase('dateFormat');
        return;
      }

      setDetection(data as DateFormatDetection);
      // Pre-select the detected format
      if (data.detectedFormat && data.detectedFormat !== 'AUTO') {
        setDateFormat(data.detectedFormat);
      }
      setPhase('dateFormat');
    } catch {
      // If detection fails, fall back to manual selection
      setDetection(null);
      setShowManualFormat(true);
      setPhase('dateFormat');
    }
  };

  // Start import process (called after date format confirmation)
  const handleStartImport = async () => {
    if (!file) return;

    // Validation before sending to API
    if (!importType) {
      setPhase('error');
      setErrors(['נא לבחור את סוג הייבוא']);
      return;
    }

    setPhase('parsing');
    setErrors([]);

    // Determine the format to send to the API
    const formatToSend = detection?.isExcelSerial ? 'AUTO' : dateFormat;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('dateFormat', formatToSend);
    formData.append('importType', importType || 'expenses');

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
    reviewed: ParsedTransaction[],
    skipDuplicateCheck = false
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
        body: JSON.stringify({ transactions: toSave, skipDuplicateCheck }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPhase('error');
        setErrors([data.error || 'שגיאה בשמירת העסקאות']);
        return;
      }

      // Check if duplicates were found
      if (data.hasDuplicates && !skipDuplicateCheck) {
        const duplicatesList = data.duplicates || [];
        setDuplicates(duplicatesList);
        setPendingTransactions(toSave);
        // Initialize with all duplicates selected (user can deselect ones they don't want)
        setSelectedDuplicateIndices(new Set(duplicatesList.map((_: DuplicateInfo, idx: number) => idx)));
        setPhase('duplicates');
        return;
      }

      setSavedCount(data.count || 0);
      setPhase('done');
      analytics.trackImport(data.count || toSave.length, true);
      onSuccess();
    } catch {
      setPhase('error');
      setErrors(['שגיאה בשמירת העסקאות']);
      analytics.trackImport(0, false);
    }
  };

  // Save transactions despite duplicates (user confirmed)
  const saveTransactionsDespiteDuplicates = async () => {
    // Build a set of duplicate transaction keys for quick lookup
    const duplicateKeys = new Set(
      duplicates.map(dup => 
        `${dup.transaction.merchantName}|${dup.transaction.amount}|${dup.transaction.date}|${dup.transaction.type}`
      )
    );
    
    // Build a set of selected duplicate transaction keys
    const selectedDuplicateKeys = new Set(
      Array.from(selectedDuplicateIndices).map(idx => {
        const dup = duplicates[idx];
        return `${dup.transaction.merchantName}|${dup.transaction.amount}|${dup.transaction.date}|${dup.transaction.type}`;
      })
    );
    
    // Filter transactions: include non-duplicates + selected duplicates
    const transactionsToSave = pendingTransactions.filter(t => {
      const key = `${t.merchantName}|${t.amount}|${t.date}|${t.type}`;
      const isDuplicate = duplicateKeys.has(key);
      
      if (isDuplicate) {
        // Only include if selected
        return selectedDuplicateKeys.has(key);
      }
      // Non-duplicate - always include
      return true;
    });
    
    if (transactionsToSave.length === 0) {
      setPhase('error');
      setErrors(['לא נבחרו עסקאות לייבוא']);
      return;
    }

    setPhase('saving');

    try {
      const res = await apiFetch('/api/transactions/import/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: transactionsToSave, skipDuplicateCheck: true }),
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

  // Handle manual category selection during review (with auto-scroll to next)
  const handleCategoryChange = (rowNum: number, category: string) => {
    // Update the category
    setReviewCategories(prev => ({ ...prev, [rowNum]: category }));

    // Close the current dropdown
    setOpenDropdown(null);

    // Find the next uncategorized row
    const currentIndex = needsReview.findIndex(t => t.rowNum === rowNum);
    const nextUncategorized = needsReview
      .slice(currentIndex + 1)
      .find(t => !reviewCategories[t.rowNum]);

    if (nextUncategorized) {
      const nextRowElement = rowRefs.current.get(nextUncategorized.rowNum);
      if (nextRowElement) {
        // Smooth scroll to the next row, then auto-open its dropdown
        setTimeout(() => {
          nextRowElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
          // Auto-open the dropdown of the next row after scroll settles
          setTimeout(() => {
            setOpenDropdown(nextUncategorized.rowNum);
          }, 200);
        }, 100);
      }
    }
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
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #9F7FE0 0%, #69ADFF 100%)',
                boxShadow: '0 4px 12px rgba(159, 127, 224, 0.3)',
              }}
            >
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 
                className="text-lg font-semibold"
                style={{ 
                  color: '#303150', 
                  fontFamily: 'var(--font-nunito), system-ui, sans-serif' 
                }}
              >
                ייבוא עסקאות חכם
              </h3>
              <p 
                className="text-sm"
                style={{ 
                  color: '#7E7F90', 
                  fontFamily: 'var(--font-nunito), system-ui, sans-serif' 
                }}
              >
                סיווג אוטומטי עם AI
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="btn-icon">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Stepper (show when processing, not during idle/importType/detectingFormat/dateFormat/error) */}
        {phase !== 'idle' && phase !== 'importType' && phase !== 'detectingFormat' && phase !== 'dateFormat' && phase !== 'error' && (
          <div className="px-6 py-4 border-b border-[#F7F7F8]">
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
                className="border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer"
                style={{
                  borderColor: isDragging ? '#69ADFF' : '#E8E8ED',
                  backgroundColor: isDragging ? 'rgba(105, 173, 255, 0.08)' : 'transparent',
                }}
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
                <Upload className="w-10 h-10 mx-auto mb-3" style={{ color: '#BDBDCB' }} />
                <p className="text-sm mb-1" style={{ color: '#303150', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}>
                  גרור קובץ לכאן או לחץ לבחירה
                </p>
                <p className="text-xs" style={{ color: '#7E7F90' }}>
                  Excel (.xlsx, .xls) או CSV
                </p>
              </div>

              {file && (
                <div className="mt-4 p-3 rounded-xl flex items-center gap-3" style={{ backgroundColor: '#F7F7F8' }}>
                  <FileSpreadsheet className="w-5 h-5" style={{ color: '#69ADFF' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#303150' }}>
                      {file.name}
                    </p>
                    <p className="text-xs" style={{ color: '#7E7F90' }}>
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
              )}

              <div 
                className="mt-4 p-3 rounded-xl"
                style={{
                  backgroundColor: 'rgba(105, 173, 255, 0.08)',
                  border: '1px solid rgba(105, 173, 255, 0.15)',
                }}
              >
                <p className="text-sm font-medium mb-1" style={{ color: '#69ADFF' }}>ייבוא עסקאות מכל בנק או חברת אשראי</p>
                <p className="text-xs" style={{ color: '#69ADFF' }}>
                  ניתן להעלות קבצי Excel מבנק לאומי, פועלים, דיסקונט, ישראכרט, מקס ועוד.
                </p>
                <p className="text-xs mt-1" style={{ color: '#69ADFF' }}>
                  תומך בפירוט הוצאות (אשראי) ובעובר ושב (הכנסות + הוצאות).
                </p>
                <p className="text-xs mt-2 font-medium" style={{ color: '#F18AB5' }}>
                  💡 לפרטיות מומלץ למחוק עמודות עם מידע אישי (מספר כרטיס, יתרה) לפני ההעלאה.
                </p>
              </div>
            </>
          )}

          {/* Import type selection */}
          {phase === 'importType' && (
            <div className="space-y-5">
              <div className="text-center">
                <h4
                  className="text-base font-semibold mb-1"
                  style={{ color: '#303150', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
                >
                  מה תרצה לייבא?
                </h4>
                <p className="text-sm" style={{ color: '#7E7F90' }}>
                  בחר את סוג הקובץ שהעלית
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Expenses only */}
                <button
                  type="button"
                  onClick={() => {
                    setImportType('expenses');
                    handleDetectDateFormat();
                  }}
                  className="group relative rounded-3xl p-6 text-center transition-all hover:scale-[1.02]"
                  style={{
                    backgroundColor: 'rgba(105, 173, 255, 0.06)',
                    border: '2px solid rgba(105, 173, 255, 0.2)',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
                    minHeight: '140px',
                  }}
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 transition-all group-hover:shadow-md"
                    style={{
                      background: 'linear-gradient(135deg, #69ADFF 0%, #5A9EE6 100%)',
                      boxShadow: '0 4px 12px rgba(105, 173, 255, 0.3)',
                    }}
                  >
                    <CreditCard className="w-7 h-7 text-white" />
                  </div>
                  <p
                    className="text-sm font-semibold mb-1"
                    style={{ color: '#303150', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
                  >
                    פירוט הוצאות
                  </p>
                  <p className="text-xs" style={{ color: '#7E7F90' }}>
                    פירוט כרטיס אשראי, הוצאות בלבד
                  </p>
                </button>

                {/* Round-trip (income + expenses) */}
                <button
                  type="button"
                  onClick={() => {
                    setImportType('roundTrip');
                    handleDetectDateFormat();
                  }}
                  className="group relative rounded-3xl p-6 text-center transition-all hover:scale-[1.02]"
                  style={{
                    backgroundColor: 'rgba(13, 186, 204, 0.06)',
                    border: '2px solid rgba(13, 186, 204, 0.2)',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
                    minHeight: '140px',
                  }}
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 transition-all group-hover:shadow-md"
                    style={{
                      background: 'linear-gradient(135deg, #0DBACC 0%, #0AA3B3 100%)',
                      boxShadow: '0 4px 12px rgba(13, 186, 204, 0.3)',
                    }}
                  >
                    <ArrowUpDown className="w-7 h-7 text-white" />
                  </div>
                  <p
                    className="text-sm font-semibold mb-1"
                    style={{ color: '#303150', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
                  >
                    עובר ושב
                  </p>
                  <p className="text-xs" style={{ color: '#7E7F90' }}>
                    הכנסות והוצאות מחשבון הבנק
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* Detecting date format - loading state */}
          {phase === 'detectingFormat' && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 animate-spin mb-4" style={{ color: '#69ADFF' }} />
              <p className="font-medium" style={{ color: '#303150', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}>
                מנתח את התאריכים בקובץ...
              </p>
            </div>
          )}

          {/* Date format confirmation / selection */}
          {phase === 'dateFormat' && (
            <div className="space-y-4">
              {/* Explanation of why this step exists */}
              <div 
                className="rounded-xl p-4"
                style={{
                  backgroundColor: 'rgba(105, 173, 255, 0.08)',
                  border: '1px solid rgba(105, 173, 255, 0.15)',
                }}
              >
                <div className="flex items-start gap-3">
                  <Brain className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#69ADFF' }} />
                  <div>
                    <p className="text-sm" style={{ color: '#303150', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}>
                      המערכת מנתחת נתונים באמצעות AI ואנחנו רוצים לוודא בקצרה שהניתוח נכון.
                    </p>
                    <p className="text-sm mt-1.5" style={{ color: '#7E7F90' }}>
                      {detection 
                        ? 'זה הפורמט שזיהינו - נשמח שתוודא שזה הפורמט הנכון לפני שממשיכים כדי למנוע טעויות.'
                        : 'נא בחר את פורמט התאריך בקובץ שלך כדי למנוע טעויות בפרסור התאריכים.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Detection result - show what the system found */}
              {detection && !showManualFormat && !detection.isExcelSerial && (
                <>
                  {/* Detected format display */}
                  <div 
                    className="rounded-xl p-4"
                    style={{
                      backgroundColor: detection.confidence === 'high' 
                        ? 'rgba(13, 186, 204, 0.08)' 
                        : 'rgba(105, 173, 255, 0.08)',
                      border: `1px solid ${detection.confidence === 'high' 
                        ? 'rgba(13, 186, 204, 0.2)' 
                        : 'rgba(105, 173, 255, 0.15)'}`,
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: detection.confidence === 'high' ? '#0DBACC' : '#69ADFF' }} />
                      <div className="flex-1">
                        <p className="font-medium" style={{ color: '#303150', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}>
                          המערכת זיהתה: <span style={{ color: detection.confidence === 'high' ? '#0DBACC' : '#69ADFF' }}>
                            {DATE_FORMAT_OPTIONS.find(o => o.value === detection.detectedFormat)?.label || detection.detectedFormat}
                          </span>
                        </p>
                        <p className="text-xs mt-1" style={{ color: '#7E7F90' }}>
                          {detection.confidence === 'high' ? 'זיהוי ברמת ודאות גבוהה' : detection.confidence === 'medium' ? 'זיהוי ברמת ודאות בינונית - מומלץ לוודא' : 'זיהוי ברמת ודאות נמוכה - יש לוודא'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Sample dates preview */}
                  {detection.sampleDates.length > 0 && (
                    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #E8E8ED' }}>
                      <div className="px-4 py-2.5" style={{ backgroundColor: '#F7F7F8' }}>
                        <p className="text-xs font-medium" style={{ color: '#7E7F90' }}>
                          דוגמאות מהקובץ שלך:
                        </p>
                      </div>
                      <div className="divide-y" style={{ borderColor: '#F7F7F8' }}>
                        {detection.sampleDates.slice(0, 3).map((raw, i) => (
                          <div key={i} className="px-4 py-2 flex items-center justify-between">
                            <span className="text-sm font-mono" style={{ color: '#7E7F90' }} dir="ltr">
                              {raw}
                            </span>
                            <span className="text-sm" style={{ color: '#303150' }}>
                              → {detection.sampleParsed[i] || raw}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Warning for low/medium confidence */}
                  {detection.confidence !== 'high' && (
                    <p className="text-xs" style={{ color: '#F18AB5' }}>
                      ⚠️ פורמט שגוי עלול לגרום לתאריכים לא נכונים (למשל: להחליף בין יום לחודש).
                    </p>
                  )}
                </>
              )}

              {/* Excel serial dates - no need to choose format */}
              {detection && detection.isExcelSerial && !showManualFormat && (
                <div 
                  className="rounded-xl p-4"
                  style={{
                    backgroundColor: 'rgba(13, 186, 204, 0.08)',
                    border: '1px solid rgba(13, 186, 204, 0.2)',
                  }}
                >
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#0DBACC' }} />
                    <div>
                      <p className="font-medium" style={{ color: '#303150', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}>
                        תאריכים בפורמט Excel - נקראים אוטומטית
                      </p>
                      <p className="text-xs mt-1" style={{ color: '#7E7F90' }}>
                        אין צורך לבחור פורמט, המערכת תקרא את התאריכים ישירות מהקובץ.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* No detection available - fallback */}
              {!detection && !showManualFormat && (
                <div 
                  className="rounded-xl p-4"
                  style={{
                    backgroundColor: 'rgba(241, 138, 181, 0.08)',
                    border: '1px solid rgba(241, 138, 181, 0.2)',
                  }}
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#F18AB5' }} />
                    <div>
                      <p className="font-medium" style={{ color: '#303150', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}>
                        לא הצלחנו לזהות את פורמט התאריך
                      </p>
                      <p className="text-xs mt-1" style={{ color: '#7E7F90' }}>
                        נא לבחור ידנית את פורמט התאריך שבקובץ שלך.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Manual format selection - shown when user clicks "change" or when detection failed */}
              {(showManualFormat || !detection || (!detection.isExcelSerial && detection.confidence === 'low')) && (
                <div className="space-y-2">
                  {detection && !showManualFormat && (
                    <p className="text-xs font-medium" style={{ color: '#7E7F90' }}>
                      בחר/י פורמט:
                    </p>
                  )}
                  {DATE_FORMAT_OPTIONS.map((option) => {
                    const isSelected = dateFormat === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setDateFormat(option.value)}
                        className="w-full rounded-xl p-3 text-right transition-all flex items-center gap-3"
                        style={{
                          backgroundColor: isSelected ? 'rgba(105, 173, 255, 0.08)' : 'white',
                          border: isSelected ? '2px solid #69ADFF' : '2px solid #E8E8ED',
                        }}
                      >
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center"
                          style={{ border: isSelected ? '2px solid #69ADFF' : '2px solid #BDBDCB' }}
                        >
                          {isSelected && (
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#69ADFF' }} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium" style={{ color: isSelected ? '#303150' : '#7E7F90' }}>
                            {option.label}
                          </span>
                          <span 
                            className="text-xs px-1.5 py-0.5 rounded font-mono"
                            style={{ backgroundColor: '#F7F7F8', color: '#7E7F90' }}
                            dir="ltr"
                          >
                            {option.example}
                          </span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 flex-shrink-0" style={{ color: '#69ADFF' }} />}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* "Change format" button - only if detection was successful and format picker is hidden */}
              {detection && !showManualFormat && !detection.isExcelSerial && detection.confidence !== 'low' && (
                <button
                  type="button"
                  onClick={() => setShowManualFormat(true)}
                  className="text-xs underline"
                  style={{ color: '#7E7F90' }}
                >
                  לא נכון? שנה פורמט ידנית
                </button>
              )}
            </div>
          )}

          {/* Processing states */}
          {(phase === 'parsing' || phase === 'classifying' || phase === 'saving') && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 animate-spin mb-4" style={{ color: '#69ADFF' }} />
              <p className="font-medium" style={{ color: '#303150', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}>
                {phase === 'parsing' && 'מנתח את הקובץ...'}
                {phase === 'classifying' && 'מסווג עסקאות עם AI...'}
                {phase === 'saving' && 'שומר עסקאות...'}
              </p>
              {phase === 'classifying' && (
                <p className="text-sm mt-2" style={{ color: '#7E7F90' }}>
                  זה עשוי לקחת מספר שניות
                </p>
              )}
            </div>
          )}

          {/* Review mode */}
          {phase === 'review' && (
            <div className="space-y-4">
              <div 
                className="rounded-xl p-4"
                style={{
                  backgroundColor: 'rgba(241, 138, 181, 0.08)',
                  border: '1px solid rgba(241, 138, 181, 0.2)',
                }}
              >
                <div className="flex items-start gap-3">
                  <HelpCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#F18AB5' }} />
                  <div>
                    <p className="font-medium" style={{ color: '#F18AB5' }}>
                      נדרשת עזרתך ב-{needsReview.length} עסקאות
                    </p>
                    <p className="text-sm mt-1" style={{ color: '#F18AB5', opacity: 0.8 }}>
                      ה-AI לא הצליח לזהות את הקטגוריה. בחר קטגוריה לכל עסקה.
                    </p>
                  </div>
                </div>
              </div>

              {stats && (
                <div className="flex gap-3 text-sm flex-wrap">
                  <span 
                    className="px-2 py-1 rounded-lg"
                    style={{ backgroundColor: 'rgba(13, 186, 204, 0.15)', color: '#0DBACC' }}
                  >
                    ✓ {stats.cached + stats.aiClassified} סווגו אוטומטית
                  </span>
                  {stats.parseErrors > 0 && (
                    <span 
                      className="px-2 py-1 rounded-lg"
                      style={{ backgroundColor: 'rgba(241, 138, 181, 0.15)', color: '#F18AB5' }}
                    >
                      ✗ {stats.parseErrors} שורות לא זוהו
                    </span>
                  )}
                </div>
              )}

              {/* Desktop: Table view */}
              {categoriesLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
                  <p className="text-[#303150] font-medium">טוען קטגוריות...</p>
                </div>
              ) : (
                <>
                  <div className="hidden md:block rounded-xl overflow-hidden" style={{ border: '1px solid #F7F7F8' }}>
                    <table className="w-full text-sm">
                      <thead style={{ backgroundColor: '#F7F7F8' }}>
                        <tr>
                          <th className="text-right px-4 py-3 font-medium" style={{ color: '#7E7F90' }}>עסק</th>
                          <th className="text-right px-4 py-3 font-medium" style={{ color: '#7E7F90' }}>סכום</th>
                          <th className="text-right px-4 py-3 font-medium" style={{ color: '#7E7F90' }}>תאריך</th>
                          <th className="text-right px-4 py-3 font-medium min-w-[160px]" style={{ color: '#7E7F90' }}>קטגוריה</th>
                        </tr>
                      </thead>
                      <tbody style={{ borderColor: '#F7F7F8' }}>
                        {needsReview.map((t) => (
                          <tr 
                            key={t.rowNum} 
                            ref={(el) => setRowRef(t.rowNum, el)}
                            className="hover:bg-[#F7F7F8]" 
                            style={{ borderBottom: '1px solid #F7F7F8' }}
                          >
                            <td className="px-4 py-3">
                              <SensitiveData className="font-medium" style={{ color: '#303150' }}>
                                {t.merchantName}
                              </SensitiveData>
                            </td>
                            <td className="px-4 py-3">
                              <SensitiveData 
                                className="font-medium"
                                style={{ color: t.type === 'income' ? '#0DBACC' : '#F18AB5' }}
                                dir="ltr"
                              >
                                {`${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}`}
                              </SensitiveData>
                            </td>
                            <td className="px-4 py-3" style={{ color: '#7E7F90' }}>
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
                        rowRef={(el) => setRowRef(t.rowNum, el)}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Duplicates warning */}
          {phase === 'duplicates' && (
            <div className="space-y-4">
              <div 
                className="rounded-xl p-4"
                style={{
                  backgroundColor: 'rgba(255, 193, 7, 0.08)',
                  border: '1px solid rgba(255, 193, 7, 0.3)',
                }}
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#F59E0B' }} />
                  <div>
                    <p className="font-medium" style={{ color: '#D97706' }}>
                      נמצאו {duplicates.length} עסקאות כפולות
                    </p>
                    <p className="text-sm mt-1" style={{ color: '#D97706', opacity: 0.9 }}>
                      עסקאות אלו כבר קיימות במערכת עם אותו תאריך, סכום ושם עסק. 
                      בחר אילו עסקאות להמשיך איתן בייבוא:
                    </p>
                  </div>
                </div>
              </div>

              {/* Select all / Deselect all button */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={isAllDuplicatesSelected ? deselectAllDuplicates : selectAllDuplicates}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: isAllDuplicatesSelected ? 'rgba(105, 173, 255, 0.1)' : '#F7F7F8',
                    color: isAllDuplicatesSelected ? '#69ADFF' : '#7E7F90',
                  }}
                >
                  {isAllDuplicatesSelected ? (
                    <>
                      <CheckSquare className="w-4 h-4" />
                      בטל הכל
                    </>
                  ) : (
                    <>
                      <Square className="w-4 h-4" />
                      בחר הכל
                    </>
                  )}
                </button>
                <span className="text-sm" style={{ color: '#7E7F90' }}>
                  {selectedDuplicatesCount} מתוך {duplicates.length} נבחרו
                </span>
              </div>

              {/* List of duplicate transactions */}
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #F7F7F8' }}>
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead style={{ backgroundColor: '#F7F7F8' }} className="sticky top-0">
                      <tr>
                        <th className="w-12 px-3 py-3"></th>
                        <th className="text-right px-4 py-3 font-medium" style={{ color: '#7E7F90' }}>עסק</th>
                        <th className="text-right px-4 py-3 font-medium" style={{ color: '#7E7F90' }}>סכום</th>
                        <th className="text-right px-4 py-3 font-medium" style={{ color: '#7E7F90' }}>תאריך</th>
                      </tr>
                    </thead>
                    <tbody>
                      {duplicates.map((dup, idx) => {
                        const isSelected = selectedDuplicateIndices.has(idx);
                        return (
                          <tr 
                            key={idx} 
                            onClick={() => toggleDuplicateSelection(idx)}
                            className="cursor-pointer transition-colors"
                            style={{ 
                              borderBottom: '1px solid #F7F7F8',
                              backgroundColor: isSelected ? 'rgba(105, 173, 255, 0.05)' : 'transparent',
                            }}
                          >
                            <td className="px-3 py-3">
                              <div 
                                className={cn(
                                  'w-6 h-6 rounded flex items-center justify-center transition-colors',
                                  isSelected ? 'bg-[#69ADFF]' : 'bg-white border-2 border-[#E8E8ED]'
                                )}
                              >
                                {isSelected && <Check className="w-4 h-4 text-white" />}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <SensitiveData className="font-medium" style={{ color: '#303150' }}>
                                {dup.transaction.merchantName}
                              </SensitiveData>
                            </td>
                            <td className="px-4 py-3">
                              <SensitiveData 
                                className="font-medium"
                                style={{ color: dup.transaction.type === 'income' ? '#0DBACC' : '#F18AB5' }}
                                dir="ltr"
                              >
                                {`${dup.transaction.type === 'income' ? '+' : '-'}${formatCurrency(dup.transaction.amount)}`}
                              </SensitiveData>
                            </td>
                            <td className="px-4 py-3" style={{ color: '#7E7F90' }}>
                              {new Date(dup.transaction.date).toLocaleDateString('he-IL')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Status summary */}
              <div 
                className="rounded-xl p-3 text-center"
                style={{ backgroundColor: '#F7F7F8' }}
              >
                <p className="text-sm font-medium" style={{ color: '#303150' }}>
                  {totalToImport > 0 ? (
                    <>
                      סה״כ <span style={{ color: '#69ADFF' }}>{totalToImport}</span> עסקאות ייובאו
                      {selectedDuplicatesCount > 0 && (
                        <span style={{ color: '#F59E0B' }}> (כולל {selectedDuplicatesCount} כפולות)</span>
                      )}
                    </>
                  ) : (
                    <span style={{ color: '#F18AB5' }}>לא נבחרו עסקאות לייבוא</span>
                  )}
                </p>
                {nonDuplicateCount > 0 && (
                  <p className="text-xs mt-1" style={{ color: '#7E7F90' }}>
                    {nonDuplicateCount} עסקאות ייובאו ללא בעיה
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Done state */}
          {phase === 'done' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: 'rgba(13, 186, 204, 0.15)' }}
              >
                <CheckCircle className="w-8 h-8" style={{ color: '#0DBACC' }} />
              </div>
              <h4 
                className="text-lg font-semibold mb-2"
                style={{ color: '#303150', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
              >
                הייבוא הושלם!
              </h4>
              <p className="text-center" style={{ color: '#7E7F90' }}>
                {savedCount > 0 ? (
                  <>נשמרו <span className="font-bold" style={{ color: '#69ADFF' }}>{savedCount}</span> עסקאות בהצלחה</>
                ) : (
                  'לא נמצאו עסקאות לייבוא'
                )}
              </p>
              {stats && (
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  {stats.cached > 0 && (
                    <span 
                      className="px-3 py-1 rounded-full text-sm"
                      style={{ backgroundColor: 'rgba(105, 173, 255, 0.15)', color: '#69ADFF' }}
                    >
                      📚 {stats.cached} שמורים
                    </span>
                  )}
                  {stats.aiClassified > 0 && (
                    <span 
                      className="px-3 py-1 rounded-full text-sm"
                      style={{ backgroundColor: 'rgba(159, 127, 224, 0.15)', color: '#9F7FE0' }}
                    >
                      🧠 {stats.aiClassified} סווגו ע&quot;י AI
                    </span>
                  )}
                  {stats.needsReview > 0 && (
                    <span 
                      className="px-3 py-1 rounded-full text-sm"
                      style={{ backgroundColor: 'rgba(241, 138, 181, 0.15)', color: '#F18AB5' }}
                    >
                      ✍️ {stats.needsReview} סווגו ידנית
                    </span>
                  )}
                </div>
              )}

              {/* AI disclaimer box */}
              {stats && stats.aiClassified > 0 && (
                <div className="mt-6 bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-right max-w-md mx-auto">
                  <div className="flex items-start gap-3">
                    <Brain className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-indigo-700">
                        ה-AI <span className="font-semibold">עלול לטעות לפעמים</span>. 
                        מומלץ לעבור על הסיווגים בדף העסקאות ולתקן במידת הצורך.
                      </p>
                      <p className="text-sm text-indigo-600 mt-2 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        <span>כל תיקון נשמר ויסווג אוטומטית בפעמים הבאות!</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error state */}
          {phase === 'error' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: 'rgba(241, 138, 181, 0.15)' }}
              >
                <AlertCircle className="w-8 h-8" style={{ color: '#F18AB5' }} />
              </div>
              <h4 
                className="text-lg font-semibold mb-2"
                style={{ color: '#303150', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
              >
                שגיאה
              </h4>
              <div className="space-y-1 text-center">
                {errors.map((err, i) => (
                  <p key={i} style={{ color: '#F18AB5' }}>{err}</p>
                ))}
              </div>
            </div>
          )}

          {/* Parse errors list */}
          {errors.length > 0 && phase !== 'error' && (
            <div 
              className="mt-4 p-3 rounded-xl max-h-32 overflow-y-auto"
              style={{
                backgroundColor: 'rgba(241, 138, 181, 0.08)',
                border: '1px solid rgba(241, 138, 181, 0.2)',
              }}
            >
              <p className="text-sm font-medium mb-1" style={{ color: '#F18AB5' }}>שורות שלא זוהו:</p>
              {errors.slice(0, 5).map((err, i) => (
                <p key={i} className="text-xs" style={{ color: '#F18AB5', opacity: 0.8 }}>{translateError(err)}</p>
              ))}
              {errors.length > 5 && (
                <p className="text-xs mt-1" style={{ color: '#F18AB5', opacity: 0.7 }}>
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
              onClick={() => setPhase('importType')}
              className="btn-primary flex-1 justify-center"
            >
              <Upload className="w-4 h-4" />
              התחל ייבוא
            </button>
          )}

          {phase === 'dateFormat' && (
            <button
              onClick={handleStartImport}
              disabled={!detection?.isExcelSerial && dateFormat === 'AUTO' && !detection}
              className="btn-primary flex-1 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {detection && !showManualFormat && detection.confidence === 'high' ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  זה נכון, המשך
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  המשך לייבוא
                </>
              )}
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

          {phase === 'duplicates' && (
            <button
              onClick={saveTransactionsDespiteDuplicates}
              disabled={totalToImport === 0}
              className="btn-primary flex-1 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: totalToImport > 0 ? '#F59E0B' : undefined, 
                borderColor: totalToImport > 0 ? '#F59E0B' : undefined,
              }}
            >
              <CheckCircle className="w-4 h-4" />
              {totalToImport > 0 ? `ייבא ${totalToImport} עסקאות` : 'בחר עסקאות לייבוא'}
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
