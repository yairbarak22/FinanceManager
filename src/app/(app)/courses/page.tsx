'use client';

import { AppLayout } from '@/components/layout';
import CoursesSection from '@/components/courses/CoursesSection';
import { useMonth } from '@/context/MonthContext';

export default function CoursesPage() {
  const {
    selectedMonth,
    setSelectedMonth,
    allMonths,
    monthsWithData,
    currentMonth,
  } = useMonth();

  return (
    <AppLayout
      pageTitle="קורס וידאו"
      selectedMonth={selectedMonth}
      onMonthChange={setSelectedMonth}
      allMonths={allMonths}
      monthsWithData={monthsWithData}
      currentMonth={currentMonth}
      showMonthFilter={false}
      showQuickAddFab={false}
    >
      <CoursesSection />
    </AppLayout>
  );
}
