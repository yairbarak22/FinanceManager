'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode, useMemo } from 'react';
import { apiFetch } from '@/lib/utils';

export interface CustomDateRange {
  start: string; // YYYY-MM-DD format
  end: string;   // YYYY-MM-DD format
}

interface MonthContextValue {
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  currentMonth: string;
  allMonths: string[];
  monthsWithData: Set<string>;
  setMonthsWithData: (months: Set<string>) => void;
  customDateRange: CustomDateRange | null;
  setCustomDateRange: (range: CustomDateRange | null) => void;
  financialMonthStartDay: number;
  setFinancialMonthStartDay: (day: number) => void;
}

const MonthContext = createContext<MonthContextValue | undefined>(undefined);

function formatMonth(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function generateAllMonths(): string[] {
  const months: string[] = [];
  const today = new Date();
  
  // Generate 24 months: 12 past + current + 11 future
  for (let i = -12; i <= 11; i++) {
    const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
    months.push(formatMonth(date));
  }
  
  return months;
}

export function MonthProvider({ children }: { children: ReactNode }) {
  const currentMonth = formatMonth(new Date());
  const [selectedMonth, setSelectedMonthState] = useState(currentMonth);
  const [monthsWithData, setMonthsWithData] = useState<Set<string>>(new Set());
  const [customDateRange, setCustomDateRangeState] = useState<CustomDateRange | null>(null);
  const [financialMonthStartDay, setFinancialMonthStartDayState] = useState<number>(1);
  
  const allMonths = useMemo(() => generateAllMonths(), []);

  useEffect(() => {
    apiFetch('/api/user/settings')
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (data?.monthStartDay) {
          setFinancialMonthStartDayState(data.monthStartDay);
        }
      })
      .catch(() => {});
  }, []);

  const setFinancialMonthStartDay = useCallback((day: number) => {
    setFinancialMonthStartDayState(day);
  }, []);

  const handleMonthChange = useCallback((month: string) => {
    setSelectedMonthState(month);
    if (month !== 'custom') {
      setCustomDateRangeState(null);
    }
  }, []);

  const handleCustomDateRangeChange = useCallback((range: CustomDateRange | null) => {
    setCustomDateRangeState(range);
    if (range) {
      setSelectedMonthState('custom');
    } else {
      setSelectedMonthState(currentMonth);
    }
  }, [currentMonth]);

  const value = useMemo(() => ({
    selectedMonth,
    setSelectedMonth: handleMonthChange,
    currentMonth,
    allMonths,
    monthsWithData,
    setMonthsWithData,
    customDateRange,
    setCustomDateRange: handleCustomDateRangeChange,
    financialMonthStartDay,
    setFinancialMonthStartDay,
  }), [selectedMonth, handleMonthChange, currentMonth, allMonths, monthsWithData, customDateRange, handleCustomDateRangeChange, financialMonthStartDay, setFinancialMonthStartDay]);

  return (
    <MonthContext.Provider value={value}>
      {children}
    </MonthContext.Provider>
  );
}

export function useMonth() {
  const context = useContext(MonthContext);
  if (!context) {
    throw new Error('useMonth must be used within a MonthProvider');
  }
  return context;
}
