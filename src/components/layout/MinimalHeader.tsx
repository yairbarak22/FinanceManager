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
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';
import { useOnboarding } from '@/context/OnboardingContext';
import { useSidebar } from '@/context/SidebarContext';
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
  const { isCollapsed, toggleSidebar } = useSidebar();
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
    <header className="sticky top-0 z-40 bg-white border-b border-slate-100">
      <div className="px-4 lg:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Right: Sidebar Toggle + Page Title (Desktop) / Logo (Mobile) */}
          <div className="flex items-center gap-3">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <PieChart className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-base font-bold text-slate-800" style={{ fontFamily: 'var(--font-heebo)' }}>
                NETO
              </span>
            </div>
            
            {/* Desktop: Sidebar Toggle + Page Title */}
            <div className="hidden lg:flex items-center gap-3">
              {/* Sidebar Toggle Button */}
              <button
                type="button"
                onClick={toggleSidebar}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                aria-label={isCollapsed ? 'הרחב תפריט צד' : 'כווץ תפריט צד'}
                title={isCollapsed ? 'הרחב תפריט צד' : 'כווץ תפריט צד'}
              >
                {isCollapsed ? (
                  <PanelRightOpen className="w-5 h-5" strokeWidth={1.75} />
                ) : (
                  <PanelRightClose className="w-5 h-5" strokeWidth={1.75} />
                )}
              </button>
              
              {/* Page Title */}
              <div>
                <h1 className="text-base font-semibold text-slate-800">{pageTitle}</h1>
                {pageSubtitle && (
                  <p className="text-xs text-slate-400">{pageSubtitle}</p>
                )}
              </div>
            </div>
          </div>

          {/* Left: Month Filter & User Menu */}
          <div className="flex items-center gap-2">
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
              className="hidden md:flex relative p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-50"
              aria-label="התראות"
            >
              <Bell className="w-[18px] h-[18px]" strokeWidth={1.75} />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-400 rounded-full" />
            </button>

            {/* User Menu */}
            {session?.user && (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-1.5 rounded-lg p-1.5 hover:bg-slate-50 transition-colors"
                  aria-expanded={isUserMenuOpen}
                  aria-haspopup="menu"
                >
                  {image ? (
                    <img
                      src={image}
                      alt=""
                      className="w-7 h-7 rounded-full ring-2 ring-slate-100"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                  )}
                  <ChevronDown className="hidden md:block w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown */}
                {isUserMenuOpen && (
                  <div
                    className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-100 py-1 z-50"
                    role="menu"
                  >
                    <div className="px-3 py-2.5 border-b border-slate-100">
                      <SensitiveData as="p" className="text-[13px] font-medium text-slate-700 truncate">
                        {name || 'משתמש'}
                      </SensitiveData>
                      <SensitiveData as="p" className="text-[11px] text-slate-400 truncate">
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
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                          <UserCog className="w-4 h-4 text-slate-400" />
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
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                          <Users className="w-4 h-4 text-slate-400" />
                          <span>חשבון משותף</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          startTour();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        <Sparkles className="w-4 h-4 text-slate-400" />
                        <span>הצג סיור</span>
                      </button>
                    </div>

                    <div className="border-t border-slate-100 py-1">
                      <button
                        type="button"
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-rose-500 hover:bg-rose-50 transition-colors"
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
