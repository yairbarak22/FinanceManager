'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import {
  PieChart,
  LogOut,
  User,
  HelpCircle,
  UserCog,
  Users,
  Bell
} from 'lucide-react';
import { useOnboarding } from '@/hooks/useOnboarding';
import MonthFilter from './MonthFilter';

export type NavSection = 'dashboard' | 'transactions' | 'recurring' | 'assets' | 'liabilities';

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
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { startOnboarding } = useOnboarding();

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
    { id: 'transactions', label: 'שוטפות' },
    { id: 'recurring', label: 'קבועות' },
    { id: 'assets', label: 'נכסים' },
    { id: 'liabilities', label: 'התחייבויות' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-b from-[#F5F9FE] via-[#EFF6FB] to-[#EAF3FC] shadow-md border-b border-blue-100/50" style={{ background: 'linear-gradient(180deg, #F5F9FE 0%, #F0F6FD 50%, #EAF3FC 100%)' }}>
      {/* Decorative top gradient line - REMOVED */}

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Right: Logo & Brand */}
          <div className="flex items-center gap-3 group">
            <div className="flex items-center gap-0">
              <PieChart
                className="w-10 h-10 text-[#2B4699]"
                strokeWidth={3}
                style={{ marginRight: '-2px' }}
              />
              <span className="text-2xl font-black text-[#1D1D1F]" style={{ fontFamily: 'var(--font-heebo)' }}>NET</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center bg-white/60 backdrop-blur-sm rounded-xl p-1 border border-blue-100">
            {navTabs.map((tab) => {
              const isActive = activeSection === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSectionChange(tab.id)}
                  className={`relative px-4 py-2 font-medium text-sm rounded-lg transition-all duration-200 ${isActive
                      ? 'text-white bg-gradient-to-r from-[#2B4699] to-[#3556AB] shadow-lg shadow-blue-500/25'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    }`}
                >
                  {tab.label}
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
            <button className="hidden md:flex relative p-2.5 text-slate-600 hover:text-slate-900 transition-colors rounded-xl hover:bg-white/50">
              <Bell className="w-5 h-5" />
              {/* Notification dot */}
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-[#F5F9FE]" />
            </button>

            {/* User Menu */}
            {session?.user && (
              <div className="relative" ref={userMenuRef}>
                <button
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
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {name || 'משתמש'}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{email}</p>
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
                      <div className="my-1 border-t border-slate-100" />
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          startOnboarding();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <HelpCircle className="w-4 h-4 text-indigo-500" />
                        הצג מדריך למתחילים
                      </button>
                      <div className="my-1 border-t border-slate-100" />
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
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
