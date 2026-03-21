'use client';

import { type ReactNode, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { UserCog, LayoutDashboard, Users, Shield } from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { useMonth } from '@/context/MonthContext';
import SettingsNavSidebar, {
  type SettingsNavItem,
  resolveSettingsActiveId,
} from '@/components/settings/SettingsNavSidebar';

const SETTINGS_NAV: SettingsNavItem[] = [
  {
    id: 'profile',
    label: 'פרטים אישיים',
    subtitle: 'שם, אימייל והעדפות',
    icon: UserCog,
    href: '/settings',
  },
  {
    id: 'dashboard',
    label: 'התאמת דשבורד',
    subtitle: 'סדר וחשיפת סעיפים',
    icon: LayoutDashboard,
    href: '/settings/dashboard',
  },
  {
    id: 'account',
    label: 'חשבון משותף',
    subtitle: 'הזמנות והרשאות',
    icon: Users,
    href: '/settings?tab=account',
  },
  {
    id: 'privacy',
    label: 'פרטיות',
    subtitle: 'נתונים ומחיקה',
    icon: Shield,
    href: '/settings?tab=privacy',
  },
];

function SettingsNavSidebarFallback() {
  return (
    <aside
      className="hidden lg:flex flex-col w-[272px] shrink-0 bg-white border-e border-[#F7F7F8] overflow-hidden"
      aria-hidden
    >
      <div className="h-[52px] border-b border-[#F7F7F8] animate-pulse bg-[#F7F7F8]/50" />
      <div className="p-4 space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-14 rounded-lg bg-[#F7F7F8]/80 animate-pulse" />
        ))}
      </div>
    </aside>
  );
}

function MobileSettingsPills() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeId = resolveSettingsActiveId(pathname, searchParams.toString());

  return (
    <div
      className="lg:hidden flex gap-1 overflow-x-auto mb-5 rounded-2xl p-1.5"
      style={{
        background: '#FFFFFF',
        border: '1px solid #F7F7F8',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        fontFamily: 'var(--font-nunito), system-ui, sans-serif',
      }}
    >
      {SETTINGS_NAV.map((item) => {
        const Icon = item.icon;
        const isActive = activeId === item.id;
        return (
          <Link
            key={item.id}
            href={item.href}
            className={`flex items-center gap-1.5 whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-medium transition-all shrink-0 ${
              isActive
                ? 'bg-[#69ADFF]/10 text-[#69ADFF]'
                : 'text-[#7E7F90] hover:text-[#303150] hover:bg-[#F7F7F8]'
            }`}
          >
            <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const { selectedMonth, setSelectedMonth, allMonths, monthsWithData, currentMonth } = useMonth();

  return (
    <AppLayout
      pageTitle="הגדרות"
      selectedMonth={selectedMonth}
      onMonthChange={setSelectedMonth}
      allMonths={allMonths}
      monthsWithData={monthsWithData}
      currentMonth={currentMonth}
      showMonthFilter={false}
    >
      <div className="flex -mt-4 lg:-mt-6 -mb-4 lg:-mb-6 -ms-4 lg:-ms-6 -me-4 lg:-me-6 min-h-[calc(100vh-4rem)]">
        <Suspense fallback={<SettingsNavSidebarFallback />}>
          <SettingsNavSidebar items={SETTINGS_NAV} />
        </Suspense>

        <div className="flex-1 min-w-0 p-4 lg:p-6 space-y-6">
          <Suspense fallback={null}>
            <MobileSettingsPills />
          </Suspense>
          {children}
        </div>
      </div>
    </AppLayout>
  );
}
