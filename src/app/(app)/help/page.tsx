'use client';

import { AppLayout } from '@/components/layout';
import AcademySection from '@/components/academy/AcademySection';
import { useMonth } from '@/context/MonthContext';
import { useModal } from '@/context/ModalContext';
import ProfileModal from '@/components/ProfileModal';
import AccountSettings from '@/components/AccountSettings';

export default function HelpPage() {
  const {
    selectedMonth,
    setSelectedMonth,
    allMonths,
    monthsWithData,
    currentMonth,
  } = useMonth();
  
  const { openModal, isModalOpen, closeModal } = useModal();

  return (
    <AppLayout
      pageTitle="ידע פיננסי"
      selectedMonth={selectedMonth}
      onMonthChange={setSelectedMonth}
      allMonths={allMonths}
      monthsWithData={monthsWithData}
      currentMonth={currentMonth}
      onOpenProfile={() => openModal('profile')}
      onOpenAccountSettings={() => openModal('accountSettings')}
      showMonthFilter={false}
    >
      <AcademySection />
      
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

