'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { 
  TrendingUp,
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
    <header className="sticky top-0 z-50 bg-gradient-to-r from-[#0a0f1f] via-[#0F1629] to-[#0a0f1f] shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur-sm border-b border-slate-800/50">
      {/* Decorative top gradient line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-60" />
      
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Right: Logo & Brand */}
          <div className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:shadow-indigo-500/50 transition-all">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              {/* Glow effect */}
              <div className="absolute inset-0 w-10 h-10 rounded-xl bg-indigo-500 blur-xl opacity-30 group-hover:opacity-50 transition-opacity" />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">NETO</span>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-xs text-slate-500">הכסף שלך, תכלס.</p>
            </div>
          </div>

          {/* Center: Navigation Tabs */}
          <nav className="hidden md:flex items-center bg-slate-800/40 rounded-xl p-1 border border-slate-700/50">
            {navTabs.map((tab) => {
              const isActive = activeSection === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSectionChange(tab.id)}
                  className={`relative px-4 py-2 font-medium text-sm rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'text-white bg-gradient-to-r from-indigo-600 to-indigo-500 shadow-lg shadow-indigo-500/25'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Left: Month Filter & User Menu */}
          <div className="flex items-center gap-3">
            {/* Month Filter */}
            <MonthFilter
              selectedMonth={selectedMonth}
              onMonthChange={onMonthChange}
              allMonths={allMonths}
              monthsWithData={monthsWithData}
              currentMonth={currentMonth}
              variant="dark"
            />

            {/* Notification Bell */}
            <button className="relative p-2.5 text-slate-400 hover:text-white transition-colors rounded-xl hover:bg-slate-800/50">
              <Bell className="w-5 h-5" />
              {/* Notification dot */}
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-[#0F1629]" />
            </button>

            {/* User Menu */}
            {session?.user && (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 rounded-xl p-1 hover:bg-slate-800/50 transition-all"
                >
                  {image ? (
                    <img
                      src={image}
                      alt={name || 'User'}
                      className="w-9 h-9 rounded-xl border-2 border-slate-700 shadow-lg"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center border-2 border-slate-700 shadow-lg">
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
        <div className="md:hidden flex items-center justify-center gap-1 pb-3 overflow-x-auto">
          {navTabs.map((tab) => {
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSectionChange(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                    : 'text-slate-400 hover:text-white bg-slate-800/50'
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
