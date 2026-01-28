'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  TrendingUp,
  BookOpen,
  Mail,
  PieChart,
  ChevronDown,
  GraduationCap,
  Calculator,
  PlayCircle,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';

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

const navItems: NavItem[] = [
  { 
    id: 'dashboard', 
    label: 'דשבורד', 
    path: '/dashboard', 
    icon: Home,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-500',
  },
  { 
    id: 'investments', 
    label: 'תיק השקעות', 
    path: '/investments', 
    icon: TrendingUp,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-500',
  },
  { 
    id: 'help', 
    label: 'ידע פיננסי', 
    path: '/help', 
    icon: BookOpen,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-500',
    subItems: [
      { id: 'general', label: 'ידע כללי', path: '/help?tab=general', icon: GraduationCap },
      { id: 'calculators', label: 'מחשבונים', path: '/help?tab=calculators', icon: Calculator },
      { id: 'videos', label: 'סרטוני הדרכה', path: '/help?tab=videos', icon: PlayCircle },
    ],
  },
  { 
    id: 'contact', 
    label: 'צור קשר', 
    path: '/contact', 
    icon: Mail,
    iconBg: 'bg-rose-50',
    iconColor: 'text-rose-400',
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [expandedMenu, setExpandedMenu] = useState<string | null>(
    pathname.startsWith('/help') ? 'help' : null
  );

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  const toggleSubmenu = (itemId: string) => {
    setExpandedMenu(expandedMenu === itemId ? null : itemId);
  };

  const isItemActive = (item: NavItem) => {
    if (item.path === '/dashboard' && pathname === '/') return true;
    if (item.subItems) {
      return pathname.startsWith(item.path.split('?')[0]);
    }
    return pathname === item.path;
  };

  return (
    <aside
      className="hidden lg:flex flex-col w-72 bg-white border-l border-slate-100 sticky top-0 h-screen overflow-y-auto"
      aria-label="ניווט ראשי"
    >
      {/* Logo Section */}
      <div className="px-6 py-7">
        <button
          type="button"
          onClick={() => handleNavigate('/dashboard')}
          className="flex items-center gap-3 group cursor-pointer"
          aria-label="חזרה לדשבורד הראשי"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
            <PieChart
              className="w-5 h-5 text-white"
              strokeWidth={2.5}
            />
          </div>
          <span
            className="text-xl font-bold text-slate-800 tracking-tight"
            style={{ fontFamily: 'var(--font-heebo)' }}
          >
            NETO
          </span>
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4 py-3" role="navigation">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isItemActive(item);
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isExpanded = expandedMenu === item.id;

            return (
              <div key={item.id}>
                {/* Main Nav Item */}
                <button
                  type="button"
                  onClick={() => {
                    if (hasSubItems) {
                      toggleSubmenu(item.id);
                    } else {
                      handleNavigate(item.path);
                    }
                  }}
                  className={`
                    w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl
                    transition-all duration-150 ease-out cursor-pointer
                    ${isActive ? 'bg-slate-100' : 'hover:bg-slate-50'}
                  `}
                  aria-current={isActive && !hasSubItems ? 'page' : undefined}
                  aria-expanded={hasSubItems ? isExpanded : undefined}
                >
                  <div className="flex items-center gap-3">
                    {/* Icon with pastel background */}
                    <div className={`
                      w-9 h-9 rounded-lg flex items-center justify-center
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
                    <span className={`
                      text-sm font-medium transition-colors duration-150
                      ${isActive ? 'text-slate-900' : 'text-slate-600'}
                    `}>
                      {item.label}
                    </span>
                  </div>

                  {/* Chevron for submenu */}
                  {hasSubItems && (
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
                  {hasSubItems && isExpanded && (
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
                          const isSubActive = pathname + (typeof window !== 'undefined' ? window.location.search : '') === subItem.path;
                          
                          return (
                            <button
                              key={subItem.id}
                              type="button"
                              onClick={() => handleNavigate(subItem.path)}
                              className={`
                                w-full flex items-center gap-2.5 px-4 py-2.5 rounded-lg
                                transition-all duration-150 cursor-pointer
                                ${isSubActive 
                                  ? 'bg-amber-50 text-amber-700' 
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

      {/* User Info Footer */}
      {session?.user && (
        <div className="px-4 py-5 border-t border-slate-100">
          <div className="flex items-center gap-3 px-2">
            {session.user.image ? (
              <img
                src={session.user.image}
                alt=""
                className="w-10 h-10 rounded-full ring-2 ring-slate-100"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                <span className="text-slate-600 text-sm font-medium">
                  {session.user.name?.[0] || 'U'}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700 truncate">
                {session.user.name || 'משתמש'}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {session.user.email}
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
