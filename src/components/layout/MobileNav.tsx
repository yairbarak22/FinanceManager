'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Home, TrendingUp, BookOpen, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: typeof Home;
  activeColor: string;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'דשבורד', path: '/dashboard', icon: Home, activeColor: 'text-blue-500' },
  { id: 'investments', label: 'השקעות', path: '/investments', icon: TrendingUp, activeColor: 'text-emerald-500' },
  { id: 'help', label: 'ידע', path: '/help', icon: BookOpen, activeColor: 'text-amber-500' },
  { id: 'contact', label: 'צור קשר', path: '/contact', icon: Mail, activeColor: 'text-rose-400' },
];

export default function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-50"
      aria-label="ניווט ראשי"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path || (item.path === '/dashboard' && pathname === '/');

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavigate(item.path)}
              className="relative flex flex-col items-center justify-center gap-1 py-2 px-4 min-w-[64px] transition-all duration-150 rounded-xl"
              aria-current={isActive ? 'page' : undefined}
            >
              <motion.div
                initial={false}
                animate={{
                  scale: isActive ? 1.05 : 1,
                  y: isActive ? -1 : 0,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <Icon
                  className={`w-5 h-5 transition-colors duration-150 ${isActive ? item.activeColor : 'text-slate-400'}`}
                  strokeWidth={isActive ? 2 : 1.75}
                  aria-hidden="true"
                />
              </motion.div>
              <span className={`text-[10px] transition-colors duration-150 ${isActive ? 'text-slate-700 font-medium' : 'text-slate-400 font-normal'}`}>
                {item.label}
              </span>
              {isActive && (
                <motion.span
                  layoutId="mobile-nav-indicator"
                  className="absolute -bottom-0 h-[3px] w-6 bg-slate-200 rounded-full"
                  aria-hidden="true"
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
