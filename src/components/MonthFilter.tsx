'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Check } from 'lucide-react';

interface MonthFilterProps {
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  allMonths: string[];
  monthsWithData: Set<string>;
  currentMonth: string;
  variant?: 'light' | 'dark';
  /** Compact mode for mobile - shows only short date format */
  compact?: boolean;
}

const monthNames: { [key: string]: string } = {
  '01': 'ינואר',
  '02': 'פברואר',
  '03': 'מרץ',
  '04': 'אפריל',
  '05': 'מאי',
  '06': 'יוני',
  '07': 'יולי',
  '08': 'אוגוסט',
  '09': 'ספטמבר',
  '10': 'אוקטובר',
  '11': 'נובמבר',
  '12': 'דצמבר',
};

function formatMonthDisplay(monthKey: string, compact = false): string {
  if (monthKey === 'all') return compact ? 'הכל' : 'כל החודשים';

  const [year, month] = monthKey.split('-');
  if (compact) {
    return `${month}/${year.slice(2)}`;
  }
  return `${monthNames[month]} ${year}`;
}

export default function MonthFilter({
  selectedMonth,
  onMonthChange,
  allMonths,
  monthsWithData,
  currentMonth,
  variant = 'light',
  compact = false,
}: MonthFilterProps) {
  const isDark = variant === 'dark';
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentMonthRef = useRef<HTMLButtonElement>(null);

  // Scroll to current month when dropdown opens
  useEffect(() => {
    if (isOpen && currentMonthRef.current) {
      // Small delay to ensure dropdown is rendered
      setTimeout(() => {
        currentMonthRef.current?.scrollIntoView({
          block: 'center',
          behavior: 'auto'
        });
      }, 10);
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Group months by category
  // Past months: oldest first (top) to newest (bottom, closest to current)
  const pastMonths = allMonths.filter(m => m < currentMonth);
  // Future months: closest first (top) to farthest (bottom)
  const futureMonths = allMonths.filter(m => m > currentMonth);

  const handleSelect = (monthKey: string) => {
    onMonthChange(monthKey);
    setIsOpen(false);
  };

  const renderMonthOption = (monthKey: string) => {
    const hasData = monthsWithData.has(monthKey);
    const isSelected = selectedMonth === monthKey;
    const isCurrent = monthKey === currentMonth;

    return (
      <button
        key={monthKey}
        ref={isCurrent ? currentMonthRef : undefined}
        onClick={() => handleSelect(monthKey)}
        className={`month-option ${isSelected ? 'selected' : ''} ${hasData ? 'has-data' : 'no-data'} ${isCurrent ? 'current' : ''}`}
      >
        <span className={`indicator ${hasData ? 'bg-emerald-500' : 'bg-slate-300'}`} />
        <span className="flex-1 text-right">{formatMonthDisplay(monthKey)}</span>
        {isSelected && <Check className="w-4 h-4 text-blue-400" />}
        {isCurrent && !isSelected && (
          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">נוכחי</span>
        )}
      </button>
    );
  };

  return (
    <div className="relative" ref={dropdownRef} >
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 rounded-xl transition-all ${compact
          ? 'px-2.5 py-2'
          : 'gap-3 px-4 py-2 min-w-[180px]'
          } ${isDark
            ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 border-0 shadow-md'
            : 'bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-sm'
          }`}
      >
        <Calendar className={`w-5 h-5 flex-shrink-0 ${isDark ? 'text-white' : 'text-blue-400'}`} />
        <span className={`text-right font-medium whitespace-nowrap ${compact ? 'text-sm' : 'flex-1'} ${isDark ? 'text-white' : 'text-slate-800'}`}>
          {formatMonthDisplay(selectedMonth, compact)}
        </span>
        <ChevronDown
          className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${isDark ? 'text-white' : 'text-slate-500'}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="month-dropdown animate-scale-in">
          {/* All Months Option */}
          <button
            onClick={() => handleSelect('all')}
            className={`month-option all-months ${selectedMonth === 'all' ? 'selected' : ''}`}
          >
            <Calendar className="w-4 h-4 text-blue-400" />
            <span className="flex-1 text-right font-medium">כל החודשים</span>
            {selectedMonth === 'all' && <Check className="w-4 h-4 text-blue-400" />}
          </button>

          <div className="border-t border-slate-100 my-1" />

          {/* Past Months (oldest at top, newest at bottom) */}
          {pastMonths.length > 0 && (
            <>
              <div className="month-group-header">חודשים קודמים</div>
              {pastMonths.map(renderMonthOption)}
            </>
          )}

          {/* Current Month */}
          <div className="month-group-header">החודש הנוכחי</div>
          {renderMonthOption(currentMonth)}

          {/* Future Months (closest at top, farthest at bottom) */}
          {futureMonths.length > 0 && (
            <>
              <div className="month-group-header">חודשים עתידיים</div>
              {futureMonths.map(renderMonthOption)}
            </>
          )}
        </div>
      )}
    </div>
  );
}
