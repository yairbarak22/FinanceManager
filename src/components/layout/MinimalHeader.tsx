'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import {
  User,
  UserCog,
  Users,
  LogOut,
  Sparkles,
  ChevronDown,
  PieChart,
  PanelRightClose,
  PanelRightOpen,
  Accessibility,
  Menu,
} from 'lucide-react';
import ProgressBell from '@/components/haredi/ProgressBell';
import { useOnboarding } from '@/context/OnboardingContext';
import { useAccessibility } from '@/context/AccessibilityContext';
import { useSidebar } from '@/context/SidebarContext';
import MonthFilter from '@/components/MonthFilter';
import { SensitiveData } from '@/components/common/SensitiveData';
import { trackMixpanelEvent, resetMixpanel } from '@/lib/mixpanel';

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
  const { openAccessibility } = useAccessibility();
  const { isCollapsed, toggleSidebar, openMobileSidebar } = useSidebar();
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
            {/* Mobile: Logo only */}
            <div className="lg:hidden flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <PieChart className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-sm font-bold text-slate-800" style={{ fontFamily: 'var(--font-heebo)' }}>
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
                <h1 className="text-xl font-semibold text-slate-800">{pageTitle}</h1>
              </div>
            </div>
          </div>

          {/* Left: Month Filter & User Menu & Hamburger (Mobile) */}
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

            {/* Progress Bell - visible for Haredi users (self-manages visibility) */}
            <ProgressBell />

            {/* Accessibility Button - All screens */}
            <button
              type="button"
              onClick={openAccessibility}
              className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-50"
              aria-label="תפריט נגישות"
              title="נגישות"
            >
              <Accessibility className="w-[18px] h-[18px]" strokeWidth={1.75} />
            </button>

            {/* User Menu - Desktop only (mobile uses hamburger menu) */}
            {session?.user && (
              <div className="hidden lg:block relative" ref={userMenuRef}>
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
                      data-sl="mask"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                  )}
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
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
                        onClick={() => { trackMixpanelEvent('logout'); resetMixpanel(); signOut({ callbackUrl: '/' }); }}
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

            {/* Hamburger Menu Button - Mobile only */}
            <button
              type="button"
              onClick={openMobileSidebar}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-all"
              aria-label="פתח תפריט ניווט"
            >
              <Menu className="w-5 h-5" strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
