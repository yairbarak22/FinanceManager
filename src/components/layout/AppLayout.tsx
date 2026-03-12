'use client';

import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import MinimalHeader from './MinimalHeader';
import { QuickAddFab } from '@/components/quick-add';
import { useModal } from '@/context/ModalContext';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';

interface AppLayoutProps {
  children: ReactNode;
  pageTitle: string;
  pageSubtitle?: string;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  allMonths: string[];
  monthsWithData: Set<string>;
  currentMonth: string;
  showMonthFilter?: boolean;
  showQuickAddFab?: boolean;
}

export default function AppLayout({
  children,
  pageTitle,
  pageSubtitle,
  selectedMonth,
  onMonthChange,
  allMonths,
  monthsWithData,
  currentMonth,
  showMonthFilter = true,
  showQuickAddFab = false,
}: AppLayoutProps) {
  const { openModal, isModalOpen } = useModal();

  // Keyboard shortcut: C or + to open Quick Add modal
  useKeyboardShortcut({
    key: ['c', '+'],
    callback: () => openModal('quick-add'),
    disabled: isModalOpen('quick-add'),
  });

  return (
    <div className="flex min-h-screen bg-[#F5F5F7]">
      {/* Sidebar - Desktop + Mobile (hamburger menu) */}
      <Sidebar />

      {/* Main Content Area */}
      <div id="main-content-area" className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <MinimalHeader
          pageTitle={pageTitle}
          pageSubtitle={pageSubtitle}
          selectedMonth={selectedMonth}
          onMonthChange={onMonthChange}
          allMonths={allMonths}
          monthsWithData={monthsWithData}
          currentMonth={currentMonth}
          showMonthFilter={showMonthFilter}
        />

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>

      {/* Quick Add FAB - Only show if enabled */}
      {showQuickAddFab && <QuickAddFab />}

    </div>
  );
}

