'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Home, TrendingUp, BookOpen, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: typeof Home;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'דשבורד', path: '/dashboard', icon: Home },
  { id: 'investments', label: 'השקעות', path: '/investments', icon: TrendingUp },
  { id: 'help', label: 'ידע', path: '/help', icon: BookOpen },
  { id: 'contact', label: 'צור קשר', path: '/contact', icon: Mail },
];

export default function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 z-50 pb-safe"
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
              className="relative flex flex-col items-center justify-center gap-1 py-2 px-3 min-w-[60px] transition-all duration-200 rounded-lg"
              aria-current={isActive ? 'page' : undefined}
            >
              <motion.div
                initial={false}
                animate={{
                  scale: isActive ? 1.1 : 1,
                  y: isActive ? -2 : 0,
                }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              >
                <Icon
                  className={`w-5 h-5 transition-colors ${isActive ? 'text-[#2B4699]' : 'text-slate-400'}`}
                  strokeWidth={isActive ? 2.5 : 2}
                  aria-hidden="true"
                />
              </motion.div>
              <span className={`text-[10px] transition-colors ${isActive ? 'text-[#2B4699] font-semibold' : 'text-slate-500 font-medium'}`}>
                {item.label}
              </span>
              {isActive && (
                <motion.span
                  layoutId="mobile-nav-indicator"
                  className="absolute -bottom-0.5 h-0.5 w-8 bg-[#2B4699] rounded-full"
                  aria-hidden="true"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

