'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Search, ListFilter, ArrowUpDown, X } from 'lucide-react';
import {
  FINANCE_RECORD_TYPE_LABELS,
  SUBSCRIPTION_STATUS_LABELS,
  TRANSACTION_STATUS_LABELS,
} from '@/types/admin-cfo';
import type { FilterConfig, SortConfig, SubSortKey, TxnSortKey } from './CfoBoard';

interface CfoToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  filterConfig: FilterConfig;
  onFilterChange: (config: FilterConfig) => void;
  sortConfigSubs: SortConfig<SubSortKey>;
  onSortSubsChange: (config: SortConfig<SubSortKey>) => void;
  sortConfigTxns: SortConfig<TxnSortKey>;
  onSortTxnsChange: (config: SortConfig<TxnSortKey>) => void;
  onClearFilters: () => void;
  availableCategories: string[];
}

const ALL_STATUSES = [
  { value: 'ACTIVE', label: SUBSCRIPTION_STATUS_LABELS.ACTIVE },
  { value: 'REVIEWING', label: SUBSCRIPTION_STATUS_LABELS.REVIEWING },
  { value: 'CANCELED', label: SUBSCRIPTION_STATUS_LABELS.CANCELED },
  { value: 'COMPLETED', label: TRANSACTION_STATUS_LABELS.COMPLETED },
  { value: 'PENDING', label: TRANSACTION_STATUS_LABELS.PENDING },
];

const TYPE_OPTIONS: { value: FilterConfig['type']; label: string }[] = [
  { value: 'ALL', label: 'הכל' },
  { value: 'INCOME', label: FINANCE_RECORD_TYPE_LABELS.INCOME },
  { value: 'EXPENSE', label: FINANCE_RECORD_TYPE_LABELS.EXPENSE },
];

const SUB_SORT_KEY_LABELS: Record<SubSortKey, string> = {
  title: 'שם',
  amount: 'סכום',
  nextBillingDate: 'תאריך חיוב',
};

const TXN_SORT_KEY_LABELS: Record<TxnSortKey, string> = {
  title: 'שם',
  amount: 'סכום',
  date: 'תאריך',
};

const DIRECTION_LABELS: Record<'asc' | 'desc', string> = {
  asc: 'עולה',
  desc: 'יורד',
};

function usePortalDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPosition({ top: rect.bottom + 6, left: rect.left });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return { isOpen, setIsOpen, position, mounted, triggerRef, dropdownRef };
}

