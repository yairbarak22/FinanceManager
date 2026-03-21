'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ChevronLeft, Settings, type LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

export type SettingsNavItem = {
  id: string;
  label: string;
  subtitle: string;
  icon: LucideIcon;
  href: string;
};

export function resolveSettingsActiveId(pathname: string, search: string): string {
  if (pathname === '/settings/dashboard') return 'dashboard';
  if (pathname === '/settings') {
    const params = new URLSearchParams(search);
    const tab = params.get('tab');
    if (tab === 'account') return 'account';
    if (tab === 'privacy') return 'privacy';
    return 'profile';
  }
  return 'profile';
}

function NavStatusIcon({ isActive, index }: { isActive: boolean; index: number }) {
  return (
    <div
      className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
        isActive ? 'bg-[#69ADFF]' : 'bg-[#69ADFF]/12'
      }`}
    >
      <span className={`text-[0.5625rem] font-bold ${isActive ? 'text-white' : 'text-[#69ADFF]'}`}>
        {index}
      </span>
    </div>
  );
}

function NavDot({
  isActive,
  index,
  href,
}: {
  isActive: boolean;
  index: number;
  href: string;
}) {
  const base = 'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-150 hover:scale-110';
  return (
    <Link
      href={href}
      className={`
        ${base}
        ${isActive ? 'bg-[#69ADFF] shadow-[0_0_0_3px_rgba(105,173,255,0.2)]' : 'bg-[#69ADFF]/10'}
      `}
      title={`סעיף ${index}`}
    >
      <span className={`text-[0.6875rem] font-bold ${isActive ? 'text-white' : 'text-[#69ADFF]'}`}>
        {index}
      </span>
    </Link>
  );
}

export default function SettingsNavSidebar({ items }: { items: readonly SettingsNavItem[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeId = resolveSettingsActiveId(pathname, searchParams.toString());
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 56 : 272 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="hidden lg:flex flex-col bg-white border-e border-[#F7F7F8] overflow-hidden flex-shrink-0"
    >
      <div
        className={`flex items-center border-b border-[#F7F7F8] ${
          isCollapsed ? 'justify-center py-3.5 px-2' : 'justify-between px-4 py-3.5'
        }`}
      >
        {!isCollapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <Settings className="w-4 h-4 text-[#69ADFF] flex-shrink-0" strokeWidth={1.75} />
            <h3 className="text-[0.8125rem] font-bold text-[#303150] whitespace-nowrap truncate">
              תפריט הגדרות
            </h3>
          </div>
        )}
        <button
          type="button"
          onClick={() => setIsCollapsed((v) => !v)}
          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[#F7F7F8] transition-colors duration-150 cursor-pointer flex-shrink-0"
          title={isCollapsed ? 'הרחב תפריט' : 'כווץ תפריט'}
        >
          <motion.div animate={{ rotate: isCollapsed ? 0 : 180 }} transition={{ duration: 0.2 }}>
            <ChevronLeft className="w-4 h-4 text-[#BDBDCB]" strokeWidth={1.75} />
          </motion.div>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-ghost">
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-1.5 py-3">
            {items.map((item, idx) => (
              <NavDot
                key={item.id}
                href={item.href}
                index={idx + 1}
                isActive={activeId === item.id}
              />
            ))}
          </div>
        ) : (
          <div className="py-1">
            {items.map((item, idx) => {
              const Icon = item.icon;
              const isActive = activeId === item.id;
              const isLast = idx === items.length - 1;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`
                    w-full flex items-center gap-2.5 px-4 py-3
                    transition-colors duration-150 text-start border-s-[3px]
                    ${isActive ? 'bg-[#69ADFF]/6 border-[#69ADFF]' : 'border-transparent hover:bg-[#F7F7F8]'}
                    ${!isLast ? 'border-b border-b-[#F7F7F8]' : ''}
                  `}
                >
                  <div className="w-7 h-7 rounded-lg bg-[#69ADFF]/8 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-3.5 h-3.5 text-[#69ADFF]" strokeWidth={1.75} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-[0.8125rem] truncate ${
                        isActive ? 'font-bold text-[#303150]' : 'font-semibold text-[#303150]'
                      }`}
                    >
                      {item.label}
                    </p>
                    <p className="text-[0.6875rem] text-[#BDBDCB] mt-px truncate">{item.subtitle}</p>
                  </div>
                  <NavStatusIcon isActive={isActive} index={idx + 1} />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </motion.aside>
  );
}
