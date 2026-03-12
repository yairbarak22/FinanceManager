'use client';

import { AppLayout } from '@/components/layout';
import AcademySection from '@/components/academy/AcademySection';
import { useMonth } from '@/context/MonthContext';

export default function HelpPage() {
  const {
    selectedMonth,
    setSelectedMonth,
    allMonths,
    monthsWithData,
    currentMonth,
  } = useMonth();

  return (
    <AppLayout
      pageTitle="ידע פיננסי"
      selectedMonth={selectedMonth}
      onMonthChange={setSelectedMonth}
      allMonths={allMonths}
      monthsWithData={monthsWithData}
      currentMonth={currentMonth}
      showMonthFilter={false}
    >
      <AcademySection />
    </AppLayout>
  );
}

