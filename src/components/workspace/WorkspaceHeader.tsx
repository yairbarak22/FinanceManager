'use client';

import { ArrowRight, Check, Loader2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { SaveStatus } from '@/lib/workspace/types';
import type { AvailableMonth } from './WorkspacePage';

interface WorkspaceHeaderProps {
  monthLabel: string;
  saveStatus: SaveStatus;
  categorizedCount: number;
  totalCount: number;
  onFinalize: () => void;
  isFinalizing: boolean;
  availableMonths?: AvailableMonth[];
  activeMonthKey?: string;
  onMonthChange?: (monthKey: string) => void;
}

export default function WorkspaceHeader({
  monthLabel, saveStatus, categorizedCount, totalCount, onFinalize, isFinalizing,
  availableMonths, activeMonthKey, onMonthChange,
}: WorkspaceHeaderProps) {
  const router = useRouter();
  const allCategorized = totalCount > 0 && categorizedCount >= totalCount;
  const progressPercent = totalCount > 0 ? Math.round((categorizedCount / totalCount) * 100) : 0;
  const showMonthTabs = availableMonths && availableMonths.length > 1;

  return (
    <header
      className="flex items-center justify-between px-6 py-3 shrink-0"
      style={{
        backgroundColor: '#FFFFFF',
        borderBottom: '2px solid #E8E8ED',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        fontFamily: 'var(--font-nunito), system-ui, sans-serif',
        zIndex: 10,
        position: 'relative',
      }}
    >
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-70"
          style={{ color: '#7E7F90' }}
        >
          חזרה
          <ArrowRight className="w-4 h-4" />
        </button>
        <div className="w-px h-5" style={{ backgroundColor: '#F7F7F8' }} />

        {showMonthTabs ? (
          <div className="flex items-center rounded-lg p-0.5 gap-0.5" style={{ border: '1px solid #E8E8ED' }}>
            {availableMonths.map((m) => {
              const isActive = m.key === activeMonthKey;
              return (
                <button
                  key={m.key}
                  onClick={() => onMonthChange?.(m.key)}
                  className="text-[11px] px-3 py-1 rounded font-semibold transition-all whitespace-nowrap"
                  style={{
                    backgroundColor: isActive ? '#F5F5F7' : 'transparent',
                    color: isActive ? '#303150' : '#BDBDCB',
                  }}
                >
                  {m.label}
                  <span className="ms-1 text-[9px] font-medium" style={{ color: isActive ? '#7E7F90' : '#BDBDCB' }}>
                    {m.count}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <span className="text-sm font-bold" style={{ color: '#303150' }}>{monthLabel}</span>
        )}
      </div>

      <div className="flex items-center gap-4">
        {saveStatus === 'saving' && (
          <div className="flex items-center gap-1.5 text-xs" style={{ color: '#7E7F90' }}>
            <Loader2 className="w-3.5 h-3.5 animate-spin" /><span>שומר...</span>
          </div>
        )}
        {saveStatus === 'saved' && (
          <div className="flex items-center gap-1.5 text-xs" style={{ color: '#0DBACC' }}>
            <Check className="w-3.5 h-3.5" /><span>נשמר</span>
          </div>
        )}
        {saveStatus === 'error' && (
          <div className="flex items-center gap-1.5 text-xs" style={{ color: '#F18AB5' }}>
            <AlertCircle className="w-3.5 h-3.5" /><span>שגיאה</span>
          </div>
        )}

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ backgroundColor: '#F7F7F8' }}>
          <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#E8E8ED' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%`, backgroundColor: allCategorized ? '#0DBACC' : '#69ADFF' }}
            />
          </div>
          <span className="text-[11px] font-bold tabular-nums" style={{ color: '#303150' }}>
            {categorizedCount}/{totalCount}
          </span>
        </div>

        <button
          onClick={onFinalize}
          disabled={isFinalizing || totalCount === 0}
          className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ backgroundColor: allCategorized ? '#0DBACC' : '#303150', color: '#FFFFFF', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)' }}
        >
          סיים וסגור חודש
          {isFinalizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
}
