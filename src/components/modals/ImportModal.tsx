'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
  ChevronRight,
  Check,
  CheckSquare,
  Square,
  Calendar,
  ArrowUpDown,
  CreditCard,
  Search,
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

// Custom Category Dropdown component with Portal, search filtering & keyboard nav
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
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<DropdownPosition>({ left: 0, width: 0, maxHeight: 320 });
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const selectedCategory = categories.find(c => c.id === value);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Track whether trigger is visible (not CSS-hidden by responsive layout)
  const [triggerVisible, setTriggerVisible] = useState(true);
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      setTriggerVisible(triggerRef.current.offsetParent !== null);
    }
  }, [isOpen]);

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.trim().toLowerCase();
    return categories.filter(c => c.nameHe.includes(q) || c.name.toLowerCase().includes(q));
  }, [categories, searchQuery]);

  // Reset search & focus when dropdown opens/closes
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setFocusedIndex(-1);
      requestAnimationFrame(() => searchInputRef.current?.focus());
    }
  }, [isOpen]);

  // Reset focused index when filtered results change
  useEffect(() => {
    setFocusedIndex(-1);
  }, [searchQuery]);

  // Scroll focused item into view
  useEffect(() => {
    if (focusedIndex < 0 || !listRef.current) return;
    const items = listRef.current.querySelectorAll('[data-cat-item]');
    items[focusedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [focusedIndex]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom - 16;
      const spaceAbove = rect.top - 16;
      const preferredHeight = 320;

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

  // Filter out scroll events originating from the dropdown's own list
  const handleScroll = useCallback((e: Event) => {
    if (dropdownRef.current?.contains(e.target as Node)) return;
    updatePosition();
  }, [updatePosition]);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', handleScroll, true);
      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [isOpen, updatePosition, handleScroll]);

  // Bounding-rect check instead of contains() -- handles scrollbar and portal edge cases
  // Skip registration entirely when trigger is CSS-hidden (responsive duplicate)
  useEffect(() => {
    if (!isOpen) return;
    if (triggerRef.current && triggerRef.current.offsetParent === null) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current) {
        const rect = dropdownRef.current.getBoundingClientRect();
        if (
          e.clientX >= rect.left && e.clientX <= rect.right &&
          e.clientY >= rect.top && e.clientY <= rect.bottom
        ) {
          return;
        }
      }
      if (triggerRef.current?.contains(e.target as Node)) {
        return;
      }
      onCloseRef.current();
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(prev => (prev + 1) % filteredCategories.length);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(prev => (prev <= 0 ? filteredCategories.length - 1 : prev - 1));
      return;
    }
    if (e.key === 'Enter' && focusedIndex >= 0 && focusedIndex < filteredCategories.length) {
      e.preventDefault();
      onChange(filteredCategories[focusedIndex].id);
      onClose();
    }
  }, [filteredCategories, focusedIndex, onChange, onClose]);

  const dropdownContent = (
    <div
      ref={dropdownRef}
      className="fixed z-[10000] bg-white rounded-xl shadow-lg flex flex-col"
      style={{
        top: position.top,
        bottom: position.bottom,
        left: position.left,
        width: position.width,
        maxHeight: position.maxHeight,
        border: '1px solid #E8E8ED',
      }}
      dir="rtl"
      onKeyDown={handleKeyDown}
    >
      {/* Sticky search input */}
      <div className="p-2 border-b" style={{ borderColor: '#F7F7F8' }}>
        <div className="relative">
          <Search
            className="absolute top-1/2 -translate-y-1/2 start-0 pointer-events-none"
            style={{ insetInlineStart: '0.625rem', color: '#BDBDCB', width: '0.875rem', height: '0.875rem' }}
          />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="חפש קטגוריה..."
            className="w-full ps-8 pe-3 py-1.5 rounded-lg text-sm outline-none transition-colors"
            style={{
              border: '1px solid #E8E8ED',
              color: '#303150',
              fontFamily: 'var(--font-nunito), system-ui, sans-serif',
              backgroundColor: '#F7F7F8',
            }}
            onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = '#69ADFF'; (e.target as HTMLInputElement).style.backgroundColor = '#FFFFFF'; }}
            onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = '#E8E8ED'; (e.target as HTMLInputElement).style.backgroundColor = '#F7F7F8'; }}
          />
        </div>
      </div>

      {/* Scrollable category list */}
      <div ref={listRef} className="flex-1 overflow-y-auto scrollbar-import p-1 relative">
        {filteredCategories.length === 0 ? (
          <div className="px-3 py-4 text-center">
            <p className="text-sm" style={{ color: '#BDBDCB', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}>
              לא נמצאו קטגוריות
            </p>
          </div>
        ) : (
          filteredCategories.map((cat, idx) => {
            const isSelected = cat.id === value;
            const isFocused = idx === focusedIndex;
            return (
              <button
                key={cat.id}
                type="button"
                data-cat-item
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange(cat.id);
                  onClose();
                }}
                onMouseEnter={() => setFocusedIndex(idx)}
                className="w-full px-3 py-2 rounded-lg text-sm font-medium text-right flex items-center justify-between gap-2 transition-colors"
                style={{
                  backgroundColor: isSelected
                    ? 'rgba(105, 173, 255, 0.15)'
                    : isFocused
                      ? '#F7F7F8'
                      : 'transparent',
                  color: isSelected ? '#69ADFF' : '#303150',
                  border: isSelected ? '2px solid rgba(105, 173, 255, 0.4)' : '2px solid transparent',
                  fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                }}
              >
                <span>{cat.nameHe}</span>
                {isSelected && <Check className="w-4 h-4" style={{ color: '#69ADFF' }} />}
              </button>
            );
          })
        )}
      </div>

      {/* Match count when filtering */}
      {searchQuery.trim() && filteredCategories.length > 0 && (
        <div className="px-3 py-1.5 border-t text-center" style={{ borderColor: '#F7F7F8' }}>
          <span className="text-xs" style={{ color: '#BDBDCB', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}>
            {filteredCategories.length} תוצאות
          </span>
        </div>
      )}
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

      {/* Dropdown via Portal -- skip for CSS-hidden responsive duplicates */}
      {mounted && isOpen && triggerVisible && createPortal(dropdownContent, document.body)}
    </div>
  );
}

