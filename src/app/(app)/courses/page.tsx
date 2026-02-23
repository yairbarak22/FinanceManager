'use client';

import { AppLayout } from '@/components/layout';
import CoursesSection from '@/components/courses/CoursesSection';
import { useMonth } from '@/context/MonthContext';
import { useModal } from '@/context/ModalContext';
import ProfileModal from '@/components/ProfileModal';
import AccountSettings from '@/components/AccountSettings';

export default function CoursesPage() {
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
      pageTitle="קורס וידאו"
      selectedMonth={selectedMonth}
      onMonthChange={setSelectedMonth}
      allMonths={allMonths}
      monthsWithData={monthsWithData}
      currentMonth={currentMonth}
      onOpenProfile={() => openModal('profile')}
      onOpenAccountSettings={() => openModal('accountSettings')}
      showMonthFilter={false}
      showQuickAddFab={false}
    >
      <CoursesSection />

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
