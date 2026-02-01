'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  Menu,
  X,
  Home,
  TrendingUp,
  BookOpen,
  Mail,
  Accessibility,
} from 'lucide-react';
import { useOnboarding } from '@/context/OnboardingContext';
import { useAccessibility } from '@/context/AccessibilityContext';
import MonthFilter from './MonthFilter';
import { SensitiveData } from './common/SensitiveData';

export type NavSection = 'dashboard' | 'transactions' | 'recurring' | 'assets' | 'liabilities' | 'investments' | 'help' | 'contact';

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
  const { openAccessibility } = useAccessibility();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Track mounting for portal
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Close desktop user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Nav icons for mobile menu
  const navIcons: Record<NavSection, typeof Home> = {
    dashboard: Home,
    transactions: Home,
    recurring: Home,
    assets: Home,
    liabilities: Home,
    investments: TrendingUp,
    help: BookOpen,
    contact: Mail,
  };

  const { name, email, image } = session?.user || {};

  const navTabs: { id: NavSection; label: string }[] = [
    { id: 'dashboard', label: 'דשבורד' },
    { id: 'investments', label: 'תיק השקעות' },
    { id: 'help', label: 'ידע פיננסי' },
    { id: 'contact', label: 'צור קשר' },
  ];

  return (
    <>
    <header className="sticky top-0 z-50 border-b border-white/20" style={{ background: 'rgba(255, 255, 255, 0.65)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
      {/* Decorative top gradient line - REMOVED */}

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Right: Logo & Brand - Clickable to navigate to dashboard */}
          <button
            type="button"
            onClick={() => onSectionChange('dashboard')}
            className="flex items-center gap-3 group cursor-pointer hover:opacity-80 transition-opacity"
            aria-label="חזרה לדשבורד הראשי"
          >
            <div className="flex items-center gap-0" aria-hidden="true">
              <PieChart
                className="w-10 h-10 text-[#2B4699]"
                strokeWidth={3}
                style={{ marginRight: '-2px' }}
              />
              <span className="text-2xl font-black text-[#1D1D1F]" style={{ fontFamily: 'var(--font-heebo)' }}>NET</span>
            </div>
          </button>

          <nav className="hidden md:flex items-center gap-6" aria-label="ניווט ראשי">
            {navTabs.map((tab) => {
              const isActive = activeSection === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onSectionChange(tab.id)}
                  className="group flex items-center gap-1.5 px-2 py-1 text-sm transition-all duration-200 cursor-pointer"
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className={`transition-all ${isActive
                    ? 'text-slate-900 font-semibold'
                    : 'text-slate-500 font-normal group-hover:text-slate-900'
                    }`}>
                    {tab.label}
                  </span>
                  {isActive ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" strokeWidth={2} aria-hidden="true" />
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:hidden transition-all" strokeWidth={2} aria-hidden="true" />
                      <ChevronLeft className="w-3.5 h-3.5 text-blue-400 hidden group-hover:block transition-all" strokeWidth={2} aria-hidden="true" />
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
            <button
              type="button"
              className="hidden md:flex relative p-2 text-[#6e6e73] hover:text-[#0055FF] transition-colors"
              aria-label="התראות (יש התראות חדשות)"
            >
              <Bell className="w-5 h-5" strokeWidth={1.5} aria-hidden="true" />
              {/* Notification dot */}
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full" aria-hidden="true" />
            </button>

            {/* Accessibility Button - hidden on mobile */}
            <button
              type="button"
              onClick={openAccessibility}
              className="hidden md:flex relative p-2 text-[#6e6e73] hover:text-[#0055FF] transition-colors"
              aria-label="תפריט נגישות"
              title="נגישות"
            >
              <Accessibility className="w-5 h-5" strokeWidth={1.5} aria-hidden="true" />
            </button>

            {/* Desktop User Menu */}
            {session?.user && (
              <div className="relative hidden md:block" ref={userMenuRef}>
                <button
                  id="nav-profile-btn"
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 rounded-xl p-1 hover:bg-white/50 transition-all"
                  aria-expanded={isUserMenuOpen}
                  aria-haspopup="menu"
                  aria-label={`תפריט משתמש${name ? `: ${name}` : ''}`}
                >
                  {image ? (
                    <img
                      src={image}
                      alt=""
                      className="w-9 h-9 rounded-xl border-2 border-blue-200 shadow-lg"
                      data-sl="mask"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2B4699] to-[#3556AB] flex items-center justify-center border-2 border-blue-200 shadow-lg">
                      <User className="w-4 h-4 text-white" aria-hidden="true" />
                    </div>
                  )}
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div
                    className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-50 animate-scale-in"
                    role="menu"
                    aria-label="תפריט משתמש"
                  >
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
                    <div className="py-1" role="group">
                      {onOpenProfile && (
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onOpenProfile();
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <UserCog className="w-4 h-4 text-indigo-500" aria-hidden="true" />
                          פרטים אישיים
                        </button>
                      )}
                      {onOpenAccountSettings && (
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onOpenAccountSettings();
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <Users className="w-4 h-4 text-indigo-500" aria-hidden="true" />
                          שיתוף חשבון
                        </button>
                      )}
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          startTour();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <Sparkles className="w-4 h-4 text-amber-500" aria-hidden="true" />
                        סיור במערכת
                      </button>
                      <div className="my-1 border-t border-slate-100" role="separator" />
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          signOut({ callbackUrl: '/login' });
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" aria-hidden="true" />
                        התנתק
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl hover:bg-white/50 transition-all"
              aria-label="פתח תפריט"
              aria-expanded={isMobileMenuOpen}
            >
              <Menu className="w-6 h-6 text-slate-700" />
            </button>
          </div>
        </div>
      </div>

    </header>

      {/* Mobile Slide-out Menu - rendered via portal to avoid z-index issues */}
      {isMounted && isMobileMenuOpen && createPortal(
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-[9998] md:hidden transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Menu Panel */}
          <div
            ref={mobileMenuRef}
            className="fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl z-[9999] md:hidden transform transition-transform duration-300 ease-out overflow-y-auto"
            style={{ animation: 'slideInFromLeft 0.3s ease-out' }}
            role="dialog"
            aria-modal="true"
            aria-label="תפריט ניווט"
            dir="rtl"
          >
            {/* Menu Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white">
              <span className="text-lg font-bold text-slate-900">תפריט</span>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
                aria-label="סגור תפריט"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            {/* User Info */}
            {session?.user && (
              <div className="p-4 border-b border-slate-100 bg-blue-50">
                <div className="flex items-center gap-3">
                  {image ? (
                    <img
                      src={image}
                      alt=""
                      className="w-12 h-12 rounded-xl border-2 border-blue-200 shadow-lg"
                      data-sl="mask"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#2B4699] to-[#3556AB] flex items-center justify-center border-2 border-blue-200 shadow-lg">
                      <User className="w-6 h-6 text-white" aria-hidden="true" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <SensitiveData as="p" className="text-sm font-semibold text-slate-900 truncate">
                      {name || 'משתמש'}
                    </SensitiveData>
                    <SensitiveData as="p" className="text-xs text-slate-500 truncate">
                      {email}
                    </SensitiveData>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Links */}
            <nav className="p-2 bg-white" aria-label="ניווט ראשי">
              {navTabs.map((tab) => {
                const isActive = activeSection === tab.id;
                const IconComponent = navIcons[tab.id];
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      onSectionChange(tab.id);
                      setIsMobileMenuOpen(false);
                    }}
                    aria-current={isActive ? 'page' : undefined}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all mb-1 ${
                      isActive
                        ? 'bg-gradient-to-r from-[#2B4699] to-[#3556AB] text-white shadow-lg shadow-blue-500/25'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <IconComponent className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} aria-hidden="true" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>

            {/* Divider */}
            <div className="mx-4 my-2 border-t border-slate-100 bg-white" />

            {/* User Actions */}
            <div className="p-2 bg-white">
              {onOpenProfile && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenProfile();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 transition-all"
                >
                  <UserCog className="w-5 h-5 text-indigo-500" aria-hidden="true" />
                  פרטים אישיים
                </button>
              )}
              {onOpenAccountSettings && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenAccountSettings();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 transition-all"
                >
                  <Users className="w-5 h-5 text-indigo-500" aria-hidden="true" />
                  שיתוף חשבון
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  startTour();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 transition-all"
              >
                <Sparkles className="w-5 h-5 text-amber-500" aria-hidden="true" />
                סיור במערכת
              </button>
            </div>

            {/* Divider before logout */}
            <div className="mx-4 my-2 border-t border-slate-100 bg-white" />

            {/* Logout Button - subtle styling */}
            <div className="p-2 pb-6 bg-white">
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  signOut({ callbackUrl: '/login' });
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50 transition-all"
              >
                <LogOut className="w-5 h-5 text-slate-400" aria-hidden="true" />
                התנתק
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
