'use client';

import { Suspense } from 'react';
import { useSession } from 'next-auth/react';
import KnowledgeCenterPage from '@/components/knowledge/KnowledgeCenterPage';
import { AppLayout } from '@/components/layout';
import { useMonth } from '@/context/MonthContext';

function AuthenticatedKnowledge() {
  const {
    selectedMonth,
    setSelectedMonth,
    allMonths,
    monthsWithData,
    currentMonth,
  } = useMonth();

  return (
    <AppLayout
      pageTitle="מרכז הידע"
      selectedMonth={selectedMonth}
      onMonthChange={setSelectedMonth}
      allMonths={allMonths}
      monthsWithData={monthsWithData}
      currentMonth={currentMonth}
      showMonthFilter={false}
    >
      <KnowledgeCenterPage embedded />
    </AppLayout>
  );
}

function KnowledgePageContent() {
  const { status } = useSession();

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F8F9FB' }}>
        <div className="w-10 h-10 rounded-full animate-spin" style={{ border: '3px solid #69ADFF', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (status === 'authenticated') {
    return <AuthenticatedKnowledge />;
  }

  return <KnowledgeCenterPage />;
}

export default function KnowledgePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: '#F8F9FB' }}>
          <div className="w-10 h-10 rounded-full animate-spin" style={{ border: '3px solid #69ADFF', borderTopColor: 'transparent' }} />
        </div>
      }
    >
      <KnowledgePageContent />
    </Suspense>
  );
}
