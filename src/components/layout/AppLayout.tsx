'use client';

import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import MinimalHeader from './MinimalHeader';

interface AppLayoutProps {
  children: ReactNode;
  pageTitle: string;
  pageSubtitle?: string;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  allMonths: string[];
  monthsWithData: Set<string>;
  currentMonth: string;
  onOpenProfile?: () => void;
  onOpenAccountSettings?: () => void;
  showMonthFilter?: boolean;
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
  onOpenProfile,
  onOpenAccountSettings,
  showMonthFilter = true,
}: AppLayoutProps) {
  return (
    <div className="flex min-h-screen bg-slate-50/50">
      {/* Sidebar - Desktop only */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <MinimalHeader
          pageTitle={pageTitle}
          pageSubtitle={pageSubtitle}
          selectedMonth={selectedMonth}
          onMonthChange={onMonthChange}
          allMonths={allMonths}
          monthsWithData={monthsWithData}
          currentMonth={currentMonth}
          onOpenProfile={onOpenProfile}
          onOpenAccountSettings={onOpenAccountSettings}
          showMonthFilter={showMonthFilter}
        />

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}

