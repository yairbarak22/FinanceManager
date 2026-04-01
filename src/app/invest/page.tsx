'use client';

import { useState } from 'react';
import { Suspense } from 'react';
import { useSession } from 'next-auth/react';
import InvestCenterPage from '@/components/invest/InvestCenterPage';
import LegalModal from '@/components/modals/LegalModal';
import Footer from '@/components/landing/Footer';
import InvestNavbar from '@/components/invest/InvestNavbar';
import { AppLayout } from '@/components/layout';
import { useMonth } from '@/context/MonthContext';

function AuthenticatedInvest() {
  const {
    selectedMonth,
    setSelectedMonth,
    allMonths,
    monthsWithData,
    currentMonth,
  } = useMonth();

  return (
    <AppLayout
      pageTitle="מרכז ההשקעות"
      selectedMonth={selectedMonth}
      onMonthChange={setSelectedMonth}
      allMonths={allMonths}
      monthsWithData={monthsWithData}
      currentMonth={currentMonth}
      showMonthFilter={false}
    >
      <InvestCenterPage embedded />
    </AppLayout>
  );
}

function UnauthenticatedInvest() {
  const [legalModal, setLegalModal] = useState<{
    isOpen: boolean;
    type: 'terms' | 'privacy';
  }>({ isOpen: false, type: 'terms' });

  return (
    <div dir="rtl" style={{ fontFamily: 'var(--font-heebo)' }}>
      <InvestNavbar />
      <InvestCenterPage />
      <Footer onOpenLegal={(type) => setLegalModal({ isOpen: true, type })} />
      <LegalModal
        isOpen={legalModal.isOpen}
        onClose={() => setLegalModal({ ...legalModal, isOpen: false })}
        type={legalModal.type}
      />
    </div>
  );
}

function InvestPageContent() {
  const { status } = useSession();

  if (status === 'loading') {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: 'linear-gradient(180deg, #F5F9FE 0%, #EAF3FC 50%, #FFFFFF 100%)',
        }}
      >
        <div
          className="w-12 h-12 rounded-full animate-spin"
          style={{ border: '4px solid #2B4699', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  if (status === 'authenticated') {
    return <AuthenticatedInvest />;
  }

  return <UnauthenticatedInvest />;
}

export default function InvestPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{
            background: 'linear-gradient(180deg, #F5F9FE 0%, #EAF3FC 50%, #FFFFFF 100%)',
          }}
        >
          <div
            className="w-12 h-12 rounded-full animate-spin"
            style={{ border: '4px solid #2B4699', borderTopColor: 'transparent' }}
          />
        </div>
      }
    >
      <InvestPageContent />
    </Suspense>
  );
}
