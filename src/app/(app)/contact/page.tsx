'use client';

import { AppLayout } from '@/components/layout';
import { ContactSection } from '@/components/contact';
import { useMonth } from '@/context/MonthContext';
import { useModal } from '@/context/ModalContext';
import ProfileModal from '@/components/ProfileModal';
import AccountSettings from '@/components/AccountSettings';

export default function ContactPage() {
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
      pageTitle="צור קשר"
      pageSubtitle="נשמח לשמוע ממך"
      selectedMonth={selectedMonth}
      onMonthChange={setSelectedMonth}
      allMonths={allMonths}
      monthsWithData={monthsWithData}
      currentMonth={currentMonth}
      onOpenProfile={() => openModal('profile')}
      onOpenAccountSettings={() => openModal('accountSettings')}
      showMonthFilter={false}
    >
      <ContactSection />
      
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

