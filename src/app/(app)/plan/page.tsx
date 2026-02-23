'use client';

import { AppLayout } from '@/components/layout';
import { PlanProvider } from '@/context/PlanContext';
import { useMonth } from '@/context/MonthContext';
import BlueprintContainer from '@/components/plan/BlueprintContainer';

export default function PlanPage() {
  const {
    selectedMonth,
    setSelectedMonth,
    allMonths,
    monthsWithData,
    currentMonth,
  } = useMonth();

  return (
    <PlanProvider>
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
        <BlueprintContainer />
      </AppLayout>
    </PlanProvider>
  );
}

