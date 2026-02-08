'use client';

import { useEffect, useRef } from 'react';
import { AppLayout } from '@/components/layout';
import { SmartPortfolio } from '@/components/portfolio';
import { useMonth } from '@/context/MonthContext';
import { useModal } from '@/context/ModalContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import ProfileModal from '@/components/ProfileModal';
import AccountSettings from '@/components/AccountSettings';

export default function InvestmentsPage() {
  const {
    selectedMonth,
    setSelectedMonth,
    allMonths,
    monthsWithData,
    currentMonth,
  } = useMonth();
  
  const { openModal, isModalOpen, closeModal } = useModal();
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
      onOpenProfile={() => openModal('profile')}
      onOpenAccountSettings={() => openModal('accountSettings')}
      showMonthFilter={false}
    >
      <SmartPortfolio />
      
      {/* Modals */}
      <ProfileModal
        isOpen={isModalOpen('profile')}
        onClose={closeModal}
      />
      <AccountSettings
        isOpen={isModalOpen('accountSettings')}
        onClose={closeModal}
      />
    </AppLayout>
  );
}