export default function CfoToolbar({
  searchQuery,
  onSearchChange,
  filterConfig,
  onFilterChange,
  sortConfigSubs,
  onSortSubsChange,
  sortConfigTxns,
  onSortTxnsChange,
  onClearFilters,
  availableCategories,
}: CfoToolbarProps) {
  const filter = usePortalDropdown();
  const sortSubs = usePortalDropdown();
  const sortTxns = usePortalDropdown();

  const hasActiveFilters =
    searchQuery !== '' || filterConfig.type !== 'ALL' || filterConfig.status.length > 0 || filterConfig.category !== '';

  const activeFilterCount =
    (filterConfig.type !== 'ALL' ? 1 : 0) + filterConfig.status.length + (filterConfig.category ? 1 : 0);

  const toggleStatus = (status: string) => {
    const current = filterConfig.status;
    const next = current.includes(status)
      ? current.filter((s) => s !== status)
      : [...current, status];
    onFilterChange({ ...filterConfig, status: next });
  };

  return (
    <div className="flex items-center gap-3 flex-wrap" dir="rtl">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-[320px]">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7E7F90] pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="חפש..."
          className="w-full h-9 pe-9 ps-3 rounded-lg border border-[#E8E8ED] bg-white text-sm text-[#303150] placeholder:text-[#B0B1C0] focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-colors"
        />
      </div>

      {/* Filter */}
      <button
        ref={filter.triggerRef}
        type="button"
        onClick={() => filter.setIsOpen(!filter.isOpen)}
        className={`flex items-center gap-1.5 h-9 px-3 rounded-lg border text-sm font-medium transition-colors ${
          activeFilterCount > 0
            ? 'border-indigo-400 bg-indigo-50 text-indigo-600'
            : 'border-[#E8E8ED] bg-white text-[#303150] hover:bg-[#F7F7F8]'
        }`}
      >
        <ListFilter className="w-4 h-4" />
        <span>סינון</span>
        {activeFilterCount > 0 && (
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Sort Subscriptions */}
      <button
        ref={sortSubs.triggerRef}
        type="button"
        onClick={() => sortSubs.setIsOpen(!sortSubs.isOpen)}
        className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[#E8E8ED] bg-white text-sm font-medium text-[#303150] hover:bg-[#F7F7F8] transition-colors"
      >
        <ArrowUpDown className="w-4 h-4" />
        <span>מיון מנויים</span>
      </button>

      {/* Sort Transactions */}
      <button
        ref={sortTxns.triggerRef}
        type="button"
        onClick={() => sortTxns.setIsOpen(!sortTxns.isOpen)}
        className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[#E8E8ED] bg-white text-sm font-medium text-[#303150] hover:bg-[#F7F7F8] transition-colors"
      >
        <ArrowUpDown className="w-4 h-4" />
        <span>מיון תנועות</span>
      </button>

      {/* Clear */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={onClearFilters}
          className="flex items-center gap-1 h-9 px-3 rounded-lg text-sm font-medium text-[#7E7F90] hover:text-[#E2445C] transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          <span>נקה סינון</span>
        </button>
      )}

      {/* ─── Filter Dropdown ─────────────────────────────────────── */}
      {filter.isOpen && filter.mounted && createPortal(
        <div
          ref={filter.dropdownRef}
          className="fixed z-[10000] bg-white rounded-xl py-3 px-4 w-[260px]"
          style={{
            top: filter.position.top,
            left: filter.position.left,
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.12)',
            border: '1px solid #F7F7F8',
          }}
          dir="rtl"
        >
          <p className="text-xs font-bold text-[#303150] mb-2">סוג</p>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onFilterChange({ ...filterConfig, type: opt.value })}
                className={`h-7 px-3 rounded-md text-xs font-medium transition-colors ${
                  filterConfig.type === opt.value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-[#F7F7F8] text-[#303150] hover:bg-[#EDEDF0]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <p className="text-xs font-bold text-[#303150] mb-2">סטטוס</p>
          <div className="space-y-1.5 mb-4">
            {ALL_STATUSES.map((s) => (
              <label
                key={s.value}
                className="flex items-center gap-2 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={filterConfig.status.includes(s.value)}
                  onChange={() => toggleStatus(s.value)}
                  className="w-4 h-4 rounded border-[#E8E8ED] text-indigo-600 focus:ring-indigo-400 accent-indigo-600"
                />
                <span className="text-sm text-[#303150] group-hover:text-indigo-600 transition-colors">
                  {s.label}
                </span>
              </label>
            ))}
          </div>

          {availableCategories.length > 0 && (
            <>
              <p className="text-xs font-bold text-[#303150] mb-2">קטגוריה</p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => onFilterChange({ ...filterConfig, category: '' })}
                  className={`h-7 px-3 rounded-md text-xs font-medium transition-colors ${
                    filterConfig.category === ''
                      ? 'bg-indigo-600 text-white'
                      : 'bg-[#F7F7F8] text-[#303150] hover:bg-[#EDEDF0]'
                  }`}
                >
                  הכל
                </button>
                {availableCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => onFilterChange({ ...filterConfig, category: cat })}
                    className={`h-7 px-3 rounded-md text-xs font-medium transition-colors ${
                      filterConfig.category === cat
                        ? 'bg-indigo-600 text-white'
                        : 'bg-[#F7F7F8] text-[#303150] hover:bg-[#EDEDF0]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>,
        document.body
      )}

      {/* ─── Sort Subscriptions Dropdown ─────────────────────────── */}
      {sortSubs.isOpen && sortSubs.mounted && createPortal(
        <div
          ref={sortSubs.dropdownRef}
          className="fixed z-[10000] bg-white rounded-xl py-3 px-4 w-[220px]"
          style={{
            top: sortSubs.position.top,
            left: sortSubs.position.left,
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.12)',
            border: '1px solid #F7F7F8',
          }}
          dir="rtl"
        >
          <p className="text-xs font-bold text-[#303150] mb-2">מיון לפי</p>
          <div className="space-y-1 mb-3">
            {(Object.keys(SUB_SORT_KEY_LABELS) as SubSortKey[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => onSortSubsChange({ ...sortConfigSubs, key: k })}
                className={`w-full text-start h-7 px-2 rounded-md text-sm transition-colors ${
                  sortConfigSubs.key === k
                    ? 'bg-indigo-50 text-indigo-600 font-medium'
                    : 'text-[#303150] hover:bg-[#F7F7F8]'
                }`}
              >
                {SUB_SORT_KEY_LABELS[k]}
              </button>
            ))}
          </div>

          <p className="text-xs font-bold text-[#303150] mb-2">כיוון</p>
          <div className="flex gap-1.5">
            {(['asc', 'desc'] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => onSortSubsChange({ ...sortConfigSubs, direction: d })}
                className={`flex-1 h-7 rounded-md text-xs font-medium transition-colors ${
                  sortConfigSubs.direction === d
                    ? 'bg-indigo-600 text-white'
                    : 'bg-[#F7F7F8] text-[#303150] hover:bg-[#EDEDF0]'
                }`}
              >
                {DIRECTION_LABELS[d]}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}

      {/* ─── Sort Transactions Dropdown ──────────────────────────── */}
      {sortTxns.isOpen && sortTxns.mounted && createPortal(
        <div
          ref={sortTxns.dropdownRef}
          className="fixed z-[10000] bg-white rounded-xl py-3 px-4 w-[220px]"
          style={{
            top: sortTxns.position.top,
            left: sortTxns.position.left,
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.12)',
            border: '1px solid #F7F7F8',
          }}
          dir="rtl"
        >
          <p className="text-xs font-bold text-[#303150] mb-2">מיון לפי</p>
          <div className="space-y-1 mb-3">
            {(Object.keys(TXN_SORT_KEY_LABELS) as TxnSortKey[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => onSortTxnsChange({ ...sortConfigTxns, key: k })}
                className={`w-full text-start h-7 px-2 rounded-md text-sm transition-colors ${
                  sortConfigTxns.key === k
                    ? 'bg-indigo-50 text-indigo-600 font-medium'
                    : 'text-[#303150] hover:bg-[#F7F7F8]'
                }`}
              >
                {TXN_SORT_KEY_LABELS[k]}
              </button>
            ))}
          </div>

          <p className="text-xs font-bold text-[#303150] mb-2">כיוון</p>
          <div className="flex gap-1.5">
            {(['asc', 'desc'] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => onSortTxnsChange({ ...sortConfigTxns, direction: d })}
                className={`flex-1 h-7 rounded-md text-xs font-medium transition-colors ${
                  sortConfigTxns.direction === d
                    ? 'bg-indigo-600 text-white'
                    : 'bg-[#F7F7F8] text-[#303150] hover:bg-[#EDEDF0]'
                }`}
              >
                {DIRECTION_LABELS[d]}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
