'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react';

interface MonthContextValue {
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  currentMonth: string;
  allMonths: string[];
  monthsWithData: Set<string>;
  setMonthsWithData: (months: Set<string>) => void;
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
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [monthsWithData, setMonthsWithData] = useState<Set<string>>(new Set());
  
  const allMonths = useMemo(() => generateAllMonths(), []);

  const handleMonthChange = useCallback((month: string) => {
    setSelectedMonth(month);
  }, []);

  const value = useMemo(() => ({
    selectedMonth,
    setSelectedMonth: handleMonthChange,
    currentMonth,
    allMonths,
    monthsWithData,
    setMonthsWithData,
  }), [selectedMonth, handleMonthChange, currentMonth, allMonths, monthsWithData]);

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

