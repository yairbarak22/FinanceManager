'use client';

import { AppLayout } from '@/components/layout';
import { useMonth } from '@/context/MonthContext';

export default function PlanPage() {
  const {
    selectedMonth,
    setSelectedMonth,
    allMonths,
    monthsWithData,
    currentMonth,
  } = useMonth();

  return (
    <AppLayout
      pageTitle="תוכנית עבודה"
      pageSubtitle="The Blueprint"
      selectedMonth={selectedMonth}
      onMonthChange={setSelectedMonth}
      allMonths={allMonths}
      monthsWithData={monthsWithData}
      currentMonth={currentMonth}
      showMonthFilter={false}
      showQuickAddFab={false}
    >
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[#BDBDCB] text-[0.9375rem]">בקרוב...</p>
      </div>
    </AppLayout>
  );
}
