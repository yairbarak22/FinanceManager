'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Check, CalendarRange, X } from 'lucide-react';
import { useMonth, CustomDateRange } from '@/context/MonthContext';

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
  if (monthKey === 'custom') return compact ? 'מותאם' : 'תאריכים מותאמים';

  const [year, month] = monthKey.split('-');
  if (compact) {
    return `${month}/${year.slice(2)}`;
  }
  return `${monthNames[month]} ${year}`;
}

function formatDateHebrew(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

function formatDateRangeDisplay(range: CustomDateRange, compact = false): string {
  if (compact) {
    const [, m1, d1] = range.start.split('-');
    const [, m2, d2] = range.end.split('-');
    return `${d1}/${m1} - ${d2}/${m2}`;
  }
  return `${formatDateHebrew(range.start)} - ${formatDateHebrew(range.end)}`;
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
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateError, setDateError] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentMonthRef = useRef<HTMLButtonElement>(null);

  // Get customDateRange from context
  const { customDateRange, setCustomDateRange } = useMonth();

  // Initialize date inputs when custom range exists
  useEffect(() => {
    if (customDateRange) {
      setStartDate(customDateRange.start);
      setEndDate(customDateRange.end);
    }
  }, [customDateRange]);

  // Scroll to current month when dropdown opens
  useEffect(() => {
    if (isOpen && currentMonthRef.current && !showDatePicker) {
      // Small delay to ensure dropdown is rendered
      setTimeout(() => {
        currentMonthRef.current?.scrollIntoView({
          block: 'center',
          behavior: 'auto'
        });
      }, 10);
    }
  }, [isOpen, showDatePicker]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowDatePicker(false);
        setDateError('');
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
    setShowDatePicker(false);
    setDateError('');
  };

  const handleCustomDateClick = () => {
    setShowDatePicker(true);
    setDateError('');
    // Pre-fill with current range or default to current month range
    if (!startDate && !endDate) {
      const today = new Date();
      const firstOfMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
      const lastOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const lastDay = `${lastOfMonth.getFullYear()}-${String(lastOfMonth.getMonth() + 1).padStart(2, '0')}-${String(lastOfMonth.getDate()).padStart(2, '0')}`;
      setStartDate(firstOfMonth);
      setEndDate(lastDay);
    }
  };

  const handleApplyDateRange = () => {
    if (!startDate || !endDate) {
      setDateError('יש לבחור תאריך התחלה ותאריך סיום');
      return;
    }
    if (startDate > endDate) {
      setDateError('תאריך ההתחלה חייב להיות לפני תאריך הסיום');
      return;
    }
    setCustomDateRange({ start: startDate, end: endDate });
    setIsOpen(false);
    setShowDatePicker(false);
    setDateError('');
  };

  const handleCancelDatePicker = () => {
    setShowDatePicker(false);
    setDateError('');
    // Restore previous values if they exist
    if (customDateRange) {
      setStartDate(customDateRange.start);
      setEndDate(customDateRange.end);
    } else {
      setStartDate('');
      setEndDate('');
    }
  };

  const handleClearCustomRange = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCustomDateRange(null);
    setStartDate('');
    setEndDate('');
    setShowDatePicker(false);
  };

  // Determine trigger display text
  const getTriggerText = (): string => {
    if (selectedMonth === 'custom' && customDateRange) {
      return formatDateRangeDisplay(customDateRange, compact);
    }
    return formatMonthDisplay(selectedMonth, compact);
  };

  const isCustomActive = selectedMonth === 'custom' && customDateRange !== null;

  const renderMonthOption = (monthKey: string) => {
    const hasData = monthsWithData.has(monthKey);
    const isSelected = selectedMonth === monthKey && !isCustomActive;
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
        className={`flex items-center gap-2 transition-all border rounded-lg px-3 py-1.5 cursor-pointer ${
          isCustomActive
            ? 'border-[#69ADFF] bg-blue-50/50 text-[#69ADFF] hover:bg-blue-50'
            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 text-[#1D1D1F] hover:text-[#0055FF]'
        }`}
      >
        {isCustomActive && (
          <CalendarRange className="w-4 h-4 flex-shrink-0 text-[#69ADFF]" strokeWidth={1.75} />
        )}
        <span className={`text-right font-medium whitespace-nowrap ${compact ? 'text-sm' : 'text-sm'} ${
          isCustomActive
            ? 'text-[#69ADFF]'
            : isDark ? 'text-[#1D1D1F]' : 'text-slate-800'
        }`}>
          {getTriggerText()}
        </span>
        {isCustomActive ? (
          <span
            role="button"
            tabIndex={0}
            onClick={handleClearCustomRange}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClearCustomRange(e as unknown as React.MouseEvent); }}
            className="p-0.5 rounded-full hover:bg-blue-100 transition-colors cursor-pointer"
            aria-label="נקה סינון תאריכים"
          >
            <X className="w-3.5 h-3.5 text-[#69ADFF]" strokeWidth={2} />
          </span>
        ) : (
          <ChevronDown
            className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${isDark ? 'text-[#6e6e73]' : 'text-slate-500'}`}
            strokeWidth={1.5}
          />
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="month-dropdown animate-scale-in">
          {/* Custom Date Range Option */}
          {!showDatePicker ? (
            <>
              {/* Fixed header - always visible */}
              <div className="flex-shrink-0">
                <button
                  onClick={handleCustomDateClick}
                  className={`month-option all-months ${isCustomActive ? 'selected' : ''}`}
                >
                  <CalendarRange className="w-4 h-4 text-[#69ADFF]" strokeWidth={1.75} />
                  <span className="flex-1 text-right font-medium">תאריכים מותאמים אישית</span>
                  {isCustomActive && <Check className="w-4 h-4 text-blue-400" />}
                </button>

                {/* All Months Option */}
                <button
                  onClick={() => handleSelect('all')}
                  className={`month-option all-months ${selectedMonth === 'all' && !isCustomActive ? 'selected' : ''}`}
                >
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span className="flex-1 text-right font-medium">כל החודשים</span>
                  {selectedMonth === 'all' && !isCustomActive && <Check className="w-4 h-4 text-blue-400" />}
                </button>

                <div className="border-t border-slate-100 my-1" />
              </div>

              {/* Scrollable month list */}
              <div className="month-dropdown-scrollable">
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
            </>
          ) : (
            /* Date Picker Panel */
            <div className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <CalendarRange className="w-5 h-5 text-[#69ADFF]" strokeWidth={1.75} />
                <h3 className="text-sm font-semibold text-[#303150]">בחירת תאריכים</h3>
              </div>

              <div className="space-y-3">
                {/* Start Date */}
                <div>
                  <label className="block text-xs font-medium text-[#7E7F90] mb-1.5">
                    מתאריך
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setDateError('');
                    }}
                    className="w-full px-3 py-2.5 text-sm text-[#303150] bg-white border border-[#E8E8ED] rounded-xl focus:outline-none focus:border-[#69ADFF] focus:ring-2 focus:ring-[rgba(105,173,255,0.2)] transition-all"
                    dir="ltr"
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-xs font-medium text-[#7E7F90] mb-1.5">
                    עד תאריך
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setDateError('');
                    }}
                    className="w-full px-3 py-2.5 text-sm text-[#303150] bg-white border border-[#E8E8ED] rounded-xl focus:outline-none focus:border-[#69ADFF] focus:ring-2 focus:ring-[rgba(105,173,255,0.2)] transition-all"
                    dir="ltr"
                  />
                </div>

                {/* Error Message */}
                {dateError && (
                  <p className="text-xs text-[#F18AB5] font-medium">{dateError}</p>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleApplyDateRange}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#69ADFF] rounded-xl hover:bg-[#5A9EE6] transition-all shadow-sm hover:shadow-md cursor-pointer"
                  >
                    החל
                  </button>
                  <button
                    onClick={handleCancelDatePicker}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-[#303150] bg-white border border-[#F7F7F8] rounded-xl hover:bg-[#F7F7F8] transition-all cursor-pointer"
                  >
                    ביטול
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
