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

function formatMonthDisplay(monthKey: string): string {
  if (monthKey === 'all') return 'כל החודשים';
  
  const [year, month] = monthKey.split('-');
  return `${monthNames[month]} ${year}`;
}

export default function MonthFilter({ 
  selectedMonth, 
  onMonthChange, 
  allMonths, 
  monthsWithData,
  currentMonth,
  variant = 'light'
}: MonthFilterProps) {
  const isDark = variant === 'dark';
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
        onClick={() => handleSelect(monthKey)}
        className={`month-option ${isSelected ? 'selected' : ''} ${hasData ? 'has-data' : 'no-data'} ${isCurrent ? 'current' : ''}`}
      >
        <span className={`indicator ${hasData ? 'bg-emerald-500' : 'bg-slate-300'}`} />
        <span className="flex-1 text-right">{formatMonthDisplay(monthKey)}</span>
        {isSelected && <Check className="w-4 h-4 text-indigo-500" />}
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
        className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all min-w-[180px] ${
          isDark 
            ? 'bg-slate-800 hover:bg-slate-700 border-0' 
            : 'bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-sm'
        }`}
      >
        <Calendar className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-indigo-500'}`} />
        <span className={`flex-1 text-right font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>
          {formatMonthDisplay(selectedMonth)}
        </span>
        <ChevronDown 
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${isDark ? 'text-slate-400' : 'text-slate-500'}`} 
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
            <Calendar className="w-4 h-4 text-indigo-500" />
            <span className="flex-1 text-right font-medium">כל החודשים</span>
            {selectedMonth === 'all' && <Check className="w-4 h-4 text-indigo-500" />}
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
