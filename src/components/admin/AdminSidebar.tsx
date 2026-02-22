'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Users, Mail, Shield, LogOut, ChevronDown, BarChart3, FileText, List, LayoutDashboard, Inbox, X, Timer } from 'lucide-react';
import { SensitiveData } from '@/components/common/SensitiveData';

interface SubNavItem {
  id: string;
  label: string;
  path: string;
  icon: typeof LayoutDashboard;
  badge?: number;
}

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: typeof Users;
  subItems?: SubNavItem[];
}

const navItems: NavItem[] = [
  {
    id: 'users',
    label: 'משתמשים',
    path: '/admin/users',
    icon: Users,
  },
  {
    id: 'marketing',
    label: 'מערכת דיוור',
    path: '/admin/marketing',
    icon: Mail,
    subItems: [
      {
        id: 'marketing-dashboard',
        label: 'דאשבורד',
        path: '/admin/marketing',
        icon: LayoutDashboard,
      },
      {
        id: 'marketing-inbox',
        label: 'תיבת דואר',
        path: '/admin/marketing/inbox',
        icon: Inbox,
      },
      {
        id: 'marketing-campaigns',
        label: 'קמפיינים',
        path: '/admin/marketing/campaigns',
        icon: BarChart3,
      },
      {
        id: 'marketing-templates',
        label: 'תבניות',
        path: '/admin/marketing/templates',
        icon: FileText,
      },
      {
        id: 'marketing-sequences',
        label: 'סדרות מיילים',
        path: '/admin/marketing/email-sequences',
        icon: Timer,
      },
      {
        id: 'marketing-logs',
        label: 'לוגים',
        path: '/admin/marketing/logs',
        icon: List,
      },
    ],
  },
];

interface AdminSidebarProps {
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export default function AdminSidebar({ isMobileOpen, onMobileClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [expandedMenu, setExpandedMenu] = useState<string | null>(
    pathname.startsWith('/admin/marketing') ? 'marketing' : null
  );
  const [unreadCount, setUnreadCount] = useState(0);

  // Keep submenu expanded when on marketing pages
  useEffect(() => {
    if (pathname.startsWith('/admin/marketing') && expandedMenu !== 'marketing') {
      setExpandedMenu('marketing');
    }
  }, [pathname, expandedMenu]);

  // Fetch unread count for inbox badge
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/inbox/unread-count');
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count || 0);
      }
    } catch {
      // Silently fail - badge is not critical
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    // Poll every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Refresh when navigating to inbox
  useEffect(() => {
    if (pathname.startsWith('/admin/marketing/inbox')) {
      fetchUnreadCount();
    }
  }, [pathname, fetchUnreadCount]);

  // Close mobile sidebar on navigation
  useEffect(() => {
    onMobileClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const toggleSubmenu = (itemId: string) => {
    setExpandedMenu(expandedMenu === itemId ? null : itemId);
  };

  const isActive = (path: string) => {
    if (path === '/admin/marketing') {
      return pathname.startsWith('/admin/marketing') && pathname === '/admin/marketing';
    }
    return pathname === path;
  };

  const isSubItemActive = (path: string) => {
    if (path === '/admin/marketing/inbox') {
      return pathname.startsWith('/admin/marketing/inbox');
    }
    return pathname === path;
  };

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  const sidebarContent = (
    <>
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-[#F7F7F8]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#69ADFF] to-[#5A9EE6] flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#303150]">מנהל מערכת</h2>
              <p className="text-xs text-[#7E7F90]">Admin Panel</p>
            </div>
          </div>
          {/* Mobile close button */}
          <button
            onClick={onMobileClose}
            className="lg:hidden p-2 hover:bg-[#F7F7F8] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-[#7E7F90]" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isExpanded = expandedMenu === item.id;
            const isParentActive = pathname.startsWith(item.path) && item.path !== '/admin/users';

            return (
              <li key={item.id}>
                <button
                  onClick={() => {
                    if (hasSubItems) {
                      toggleSubmenu(item.id);
                    } else {
                      handleNavigate(item.path);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    active || isParentActive
                      ? 'bg-[#69ADFF] text-white shadow-sm'
                      : 'text-[#7E7F90] hover:bg-[#F7F7F8]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium flex-1 text-right">{item.label}</span>
                  {hasSubItems && (
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  )}
                </button>
                {/* Submenu */}
                {hasSubItems && isExpanded && (
                  <ul className="mt-2 mr-4 space-y-1">
                    {item.subItems!.map((subItem) => {
                      const SubIcon = subItem.icon;
                      const subActive = isSubItemActive(subItem.path);
                      const showBadge = subItem.id === 'marketing-inbox' && unreadCount > 0;
                      return (
                        <li key={subItem.id}>
                          <button
                            onClick={() => handleNavigate(subItem.path)}
                            className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl transition-all text-sm ${
                              subActive
                                ? 'bg-[#69ADFF]/20 text-[#69ADFF] font-medium'
                                : 'text-[#7E7F90] hover:bg-[#F7F7F8]'
                            }`}
                          >
                            <SubIcon className="w-4 h-4" />
                            <span className="flex-1 text-right">{subItem.label}</span>
                            {showBadge && (
                              <span className="bg-[#F18AB5] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                {unreadCount > 99 ? '99+' : unreadCount}
                              </span>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Footer */}
      {session?.user && (
        <div className="p-4 border-t border-[#F7F7F8]">
          <div className="flex items-center gap-3 mb-3 px-2">
            {session.user.image ? (
              <img
                src={session.user.image}
                alt=""
                className="w-10 h-10 rounded-full ring-2 ring-[#F7F7F8]"
                data-sl="mask"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F7F7F8] to-[#E8E8ED] flex items-center justify-center">
                <span className="text-[#7E7F90] text-sm font-medium">
                  {session.user.name?.[0] || 'U'}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <SensitiveData as="p" className="text-sm font-medium text-[#303150] truncate">
                {session.user.name || 'משתמש'}
              </SensitiveData>
              <SensitiveData as="p" className="text-xs text-[#7E7F90] truncate">
                {session.user.email}
              </SensitiveData>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[#F18AB5] hover:bg-[#F7F7F8] transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">התנתקות</span>
          </button>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white border-l border-[#F7F7F8] min-h-screen flex-col flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      <div
        className={`lg:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${
          isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onMobileClose}
        aria-hidden="true"
      />

      {/* Mobile Sidebar Panel */}
      <aside
        className={`lg:hidden fixed top-0 right-0 bottom-0 z-50 w-72 bg-white flex flex-col transform transition-transform duration-300 ease-in-out shadow-2xl ${
          isMobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
      >
        {sidebarContent}
      </aside>
    </>
  );
}
