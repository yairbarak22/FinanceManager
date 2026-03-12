'use client';

import { AppLayout } from '@/components/layout';
import { ContactSection } from '@/components/contact';
import { useMonth } from '@/context/MonthContext';

export default function ContactPage() {
  const {
    selectedMonth,
    setSelectedMonth,
    allMonths,
    monthsWithData,
    currentMonth,
  } = useMonth();

  return (
    <AppLayout
      pageTitle="צור קשר"
      selectedMonth={selectedMonth}
      onMonthChange={setSelectedMonth}
      allMonths={allMonths}
      monthsWithData={monthsWithData}
      currentMonth={currentMonth}
      showMonthFilter={false}
    >
      <ContactSection />
    </AppLayout>
  );
}

