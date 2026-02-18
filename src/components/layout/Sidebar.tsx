'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  TrendingUp,
  BookOpen,
  Mail,
  PieChart,
  ChevronDown,
  X,
  User,
  UserCog,
  Users,
  Sparkles,
  LogOut,
  Target,
  Calculator,
  GraduationCap,
  PlayCircle,
} from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSidebar } from '@/context/SidebarContext';
import { useOnboarding } from '@/context/OnboardingContext';
import { createPortal } from 'react-dom';
import { SensitiveData } from '@/components/common/SensitiveData';
import { trackMixpanelEvent, resetMixpanel } from '@/lib/mixpanel';

interface SubNavItem {
  id: string;
  label: string;
  path: string;
  icon: typeof Home;
}

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: typeof Home;
  iconBg: string;
  iconColor: string;
  subItems?: SubNavItem[];
}

interface SidebarProps {
  onOpenProfile?: () => void;
  onOpenAccountSettings?: () => void;
}

// Build nav items (investments submenu is dynamic based on Haredi user status)
function buildNavItems(isHaredi: boolean): NavItem[] {
  return [
    {
      id: 'dashboard',
      label: 'דשבורד',
      path: '/dashboard',
      icon: Home,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    { 
      id: 'investments', 
      label: 'תיק מסחר עצמאי', 
      path: '/investments', 
      icon: TrendingUp,
      iconBg: 'bg-sky-100',
      iconColor: 'text-sky-600',
      ...(isHaredi ? {
        subItems: [
          { id: 'investments-guide', label: 'הדרכה', path: '/investments/guide', icon: GraduationCap },
          { id: 'investments-portfolio', label: 'תיק מסחר עצמאי', path: '/investments', icon: TrendingUp },
        ],
      } : {}),
    },
    { 
      id: 'goals', 
      label: 'יעדים', 
      path: '/goals', 
      icon: Target,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
    { 
      id: 'help', 
      label: 'מידע פיננסי', 
      path: '/help', 
      icon: BookOpen,
      iconBg: 'bg-[#E3D6FF]',
      iconColor: 'text-[#9F7FE0]',
      subItems: [
        { id: 'general-knowledge', label: 'ידע כללי', path: '/help', icon: BookOpen },
        { id: 'calculators', label: 'מחשבונים', path: '/calculators', icon: Calculator }, // path overridden dynamically for Haredi users
        { id: 'courses', label: 'קורס וידאו', path: '/courses', icon: PlayCircle },
      ],
    },
    { 
      id: 'contact', 
      label: 'צור קשר', 
      path: '/contact', 
      icon: Mail,
      iconBg: 'bg-cyan-100',
      iconColor: 'text-cyan-600',
    },
  ];
}

export default function Sidebar({ onOpenProfile, onOpenAccountSettings }: SidebarProps = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { isCollapsed, isMobileOpen, closeMobileSidebar } = useSidebar();
  const { startTour } = useOnboarding();
  const [expandedMenu, setExpandedMenu] = useState<string | null>(
    pathname.startsWith('/help') || pathname.startsWith('/calculators') || pathname.startsWith('/courses')
      ? 'help'
      : pathname.startsWith('/investments')
        ? 'investments'
        : pathname === '/dashboard'
          ? 'dashboard'
          : null
  );

  // Keep submenus expanded on relevant pages
  useEffect(() => {
    if ((pathname.startsWith('/calculators-haredi') || pathname.startsWith('/calculators') || pathname.startsWith('/help') || pathname.startsWith('/courses')) && expandedMenu !== 'help') {
      setExpandedMenu('help');
    }
    if (pathname.startsWith('/investments') && expandedMenu !== 'investments') {
      setExpandedMenu('investments');
    }
    if (pathname === '/dashboard' && expandedMenu !== 'dashboard') {
      setExpandedMenu('dashboard');
    }
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps
  const [mounted, setMounted] = useState(false);
  const [isHarediUser, setIsHarediUser] = useState(false);

  // Fetch signupSource to determine if user is Haredi
  useEffect(() => {
    const checkSignupSource = async () => {
      try {
        const res = await fetch('/api/user/onboarding');
        if (res.ok) {
          const data = await res.json();
          setIsHarediUser(data.signupSource === 'prog');
        }
      } catch {
        // silently ignore
      }
    };
    checkSignupSource();
  }, []);

  // For portal mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close mobile sidebar on navigation
  useEffect(() => {
    closeMobileSidebar();
  }, [pathname, closeMobileSidebar]);

  const handleNavigate = (path: string) => {
    router.push(path);
    closeMobileSidebar();
  };

  const toggleSubmenu = (itemId: string) => {
    if (isCollapsed) return; // Don't toggle submenu when collapsed
    setExpandedMenu(expandedMenu === itemId ? null : itemId);
  };

  // Build nav items dynamically
  const navItems = buildNavItems(isHarediUser);

  const isItemActive = (item: NavItem) => {
    if (item.path === '/dashboard' && pathname === '/') return true;
    if (item.subItems) {
      // Also match calculators-haredi under the help/calculators parent
      if (item.id === 'help' && (pathname.startsWith('/calculators-haredi') || pathname.startsWith('/courses'))) return true;
      // Match investments sub-routes
      if (item.id === 'investments' && pathname.startsWith('/investments')) return true;
      return pathname.startsWith(item.path.split('?')[0]);
    }
    return pathname === item.path;
  };

  // Shared navigation content
  const renderNavContent = (isMobile: boolean = false) => (
    <>
      {/* Logo Section */}
      <div className={`py-7 ${isMobile ? 'px-6' : isCollapsed ? 'px-4' : 'px-6'}`}>
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => handleNavigate('/dashboard')}
            className={`flex items-center gap-3 group cursor-pointer ${!isMobile && isCollapsed ? 'justify-center' : ''}`}
            aria-label="חזרה לדשבורד הראשי"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm flex-shrink-0">
              <PieChart
                className="w-5 h-5 text-white"
                strokeWidth={2.5}
              />
            </div>
            {(isMobile || !isCollapsed) && (
              <span
                className="text-xl font-bold text-slate-800 tracking-tight whitespace-nowrap"
                style={{ fontFamily: 'var(--font-heebo)' }}
              >
                NETO
              </span>
            )}
          </button>
          
          {/* Close button for mobile */}
          {isMobile && (
            <button
              type="button"
              onClick={closeMobileSidebar}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
              aria-label="סגור תפריט"
            >
              <X className="w-5 h-5" strokeWidth={2} />
            </button>
          )}
        </div>
      </div>

      {/* Mobile: User name and email */}
      {isMobile && session?.user && (
        <div className="px-6 py-4">
          <SensitiveData as="p" className="text-sm font-medium text-slate-700 truncate">
            {session.user.name || 'משתמש'}
          </SensitiveData>
          <SensitiveData as="p" className="text-xs text-slate-400 truncate">
            {session.user.email}
          </SensitiveData>
        </div>
      )}

      {/* Separator line */}
      <div className={`${isMobile ? 'mx-4' : isCollapsed ? 'mx-3' : 'mx-4'} border-t border-slate-100`} />

      {/* Navigation Items */}
      <nav className={`flex-1 py-3 ${isMobile ? 'px-4' : isCollapsed ? 'px-3' : 'px-4'}`} role="navigation">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isItemActive(item);
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isExpanded = expandedMenu === item.id && (isMobile || !isCollapsed);

            return (
              <div key={item.id}>
                {/* Main Nav Item */}
                <button
                  type="button"
                  onClick={() => {
                    if (hasSubItems && (isMobile || !isCollapsed)) {
                      toggleSubmenu(item.id);
                    } else {
                      handleNavigate(item.path);
                    }
                  }}
                  title={!isMobile && isCollapsed ? item.label : undefined}
                  className={`
                    w-full flex items-center gap-3 py-3 rounded-xl
                    transition-all duration-150 ease-out cursor-pointer
                    ${!isMobile && isCollapsed ? 'px-3 justify-center' : 'px-4 justify-between'}
                    ${isActive ? 'bg-slate-100' : 'hover:bg-slate-50'}
                  `}
                  aria-current={isActive && !hasSubItems ? 'page' : undefined}
                  aria-expanded={hasSubItems ? isExpanded : undefined}
                >
                  <div className={`flex items-center gap-3 ${!isMobile && isCollapsed ? 'justify-center' : ''}`}>
                    {/* Icon with pastel background */}
                    <div className={`
                      w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0
                      transition-colors duration-150
                      ${item.iconBg}
                    `}>
                      <Icon
                        className={`w-[18px] h-[18px] ${item.iconColor}`}
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                    </div>
                    
                    {/* Label */}
                    {(isMobile || !isCollapsed) && (
                      <span
                        className={`
                          text-sm font-medium transition-colors duration-150 whitespace-nowrap
                          ${isActive ? 'text-slate-900' : 'text-slate-600'}
                        `}
                      >
                        {item.label}
                      </span>
                    )}
                  </div>

                  {/* Chevron for submenu */}
                  {hasSubItems && (isMobile || !isCollapsed) && (
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </motion.div>
                  )}
                </button>

                {/* Submenu */}
                <AnimatePresence>
                  {hasSubItems && isExpanded && (isMobile || !isCollapsed) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="pr-6 pt-1 pb-2 space-y-0.5">
                        {item.subItems?.map((subItem) => {
                          const SubIcon = subItem.icon;
                          // Override calculators path for Haredi users
                          const resolvedPath = subItem.id === 'calculators' && isHarediUser
                            ? '/calculators-haredi'
                            : subItem.path;
                          const isSubActive = pathname === resolvedPath ||
                            (subItem.id === 'calculators' && (pathname === '/calculators' || pathname === '/calculators-haredi')) ||
                            (subItem.id === 'investments-guide' && pathname === '/investments/guide') ||
                            (subItem.id === 'investments-portfolio' && pathname === '/investments');
                          
                          return (
                            <button
                              key={subItem.id}
                              type="button"
                              onClick={() => handleNavigate(resolvedPath)}
                              className={`
                                w-full flex items-center gap-2.5 px-4 py-2.5 rounded-lg
                                transition-all duration-150 cursor-pointer
                                ${isSubActive 
                                  ? 'bg-indigo-50 text-indigo-700' 
                                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                                }
                              `}
                            >
                              <SubIcon className="w-4 h-4" strokeWidth={1.75} />
                              <span className="text-[13px] font-medium">{subItem.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </nav>

      {/* Mobile: User Menu Actions */}
      {isMobile && session?.user && (
        <div className="px-4 py-4 border-t border-slate-100">
          <div className="space-y-1">
            {onOpenProfile && (
              <button
                type="button"
                onClick={() => {
                  closeMobileSidebar();
                  onOpenProfile();
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <UserCog className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium">פרופיל משתמש</span>
              </button>
            )}
            {onOpenAccountSettings && (
              <button
                type="button"
                onClick={() => {
                  closeMobileSidebar();
                  onOpenAccountSettings();
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <Users className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium">חשבון משותף</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                closeMobileSidebar();
                startTour();
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium">הצג סיור</span>
            </button>
            <button
              type="button"
              onClick={() => { trackMixpanelEvent('logout'); resetMixpanel(); signOut({ callbackUrl: '/' }); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">התנתקות</span>
            </button>
          </div>
        </div>
      )}

      {/* Desktop: User Info Footer */}
      {!isMobile && session?.user && (
        <div className={`py-5 border-t border-slate-100 ${isCollapsed ? 'px-3' : 'px-4'}`}>
          <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : 'px-2'}`}>
            {session.user.image ? (
              <img
                src={session.user.image}
                alt=""
                className="w-10 h-10 rounded-full ring-2 ring-slate-100 flex-shrink-0"
                title={isCollapsed ? session.user.name || 'משתמש' : undefined}
                data-sl="mask"
              />
            ) : (
              <div 
                className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center flex-shrink-0"
                title={isCollapsed ? session.user.name || 'משתמש' : undefined}
              >
                <span className="text-slate-600 text-sm font-medium">
                  {session.user.name?.[0] || 'U'}
                </span>
              </div>
            )}
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <SensitiveData as="p" className="text-sm font-medium text-slate-700 truncate">
                  {session.user.name || 'משתמש'}
                </SensitiveData>
                <SensitiveData as="p" className="text-xs text-slate-400 truncate">
                  {session.user.email}
                </SensitiveData>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 80 : 288 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="hidden lg:flex flex-col bg-white border-l border-slate-100 sticky top-0 h-screen overflow-hidden"
        aria-label="ניווט ראשי"
      >
        {renderNavContent(false)}
      </motion.aside>

      {/* Mobile Sidebar - Rendered via Portal */}
      {mounted && createPortal(
        <AnimatePresence>
          {isMobileOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="lg:hidden fixed inset-0 bg-black/50 z-[100]"
                onClick={closeMobileSidebar}
                aria-hidden="true"
              />
              
              {/* Sidebar Panel */}
              <motion.aside
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="lg:hidden fixed top-0 right-0 bottom-0 w-[280px] bg-white shadow-xl z-[101] flex flex-col overflow-hidden"
                aria-label="ניווט ראשי"
                dir="rtl"
              >
                {renderNavContent(true)}
              </motion.aside>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
