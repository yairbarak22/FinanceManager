'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  TrendingUp,
  BookOpen,
  Mail,
  PieChart,
} from 'lucide-react';
import { useSession } from 'next-auth/react';

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: typeof Home;
  iconBg: string;
  iconColor: string;
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

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return (
    <aside
      className="hidden lg:flex flex-col w-64 bg-white border-l border-slate-100"
      aria-label="ניווט ראשי"
    >
      {/* Logo Section */}
      <div className="px-5 py-6">
        <button
          type="button"
          onClick={() => handleNavigate('/dashboard')}
          className="flex items-center gap-2.5 group cursor-pointer"
          aria-label="חזרה לדשבורד הראשי"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
            <PieChart
              className="w-5 h-5 text-white"
              strokeWidth={2.5}
            />
          </div>
          <span
            className="text-lg font-bold text-slate-800 tracking-tight"
            style={{ fontFamily: 'var(--font-heebo)' }}
          >
            NETO
          </span>
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-2" role="navigation">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path || (item.path === '/dashboard' && pathname === '/');

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigate(item.path)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                  transition-all duration-150 ease-out
                  ${
                    isActive
                      ? 'bg-slate-100'
                      : 'hover:bg-slate-50'
                  }
                `}
                aria-current={isActive ? 'page' : undefined}
              >
                {/* Icon with pastel background */}
                <div className={`
                  w-8 h-8 rounded-lg flex items-center justify-center
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
                  text-[13px] font-medium transition-colors duration-150
                  ${isActive ? 'text-slate-900' : 'text-slate-600'}
                `}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* User Info Footer */}
      {session?.user && (
        <div className="px-3 py-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-2">
            {session.user.image ? (
              <img
                src={session.user.image}
                alt=""
                className="w-9 h-9 rounded-full ring-2 ring-slate-100"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                <span className="text-slate-600 text-sm font-medium">
                  {session.user.name?.[0] || 'U'}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-slate-700 truncate">
                {session.user.name || 'משתמש'}
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                {session.user.email}
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
