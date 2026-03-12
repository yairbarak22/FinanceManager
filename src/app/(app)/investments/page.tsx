'use client';

import { useEffect, useRef } from 'react';
import { AppLayout } from '@/components/layout';
import { SmartPortfolio } from '@/components/portfolio';
import { useMonth } from '@/context/MonthContext';
import { useAnalytics } from '@/hooks/useAnalytics';

export default function InvestmentsPage() {
  const {
    selectedMonth,
    setSelectedMonth,
    allMonths,
    monthsWithData,
    currentMonth,
  } = useMonth();
  const analytics = useAnalytics();
  const hasTrackedPageView = useRef(false);

  // Track portfolio page view on mount
  useEffect(() => {
    if (!hasTrackedPageView.current) {
      analytics.trackInvestmentPortfolioViewed();
      hasTrackedPageView.current = true;
    }
  }, [analytics]);

  return (
    <AppLayout
      pageTitle="תיק השקעות"
      selectedMonth={selectedMonth}
      onMonthChange={setSelectedMonth}
      allMonths={allMonths}
      monthsWithData={monthsWithData}
      currentMonth={currentMonth}
      showMonthFilter={false}
    >
      <SmartPortfolio />
    </AppLayout>
  );
}

