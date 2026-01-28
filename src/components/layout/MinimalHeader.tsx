'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import {
  Bell,
  User,
  UserCog,
  Users,
  LogOut,
  Sparkles,
  ChevronDown,
  PieChart,
} from 'lucide-react';
import { useOnboarding } from '@/context/OnboardingContext';
import MonthFilter from '@/components/MonthFilter';
import { SensitiveData } from '@/components/common/SensitiveData';

interface MinimalHeaderProps {
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

export default function MinimalHeader({
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
}: MinimalHeaderProps) {
  const { data: session } = useSession();
  const { startTour } = useOnboarding();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

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

  return (
    <header
      className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/80 backdrop-blur-md"
    >
      <div className="px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Right: Page Title (Desktop) / Logo (Mobile) */}
          <div className="flex items-center gap-4">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center gap-2">
              <PieChart className="w-7 h-7 text-[#2B4699]" strokeWidth={3} />
              <span className="text-lg font-black text-[#1D1D1F]" style={{ fontFamily: 'var(--font-heebo)' }}>
                NETO
              </span>
            </div>
            
            {/* Desktop Page Title */}
            <div className="hidden lg:block">
              <h1 className="text-xl font-bold text-slate-900">{pageTitle}</h1>
              {pageSubtitle && (
                <p className="text-sm text-slate-500">{pageSubtitle}</p>
              )}
            </div>
          </div>

          {/* Left: Month Filter & User Menu */}
          <div className="flex items-center gap-3">
            {/* Month Filter */}
            {showMonthFilter && (
              <>
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
              </>
            )}

            {/* Notification Bell */}
            <button
              type="button"
              className="hidden md:flex relative p-2 text-slate-500 hover:text-[#2B4699] transition-colors rounded-lg hover:bg-slate-100"
              aria-label="התראות"
            >
              <Bell className="w-5 h-5" strokeWidth={1.5} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full" />
            </button>

            {/* User Menu */}
            {session?.user && (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-slate-100 transition-all"
                  aria-expanded={isUserMenuOpen}
                  aria-haspopup="menu"
                >
                  {image ? (
                    <img
                      src={image}
                      alt=""
                      className="w-8 h-8 rounded-xl border-2 border-slate-200"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2B4699] to-[#3556AB] flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <ChevronDown className="hidden md:block w-4 h-4 text-slate-400" />
                </button>

                {/* Dropdown */}
                {isUserMenuOpen && (
                  <div
                    className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50"
                    role="menu"
                  >
                    <div className="px-4 py-3 border-b border-slate-100">
                      <SensitiveData as="p" className="text-sm font-medium text-slate-900 truncate">
                        {name || 'משתמש'}
                      </SensitiveData>
                      <SensitiveData as="p" className="text-xs text-slate-500 truncate">
                        {email}
                      </SensitiveData>
                    </div>

                    <div className="py-1">
                      {onOpenProfile && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onOpenProfile();
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <UserCog className="w-4 h-4" />
                          <span>פרופיל משתמש</span>
                        </button>
                      )}
                      {onOpenAccountSettings && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onOpenAccountSettings();
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <Users className="w-4 h-4" />
                          <span>חשבון משותף</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          startTour();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>הצג סיור</span>
                      </button>
                    </div>

                    <div className="border-t border-slate-100 py-1">
                      <button
                        type="button"
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>התנתקות</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

