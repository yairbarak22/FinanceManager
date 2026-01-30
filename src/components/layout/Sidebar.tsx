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
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSidebar } from '@/context/SidebarContext';

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

// All icons in blue shades
const navItems: NavItem[] = [
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
    label: 'תיק השקעות', 
    path: '/investments', 
    icon: TrendingUp,
    iconBg: 'bg-sky-100',
    iconColor: 'text-sky-600',
  },
  { 
    id: 'help', 
    label: 'ידע פיננסי', 
    path: '/help', 
    icon: BookOpen,
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
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

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { isCollapsed } = useSidebar();
  const [expandedMenu, setExpandedMenu] = useState<string | null>(
    pathname.startsWith('/help') ? 'help' : null
  );

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  const toggleSubmenu = (itemId: string) => {
    if (isCollapsed) return; // Don't toggle submenu when collapsed
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
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 80 : 288 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="hidden lg:flex flex-col bg-white border-l border-slate-100 sticky top-0 h-screen overflow-hidden"
      aria-label="ניווט ראשי"
    >
      {/* Logo Section */}
      <div className={`py-7 ${isCollapsed ? 'px-4' : 'px-6'}`}>
        <button
          type="button"
          onClick={() => handleNavigate('/dashboard')}
          className={`flex items-center gap-3 group cursor-pointer ${isCollapsed ? 'justify-center' : ''}`}
          aria-label="חזרה לדשבורד הראשי"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm flex-shrink-0">
            <PieChart
              className="w-5 h-5 text-white"
              strokeWidth={2.5}
            />
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15 }}
                className="text-xl font-bold text-slate-800 tracking-tight whitespace-nowrap overflow-hidden"
                style={{ fontFamily: 'var(--font-heebo)' }}
              >
                NETO
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Navigation Items */}
      <nav className={`flex-1 py-3 ${isCollapsed ? 'px-3' : 'px-4'}`} role="navigation">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isItemActive(item);
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isExpanded = expandedMenu === item.id && !isCollapsed;

            return (
              <div key={item.id}>
                {/* Main Nav Item */}
                <button
                  type="button"
                  onClick={() => {
                    if (hasSubItems && !isCollapsed) {
                      toggleSubmenu(item.id);
                    } else {
                      handleNavigate(item.path);
                    }
                  }}
                  title={isCollapsed ? item.label : undefined}
                  className={`
                    w-full flex items-center gap-3 py-3 rounded-xl
                    transition-all duration-150 ease-out cursor-pointer
                    ${isCollapsed ? 'px-3 justify-center' : 'px-4 justify-between'}
                    ${isActive ? 'bg-slate-100' : 'hover:bg-slate-50'}
                  `}
                  aria-current={isActive && !hasSubItems ? 'page' : undefined}
                  aria-expanded={hasSubItems ? isExpanded : undefined}
                >
                  <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
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
                    <AnimatePresence>
                      {!isCollapsed && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.15 }}
                          className={`
                            text-sm font-medium transition-colors duration-150 whitespace-nowrap overflow-hidden
                            ${isActive ? 'text-slate-900' : 'text-slate-600'}
                          `}
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Chevron for submenu */}
                  {hasSubItems && !isCollapsed && (
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
                  {hasSubItems && isExpanded && !isCollapsed && (
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

      {/* User Info Footer */}
      {session?.user && (
        <div className={`py-5 border-t border-slate-100 ${isCollapsed ? 'px-3' : 'px-4'}`}>
          <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : 'px-2'}`}>
            {session.user.image ? (
              <img
                src={session.user.image}
                alt=""
                className="w-10 h-10 rounded-full ring-2 ring-slate-100 flex-shrink-0"
                title={isCollapsed ? session.user.name || 'משתמש' : undefined}
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
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex-1 min-w-0 overflow-hidden"
                >
                  <p className="text-sm font-medium text-slate-700 truncate">
                    {session.user.name || 'משתמש'}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {session.user.email}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </motion.aside>
  );
}
