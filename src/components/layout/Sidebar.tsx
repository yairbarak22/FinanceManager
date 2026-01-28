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
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'דשבורד', path: '/dashboard', icon: Home },
  { id: 'investments', label: 'תיק השקעות', path: '/investments', icon: TrendingUp },
  { id: 'help', label: 'ידע פיננסי', path: '/help', icon: BookOpen },
  { id: 'contact', label: 'צור קשר', path: '/contact', icon: Mail },
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
      className="hidden lg:flex flex-col w-64 border-l border-slate-200 bg-white/80 backdrop-blur-sm"
      aria-label="ניווט ראשי"
    >
      {/* Logo Section */}
      <div className="p-6 border-b border-slate-200">
        <button
          type="button"
          onClick={() => handleNavigate('/dashboard')}
          className="flex items-center gap-2 group cursor-pointer hover:opacity-80 transition-opacity"
          aria-label="חזרה לדשבורד הראשי"
        >
          <PieChart
            className="w-8 h-8 text-[#2B4699]"
            strokeWidth={3}
          />
          <span
            className="text-xl font-black text-[#1D1D1F]"
            style={{ fontFamily: 'var(--font-heebo)' }}
          >
            NETO
          </span>
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-2" role="navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path || (item.path === '/dashboard' && pathname === '/');

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavigate(item.path)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl
                transition-all duration-200
                ${
                  isActive
                    ? 'bg-[#2B4699] text-white shadow-md'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500'}`}
                strokeWidth={2}
                aria-hidden="true"
              />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Info Footer */}
      {session?.user && (
        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3">
            {session.user.image ? (
              <img
                src={session.user.image}
                alt=""
                className="w-10 h-10 rounded-xl border-2 border-blue-200"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2B4699] to-[#3556AB] flex items-center justify-center border-2 border-blue-200">
                <span className="text-white text-sm font-semibold">
                  {session.user.name?.[0] || 'U'}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {session.user.name || 'משתמש'}
              </p>
              <p className="text-xs text-slate-500 truncate">{session.user.email}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

