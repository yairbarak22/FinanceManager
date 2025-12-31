'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import {
  PieChart,
  LogOut,
  User,
  UserCog,
  Users,
  Bell,
  ChevronLeft,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { useOnboarding } from '@/context/OnboardingContext';
import { resetUser } from '@/lib/smartlook';
import MonthFilter from './MonthFilter';
import { SensitiveData } from './common/SensitiveData';

export type NavSection = 'dashboard' | 'transactions' | 'recurring' | 'assets' | 'liabilities' | 'investments';

interface HeaderBarProps {
  activeSection: NavSection;
  onSectionChange: (section: NavSection) => void;
  onOpenProfile?: () => void;
  onOpenAccountSettings?: () => void;
  // Month filter props
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  allMonths: string[];
  monthsWithData: Set<string>;
  currentMonth: string;
}

export default function HeaderBar({
  activeSection,
  onSectionChange,
  onOpenProfile,
  onOpenAccountSettings,
  selectedMonth,
  onMonthChange,
  allMonths,
  monthsWithData,
  currentMonth,
}: HeaderBarProps) {
  const { data: session } = useSession();
  const { startTour } = useOnboarding();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { name, email, image } = session?.user || {};

  const navTabs: { id: NavSection; label: string }[] = [
    { id: 'dashboard', label: 'דשבורד' },
    { id: 'investments', label: 'תיק השקעות' },
    { id: 'transactions', label: 'עזרה' },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/20" style={{ background: 'rgba(255, 255, 255, 0.65)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
      {/* Decorative top gradient line - REMOVED */}

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Right: Logo & Brand - Clickable to navigate to dashboard */}
          <button
            onClick={() => onSectionChange('dashboard')}
            className="flex items-center gap-3 group cursor-pointer hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center gap-0">
              <PieChart
                className="w-10 h-10 text-[#2B4699]"
                strokeWidth={3}
                style={{ marginRight: '-2px' }}
              />
              <span className="text-2xl font-black text-[#1D1D1F]" style={{ fontFamily: 'var(--font-heebo)' }}>NET</span>
            </div>
          </button>

          <nav className="hidden md:flex items-center gap-6">
            {navTabs.map((tab) => {
              const isActive = activeSection === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSectionChange(tab.id)}
                  className="group flex items-center gap-1.5 px-2 py-1 text-sm transition-all duration-200 cursor-pointer"
                >
                  <span className={`transition-all ${isActive
                    ? 'text-slate-900 font-semibold'
                    : 'text-slate-500 font-normal group-hover:text-slate-900'
                    }`}>
                    {tab.label}
                  </span>
                  {isActive ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" strokeWidth={2} />
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:hidden transition-all" strokeWidth={2} />
                      <ChevronLeft className="w-3.5 h-3.5 text-blue-400 hidden group-hover:block transition-all" strokeWidth={2} />
                    </>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Left: Month Filter & User Menu */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Month Filter - compact on mobile */}
            <div className="hidden md:block">
              <MonthFilter
                selectedMonth={selectedMonth}
                onMonthChange={onMonthChange}
                allMonths={allMonths}
                monthsWithData={monthsWithData}
                currentMonth={currentMonth}
                variant="dark"
              />
            </div>
            <div className="md:hidden">
              <MonthFilter
                selectedMonth={selectedMonth}
                onMonthChange={onMonthChange}
                allMonths={allMonths}
                monthsWithData={monthsWithData}
                currentMonth={currentMonth}
                variant="dark"
                compact
              />
            </div>

            {/* Notification Bell - hidden on mobile */}
            <button className="hidden md:flex relative p-2 text-[#6e6e73] hover:text-[#0055FF] transition-colors">
              <Bell className="w-5 h-5" strokeWidth={1.5} />
              {/* Notification dot */}
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full" />
            </button>

            {/* User Menu */}
            {session?.user && (
              <div className="relative" ref={userMenuRef}>
                <button
                  id="nav-profile-btn"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 rounded-xl p-0.5 md:p-1 hover:bg-white/50 transition-all"
                >
                  {image ? (
                    <img
                      src={image}
                      alt={name || 'User'}
                      className="w-8 h-8 md:w-9 md:h-9 rounded-xl border-2 border-blue-200 shadow-lg"
                    />
                  ) : (
                    <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-gradient-to-br from-[#2B4699] to-[#3556AB] flex items-center justify-center border-2 border-blue-200 shadow-lg">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-50 animate-scale-in">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                      <SensitiveData as="p" className="text-sm font-medium text-slate-900 truncate">
                        {name || 'משתמש'}
                      </SensitiveData>
                      <SensitiveData as="p" className="text-xs text-slate-500 truncate">
                        {email}
                      </SensitiveData>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                      {onOpenProfile && (
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onOpenProfile();
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <UserCog className="w-4 h-4 text-indigo-500" />
                          פרטים אישיים
                        </button>
                      )}
                      {onOpenAccountSettings && (
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onOpenAccountSettings();
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <Users className="w-4 h-4 text-indigo-500" />
                          שיתוף חשבון
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          startTour();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        סיור במערכת
                      </button>
                      <div className="my-1 border-t border-slate-100" />
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          // Reset Smartlook user identification before signing out
                          resetUser();
                          signOut({ callbackUrl: '/login' });
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        התנתק
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center justify-start gap-2 pb-3 overflow-x-auto scrollbar-hide -mx-4 px-4">
          {navTabs.map((tab) => {
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSectionChange(tab.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${isActive
                  ? 'bg-gradient-to-r from-[#2B4699] to-[#3556AB] text-white shadow-lg shadow-blue-500/25'
                  : 'text-slate-600 hover:text-slate-900 bg-white/60 border border-blue-100/50'
                  }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
