'use client';

import { Suspense } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useMonth } from '@/context/MonthContext';
import WorkspacePage from '@/components/workspace/WorkspacePage';

export default function WorkspaceRoute() {
  const { selectedMonth, setSelectedMonth, allMonths, monthsWithData, currentMonth } = useMonth();

  return (
    <AppLayout
      pageTitle="ייבוא עסקאות"
      selectedMonth={selectedMonth}
      onMonthChange={setSelectedMonth}
      allMonths={allMonths}
      monthsWithData={monthsWithData}
      currentMonth={currentMonth}
      showMonthFilter={false}
      showQuickAddFab={false}
    >
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-32">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-[#69ADFF] border-t-transparent animate-spin" />
              <span className="text-sm font-medium" style={{ color: '#7E7F90', fontFamily: 'var(--font-nunito)' }}>
                טוען סביבת עבודה...
              </span>
            </div>
          </div>
        }
      >
        <WorkspacePage />
      </Suspense>
    </AppLayout>
  );
}