// Mobile transaction card component for review
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

  // Unified category map: rowNum -> categoryId (pre-populated with AI categories, user can override)
  const [categoryMap, setCategoryMap] = useState<Record<number, string>>({});

  // Which transactions are selected for import (by rowNum). All selected by default.
  const [importSelection, setImportSelection] = useState<Set<number>>(new Set());

  // Track which dropdown is open (by rowNum)
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [openGroupDropdown, setOpenGroupDropdown] = useState<string | null>(null);

  // Ref for modal body scroll container
  const modalBodyRef = useRef<HTMLDivElement>(null);

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
    setCategoryMap({});
    setImportSelection(new Set());
    setOpenDropdown(null);
    setExpandedGroups(new Set());
    setOpenGroupDropdown(null);
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

      // Always show the unified review screen
      const allTxns = [...(data.transactions || []), ...(data.needsReview || [])];
      if (allTxns.length > 0) {
        const initialCategories: Record<number, string> = {};
        for (const t of (data.transactions || []) as ParsedTransaction[]) {
          if (t.category) initialCategories[t.rowNum] = t.category;
        }
        setCategoryMap(initialCategories);
        setImportSelection(new Set(allTxns.map((t: ParsedTransaction) => t.rowNum)));
        setPhase('review');
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

  // Handle category selection (works for both auto-classified and needs-review)
  const handleCategoryChange = (rowNum: number, category: string) => {
    setCategoryMap(prev => {
      const updated = { ...prev, [rowNum]: category };

      // After state update renders, scroll to next uncategorized transaction
      setTimeout(() => {
        const next = allTransactions.find(t => t.rowNum !== rowNum && !updated[t.rowNum]);
        if (!next) return;

        // Ensure the group is expanded
        const groupKey = next.merchantName.toLowerCase().trim();
        setExpandedGroups(prev => {
          if (prev.has(groupKey)) return prev;
          const n = new Set(prev);
          n.add(groupKey);
          return n;
        });

        setTimeout(() => {
          const el = rowRefs.current.get(next.rowNum);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setOpenDropdown(next.rowNum);
          }
        }, 100);
      }, 50);

      return updated;
    });
    setOpenDropdown(null);
  };

  // Complete review and save all selected transactions
  const handleCompleteReview = async () => {
    const selected = allTransactions.filter(t => importSelection.has(t.rowNum));
    const uncategorized = selected.filter(t => !categoryMap[t.rowNum]);
    if (uncategorized.length > 0) {
      setErrors(['נא לבחור קטגוריה לכל העסקאות שנבחרו לייבוא']);
      return;
    }

    const autoClassified = selected.filter(t =>
      t.category && t.category === categoryMap[t.rowNum]
    );
    const manuallyReviewed = selected.filter(t =>
      !t.category || t.category !== categoryMap[t.rowNum]
    ).map(t => ({ ...t, category: categoryMap[t.rowNum] }));

    await saveTransactions(autoClassified, manuallyReviewed);
  };

  // Get categories based on transaction type (includes custom categories)
  const getCategoriesForType = (type: 'income' | 'expense') => {
    const defaultCats = type === 'income' ? incomeCategories : expenseCategories;
    const customCats = getCustomByType(type);
    return [...defaultCats, ...customCats];
  };

  // === Grouping & bulk selection logic ===

  // Unified list of all transactions
  const allTransactions = useMemo(() => {
    return [...transactions, ...needsReview].sort((a, b) => a.rowNum - b.rowNum);
  }, [transactions, needsReview]);

  // Group all transactions by normalized merchant name
  const groupedByMerchant = useMemo(() => {
    const groups = new Map<string, ParsedTransaction[]>();
    allTransactions.forEach(t => {
      const key = t.merchantName.toLowerCase().trim();
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(t);
    });
    return Array.from(groups.entries())
      .map(([merchant, txns]) => {
        const needsClassification = txns.some(t => !categoryMap[t.rowNum]);
        return {
          merchant,
          displayName: txns[0].merchantName,
          transactions: txns,
          count: txns.length,
          type: txns[0].type,
          needsClassification,
        };
      })
      .sort((a, b) => {
        if (a.needsClassification !== b.needsClassification) {
          return a.needsClassification ? -1 : 1;
        }
        return b.count - a.count;
      });
  }, [allTransactions, categoryMap]);

  // Expand needs-review groups, collapse auto-classified
  useEffect(() => {
    if (phase === 'review') {
      const expanded = new Set<string>();
      allTransactions.forEach(t => {
        if (!categoryMap[t.rowNum]) {
          expanded.add(t.merchantName.toLowerCase().trim());
        }
      });
      setExpandedGroups(expanded);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Import selection helpers
  const toggleImport = useCallback((rowNum: number) => {
    setImportSelection(prev => {
      const next = new Set(prev);
      if (next.has(rowNum)) next.delete(rowNum);
      else next.add(rowNum);
      return next;
    });
  }, []);

  const toggleGroupImport = useCallback((merchant: string) => {
    const group = groupedByMerchant.find(g => g.merchant === merchant);
    if (!group) return;
    const rowNums = group.transactions.map(t => t.rowNum);
    setImportSelection(prev => {
      const next = new Set(prev);
      const allSelected = rowNums.every(rn => prev.has(rn));
      if (allSelected) rowNums.forEach(rn => next.delete(rn));
      else rowNums.forEach(rn => next.add(rn));
      return next;
    });
  }, [groupedByMerchant]);

  const toggleAllImport = useCallback(() => {
    if (importSelection.size === allTransactions.length) {
      setImportSelection(new Set());
    } else {
      setImportSelection(new Set(allTransactions.map(t => t.rowNum)));
    }
  }, [allTransactions, importSelection.size]);

  // Apply category to a whole merchant group
  const handleGroupCategoryChange = useCallback((merchant: string, category: string) => {
    const group = groupedByMerchant.find(g => g.merchant === merchant);
    if (!group) return;
    setCategoryMap(prev => {
      const next = { ...prev };
      group.transactions.forEach(t => {
        next[t.rowNum] = category;
      });
      return next;
    });
    setOpenGroupDropdown(null);
  }, [groupedByMerchant]);

  // Toggle group expand/collapse
  const toggleGroupExpanded = useCallback((merchant: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(merchant)) next.delete(merchant);
      else next.add(merchant);
      return next;
    });
  }, []);

  // Progress tracking
  const selectedCount = importSelection.size;
  const categorizedCount = useMemo(() => {
    return allTransactions.filter(t => importSelection.has(t.rowNum) && categoryMap[t.rowNum]).length;
  }, [allTransactions, importSelection, categoryMap]);

  const uncategorizedSelectedCount = selectedCount - categorizedCount;
  const needsReviewCount = needsReview.length;


  // Types present in review

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
        className="modal-content max-w-4xl h-[90vh] flex flex-col"
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
        <div ref={modalBodyRef} className="modal-body flex-1 overflow-y-auto scrollbar-import">
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

          {/* Review mode - Unified view of all transactions */}
          {phase === 'review' && (
            <div className="space-y-4">
              {/* Summary bar */}
              <div className="flex gap-2 flex-wrap text-sm">
                <span 
                  className="px-2.5 py-1 rounded-lg font-medium"
                  style={{ backgroundColor: 'rgba(105, 173, 255, 0.12)', color: '#69ADFF', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
                >
                  {allTransactions.length} עסקאות
                </span>
                <span 
                  className="px-2.5 py-1 rounded-lg font-medium"
                  style={{ backgroundColor: 'rgba(13, 186, 204, 0.12)', color: '#0DBACC', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
                >
                  {transactions.length} סווגו אוטומטית
                </span>
                {needsReviewCount > 0 && (
                  <span 
                    className="px-2.5 py-1 rounded-lg font-medium"
                    style={{ backgroundColor: 'rgba(241, 138, 181, 0.12)', color: '#F18AB5', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
                  >
                    {needsReviewCount} דורשות סיווג
                  </span>
                )}
                <span 
                  className="px-2.5 py-1 rounded-lg font-medium"
                  style={{ backgroundColor: '#F7F7F8', color: '#7E7F90', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
                >
                  {selectedCount} נבחרו לייבוא
                </span>
              </div>

              {/* Progress indicator */}
              {needsReviewCount > 0 && (
                <div className="rounded-xl p-3" style={{ backgroundColor: '#F7F7F8' }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium" style={{ color: '#7E7F90', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}>
                      התקדמות סיווג
                    </span>
                    <span className="text-xs font-bold" style={{ color: uncategorizedSelectedCount === 0 ? '#0DBACC' : '#303150', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}>
                      {categorizedCount} / {selectedCount}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full" style={{ backgroundColor: '#E8E8ED' }}>
                    <div 
                      className="h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${selectedCount > 0 ? (categorizedCount / selectedCount) * 100 : 0}%`,
                        backgroundColor: uncategorizedSelectedCount === 0 ? '#0DBACC' : '#69ADFF',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Import selection toolbar */}
              <div 
                className="flex items-center gap-3 rounded-xl px-3 py-2"
                style={{ backgroundColor: '#F7F7F8', border: '1px solid #E8E8ED' }}
              >
                <button
                  type="button"
                  onClick={toggleAllImport}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: importSelection.size === allTransactions.length ? 'rgba(105, 173, 255, 0.15)' : 'white',
                    color: importSelection.size === allTransactions.length ? '#69ADFF' : '#7E7F90',
                    border: '1px solid',
                    borderColor: importSelection.size === allTransactions.length ? 'rgba(105, 173, 255, 0.3)' : '#E8E8ED',
                    fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                  }}
                >
                  {importSelection.size === allTransactions.length ? (
                    <><CheckSquare className="w-3.5 h-3.5" /> בטל בחירת הכל</>
                  ) : (
                    <><Square className="w-3.5 h-3.5" /> בחר הכל לייבוא</>
                  )}
                </button>
              </div>

              {/* Grouped transactions */}
              {categoriesLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
                  <p className="text-[#303150] font-medium">טוען קטגוריות...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Section: Needs Classification */}
                  {groupedByMerchant.some(g => g.needsClassification) && (
                    <>
                      <div className="flex items-center gap-2 pt-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#F18AB5' }} />
                        <span className="text-xs font-semibold" style={{ color: '#F18AB5', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}>
                          דורש סיווג ({groupedByMerchant.filter(g => g.needsClassification).length})
                        </span>
                        <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(241, 138, 181, 0.2)' }} />
                      </div>
                      {groupedByMerchant.filter(g => g.needsClassification).map(group => {
                        const isExpanded = expandedGroups.has(group.merchant);
                        const groupFullyCategorized = group.transactions.every(t => categoryMap[t.rowNum]);
                        const groupImportAll = group.transactions.every(t => importSelection.has(t.rowNum));
                        const groupImportSome = group.transactions.some(t => importSelection.has(t.rowNum));

                        return (
                          <div 
                            key={group.merchant}
                            className="rounded-xl overflow-hidden transition-all"
                            style={{ 
                              border: groupFullyCategorized 
                                ? '1px solid rgba(13, 186, 204, 0.3)' 
                                : '1px solid rgba(241, 138, 181, 0.25)',
                              backgroundColor: groupFullyCategorized ? 'rgba(13, 186, 204, 0.03)' : 'white',
                            }}
                          >
                            <div 
                              className="flex items-center gap-2 px-3 py-2.5 cursor-pointer select-none"
                              style={{ backgroundColor: groupFullyCategorized ? 'rgba(13, 186, 204, 0.06)' : 'rgba(241, 138, 181, 0.04)' }}
                            >
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); toggleGroupImport(group.merchant); }}
                                className={cn(
                                  'w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors',
                                  groupImportAll ? 'bg-[#69ADFF]' : groupImportSome ? 'bg-[#69ADFF]/50' : 'bg-white border-2 border-[#E8E8ED]'
                                )}
                              >
                                {(groupImportAll || groupImportSome) && <Check className="w-3.5 h-3.5 text-white" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleGroupExpanded(group.merchant)}
                                className="flex items-center gap-2 flex-1 min-w-0"
                              >
                                <ChevronRight 
                                  className={cn('w-4 h-4 flex-shrink-0 transition-transform', isExpanded && 'rotate-90')}
                                  style={{ color: '#7E7F90' }}
                                />
                                <SensitiveData 
                                  className="font-medium text-sm truncate"
                                  style={{ color: '#303150', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
                                >
                                  {group.displayName}
                                </SensitiveData>
                                <span 
                                  className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0"
                                  style={{ 
                                    backgroundColor: groupFullyCategorized ? 'rgba(13, 186, 204, 0.15)' : 'rgba(241, 138, 181, 0.15)',
                                    color: groupFullyCategorized ? '#0DBACC' : '#F18AB5',
                                    fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                                  }}
                                >
                                  {group.count}
                                </span>
                                {groupFullyCategorized && (
                                  <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#0DBACC' }} />
                                )}
                              </button>
                              {group.count > 1 && (
                                <div className="flex-shrink-0 w-[140px]" onClick={(e) => e.stopPropagation()}>
                                  <CategoryDropdown
                                    value={
                                      group.transactions.every(t => categoryMap[t.rowNum] && categoryMap[t.rowNum] === categoryMap[group.transactions[0].rowNum])
                                        ? categoryMap[group.transactions[0].rowNum] || ''
                                        : ''
                                    }
                                    onChange={(value) => handleGroupCategoryChange(group.merchant, value)}
                                    categories={getCategoriesForType(group.type)}
                                    isOpen={openGroupDropdown === group.merchant}
                                    onToggle={() => setOpenGroupDropdown(openGroupDropdown === group.merchant ? null : group.merchant)}
                                    onClose={() => setOpenGroupDropdown(null)}
                                  />
                                </div>
                              )}
                            </div>
                            {isExpanded && (
                              <div>
                                <div className="hidden md:block">
                                  {group.transactions.map((t, idx) => {
                                    const isImported = importSelection.has(t.rowNum);
                                    const hasCat = !!categoryMap[t.rowNum];
                                    return (
                                      <div
                                        key={t.rowNum}
                                        ref={(el) => setRowRef(t.rowNum, el)}
                                        className="flex items-center gap-3 px-3 py-2.5 transition-colors"
                                        style={{ 
                                          borderTop: idx === 0 ? '1px solid #F7F7F8' : 'none',
                                          borderBottom: '1px solid #F7F7F8',
                                          backgroundColor: hasCat ? 'rgba(13, 186, 204, 0.02)' : 'transparent',
                                          opacity: isImported ? 1 : 0.5,
                                        }}
                                      >
                                        <button
                                          type="button"
                                          onClick={() => toggleImport(t.rowNum)}
                                          className={cn(
                                            'w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors',
                                            isImported ? 'bg-[#69ADFF]' : 'bg-white border-2 border-[#E8E8ED]'
                                          )}
                                        >
                                          {isImported && <Check className="w-3.5 h-3.5 text-white" />}
                                        </button>
                                        <SensitiveData className="text-sm flex-1 min-w-0 truncate" style={{ color: '#303150' }}>
                                          {t.merchantName}
                                        </SensitiveData>
                                        <SensitiveData 
                                          className="text-sm font-medium flex-shrink-0 w-24 text-left"
                                          style={{ color: t.type === 'income' ? '#0DBACC' : '#F18AB5' }}
                                          dir="ltr"
                                        >
                                          {`${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}`}
                                        </SensitiveData>
                                        <span className="text-xs flex-shrink-0 w-20" style={{ color: '#7E7F90' }}>
                                          {new Date(t.date).toLocaleDateString('he-IL')}
                                        </span>
                                        <div className="flex-shrink-0 w-[140px]">
                                          <CategoryDropdown
                                            value={categoryMap[t.rowNum] || ''}
                                            onChange={(value) => handleCategoryChange(t.rowNum, value)}
                                            categories={getCategoriesForType(t.type)}
                                            isOpen={openDropdown === t.rowNum}
                                            onToggle={() => setOpenDropdown(openDropdown === t.rowNum ? null : t.rowNum)}
                                            onClose={() => setOpenDropdown(null)}
                                          />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                                <div className="md:hidden space-y-0">
                                  {group.transactions.map((t) => {
                                    const isImported = importSelection.has(t.rowNum);
                                    const hasCat = !!categoryMap[t.rowNum];
                                    return (
                                      <div
                                        key={t.rowNum}
                                        ref={(el) => setRowRef(t.rowNum, el as HTMLElement)}
                                        className="p-3 space-y-2 transition-colors"
                                        style={{ 
                                          borderTop: '1px solid #F7F7F8',
                                          backgroundColor: hasCat ? 'rgba(13, 186, 204, 0.02)' : 'transparent',
                                          opacity: isImported ? 1 : 0.5,
                                        }}
                                      >
                                        <div className="flex items-center gap-3">
                                          <button
                                            type="button"
                                            onClick={() => toggleImport(t.rowNum)}
                                            className={cn(
                                              'w-6 h-6 rounded flex items-center justify-center flex-shrink-0 transition-colors',
                                              isImported ? 'bg-[#69ADFF]' : 'bg-white border-2 border-[#E8E8ED]'
                                            )}
                                          >
                                            {isImported && <Check className="w-4 h-4 text-white" />}
                                          </button>
                                          <div className="flex-1 min-w-0">
                                            <SensitiveData className="font-medium text-sm truncate" style={{ color: '#303150' }}>
                                              {t.merchantName}
                                            </SensitiveData>
                                            <div className="flex items-center gap-2 mt-0.5">
                                              <span className="text-xs" style={{ color: '#7E7F90' }}>
                                                {new Date(t.date).toLocaleDateString('he-IL')}
                                              </span>
                                              <SensitiveData 
                                                className="text-xs font-medium"
                                                style={{ color: t.type === 'income' ? '#0DBACC' : '#F18AB5' }}
                                                dir="ltr"
                                              >
                                                {`${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}`}
                                              </SensitiveData>
                                            </div>
                                          </div>
                                        </div>
                                        <CategoryDropdown
                                          value={categoryMap[t.rowNum] || ''}
                                          onChange={(value) => handleCategoryChange(t.rowNum, value)}
                                          categories={getCategoriesForType(t.type)}
                                          isOpen={openDropdown === t.rowNum}
                                          onToggle={() => setOpenDropdown(openDropdown === t.rowNum ? null : t.rowNum)}
                                          onClose={() => setOpenDropdown(null)}
                                        />
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </>
                  )}

                  {/* Section: Auto-classified */}
                  {groupedByMerchant.some(g => !g.needsClassification) && (
                    <>
                      <div className="flex items-center gap-2 pt-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#0DBACC' }} />
                        <span className="text-xs font-semibold" style={{ color: '#0DBACC', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}>
                          סווג אוטומטית ({groupedByMerchant.filter(g => !g.needsClassification).length})
                        </span>
                        <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(13, 186, 204, 0.2)' }} />
                      </div>
                      {groupedByMerchant.filter(g => !g.needsClassification).map(group => {
                        const isExpanded = expandedGroups.has(group.merchant);
                        const groupImportAll = group.transactions.every(t => importSelection.has(t.rowNum));
                        const groupImportSome = group.transactions.some(t => importSelection.has(t.rowNum));
                        const commonCat = group.transactions.every(t => categoryMap[t.rowNum] === categoryMap[group.transactions[0].rowNum])
                          ? categoryMap[group.transactions[0].rowNum]
                          : null;
                        const catInfo = commonCat ? getCategoriesForType(group.type).find(c => c.id === commonCat) : null;

                        return (
                          <div 
                            key={group.merchant}
                            className="rounded-xl overflow-hidden transition-all"
                            style={{ 
                              border: '1px solid rgba(13, 186, 204, 0.2)',
                              backgroundColor: 'rgba(13, 186, 204, 0.02)',
                            }}
                          >
                            <div 
                              className="flex items-center gap-2 px-3 py-2.5 cursor-pointer select-none"
                              style={{ backgroundColor: 'rgba(13, 186, 204, 0.05)' }}
                            >
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); toggleGroupImport(group.merchant); }}
                                className={cn(
                                  'w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors',
                                  groupImportAll ? 'bg-[#0DBACC]' : groupImportSome ? 'bg-[#0DBACC]/50' : 'bg-white border-2 border-[#E8E8ED]'
                                )}
                              >
                                {(groupImportAll || groupImportSome) && <Check className="w-3.5 h-3.5 text-white" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleGroupExpanded(group.merchant)}
                                className="flex items-center gap-2 flex-1 min-w-0"
                              >
                                <ChevronRight 
                                  className={cn('w-4 h-4 flex-shrink-0 transition-transform', isExpanded && 'rotate-90')}
                                  style={{ color: '#7E7F90' }}
                                />
                                <SensitiveData 
                                  className="font-medium text-sm truncate"
                                  style={{ color: '#303150', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
                                >
                                  {group.displayName}
                                </SensitiveData>
                                <span 
                                  className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0"
                                  style={{ 
                                    backgroundColor: 'rgba(13, 186, 204, 0.15)',
                                    color: '#0DBACC',
                                    fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                                  }}
                                >
                                  {group.count}
                                </span>
                                {catInfo && (
                                  <span className="text-xs truncate" style={{ color: '#0DBACC' }}>
                                    {catInfo.nameHe}
                                  </span>
                                )}
                                <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#0DBACC' }} />
                              </button>
                            </div>
                            {isExpanded && (
                              <div>
                                <div className="hidden md:block">
                                  {group.transactions.map((t, idx) => {
                                    const isImported = importSelection.has(t.rowNum);
                                    return (
                                      <div
                                        key={t.rowNum}
                                        ref={(el) => setRowRef(t.rowNum, el)}
                                        className="flex items-center gap-3 px-3 py-2.5 transition-colors"
                                        style={{ 
                                          borderTop: idx === 0 ? '1px solid #F7F7F8' : 'none',
                                          borderBottom: '1px solid #F7F7F8',
                                          backgroundColor: 'rgba(13, 186, 204, 0.02)',
                                          opacity: isImported ? 1 : 0.5,
                                        }}
                                      >
                                        <button
                                          type="button"
                                          onClick={() => toggleImport(t.rowNum)}
                                          className={cn(
                                            'w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors',
                                            isImported ? 'bg-[#0DBACC]' : 'bg-white border-2 border-[#E8E8ED]'
                                          )}
                                        >
                                          {isImported && <Check className="w-3.5 h-3.5 text-white" />}
                                        </button>
                                        <SensitiveData className="text-sm flex-1 min-w-0 truncate" style={{ color: '#303150' }}>
                                          {t.merchantName}
                                        </SensitiveData>
                                        <SensitiveData 
                                          className="text-sm font-medium flex-shrink-0 w-24 text-left"
                                          style={{ color: t.type === 'income' ? '#0DBACC' : '#F18AB5' }}
                                          dir="ltr"
                                        >
                                          {`${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}`}
                                        </SensitiveData>
                                        <span className="text-xs flex-shrink-0 w-20" style={{ color: '#7E7F90' }}>
                                          {new Date(t.date).toLocaleDateString('he-IL')}
                                        </span>
                                        <div className="flex-shrink-0 w-[140px]">
                                          <CategoryDropdown
                                            value={categoryMap[t.rowNum] || ''}
                                            onChange={(value) => handleCategoryChange(t.rowNum, value)}
                                            categories={getCategoriesForType(t.type)}
                                            isOpen={openDropdown === t.rowNum}
                                            onToggle={() => setOpenDropdown(openDropdown === t.rowNum ? null : t.rowNum)}
                                            onClose={() => setOpenDropdown(null)}
                                          />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                                <div className="md:hidden space-y-0">
                                  {group.transactions.map((t) => {
                                    const isImported = importSelection.has(t.rowNum);
                                    return (
                                      <div
                                        key={t.rowNum}
                                        ref={(el) => setRowRef(t.rowNum, el as HTMLElement)}
                                        className="p-3 space-y-2 transition-colors"
                                        style={{ borderTop: '1px solid #F7F7F8', opacity: isImported ? 1 : 0.5 }}
                                      >
                                        <div className="flex items-center gap-3">
                                          <button
                                            type="button"
                                            onClick={() => toggleImport(t.rowNum)}
                                            className={cn(
                                              'w-6 h-6 rounded flex items-center justify-center flex-shrink-0 transition-colors',
                                              isImported ? 'bg-[#0DBACC]' : 'bg-white border-2 border-[#E8E8ED]'
                                            )}
                                          >
                                            {isImported && <Check className="w-4 h-4 text-white" />}
                                          </button>
                                          <div className="flex-1 min-w-0">
                                            <SensitiveData className="font-medium text-sm truncate" style={{ color: '#303150' }}>
                                              {t.merchantName}
                                            </SensitiveData>
                                            <div className="flex items-center gap-2 mt-0.5">
                                              <span className="text-xs" style={{ color: '#7E7F90' }}>
                                                {new Date(t.date).toLocaleDateString('he-IL')}
                                              </span>
                                              <SensitiveData 
                                                className="text-xs font-medium"
                                                style={{ color: t.type === 'income' ? '#0DBACC' : '#F18AB5' }}
                                                dir="ltr"
                                              >
                                                {`${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}`}
                                              </SensitiveData>
                                            </div>
                                          </div>
                                        </div>
                                        <CategoryDropdown
                                          value={categoryMap[t.rowNum] || ''}
                                          onChange={(value) => handleCategoryChange(t.rowNum, value)}
                                          categories={getCategoriesForType(t.type)}
                                          isOpen={openDropdown === t.rowNum}
                                          onToggle={() => setOpenDropdown(openDropdown === t.rowNum ? null : t.rowNum)}
                                          onClose={() => setOpenDropdown(null)}
                                        />
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
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
              disabled={selectedCount === 0 || uncategorizedSelectedCount > 0}
              className="btn-primary flex-1 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {uncategorizedSelectedCount > 0
                ? `נותרו ${uncategorizedSelectedCount} ללא סיווג`
                : `ייבא ${selectedCount} עסקאות`}
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
