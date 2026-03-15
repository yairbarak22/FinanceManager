'use client';

import { Trophy, Clock } from 'lucide-react';

interface VariantMetrics {
  sent: number;
  opens: number;
  clicks: number;
  openRate: number;
  clickRate: number;
  ctor: number;
}

export interface AbTestData {
  isAbTest: boolean;
  winningMetric: string | null;
  durationHours: number | null;
  percentage: number | null;
  status: string;
  winningVariantId: string | null;
  variants: {
    A: VariantMetrics;
    B: VariantMetrics;
  };
  content: Array<{ id: string; subject: string }>;
}

function MiniProgressBar({ label, rate, color }: { label: string; rate: number; color: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[#303150]">{label}</span>
        <span className="text-xs text-[#7E7F90]">{rate.toFixed(1)}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${Math.min(rate, 100)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function VariantCard({
  variantId,
  subject,
  metrics,
  isWinner,
  accentColor,
  accentBg,
}: {
  variantId: 'A' | 'B';
  subject: string;
  metrics: VariantMetrics;
  isWinner: boolean;
  accentColor: string;
  accentBg: string;
}) {
  return (
    <div className="bg-white border border-[#E8E8ED] rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: accentBg }}
          >
            <span className="text-sm font-bold" style={{ color: accentColor }}>
              {variantId}
            </span>
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-[#303150]">וריאנט {variantId}</h3>
            <p className="text-xs text-[#7E7F90] truncate max-w-[200px]" title={subject}>
              {subject}
            </p>
          </div>
        </div>
        {isWinner && (
          <div className="flex items-center gap-1.5 px-2 py-1 bg-[#0DBACC]/10 rounded-lg flex-shrink-0">
            <Trophy className="w-4 h-4 text-[#0DBACC]" />
            <span className="text-xs font-medium text-[#0DBACC]">זוכה</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-[#7E7F90]">סה&quot;כ נשלחו</span>
        <span className="text-sm font-semibold text-[#303150]">
          {metrics.sent.toLocaleString()}
        </span>
      </div>

      <div className="space-y-4 pt-4 border-t border-[#F7F7F8]">
        <MiniProgressBar label="שיעור פתיחה" rate={metrics.openRate} color="#00C875" />
        <MiniProgressBar label="שיעור לחיצה" rate={metrics.clickRate} color="#69ADFF" />
        <MiniProgressBar label="CTOR" rate={metrics.ctor} color="#8B5CF6" />
      </div>
    </div>
  );
}

export default function AbSplitTab({ data }: { data: AbTestData | null }) {
  if (!data || !data.isAbTest) {
    return (
      <div className="p-6 text-center text-sm text-[#7E7F90]">
        אין נתוני בדיקת A/B להצגה
      </div>
    );
  }

  const { variants, status, winningVariantId, winningMetric, durationHours, content } = data;
  const variantASubject = content.find((c) => c.id === 'A')?.subject || 'וריאנט A';
  const variantBSubject = content.find((c) => c.id === 'B')?.subject || 'וריאנט B';
  const isTesting = status === 'TESTING';
  const isCompleted = status === 'COMPLETED';
  const winner = winningVariantId as 'A' | 'B' | null;

  return (
    <div className="space-y-6">
      {isTesting && (
        <div className="bg-[#69ADFF]/10 border border-[#69ADFF]/20 rounded-xl p-4 flex items-center gap-3">
          <Clock className="w-5 h-5 text-[#69ADFF] animate-pulse" />
          <div>
            <p className="text-sm font-medium text-[#303150]">בדיקה בתהליך</p>
            <p className="text-xs text-[#7E7F90]">
              משך הבדיקה: {durationHours} שעות
            </p>
          </div>
        </div>
      )}

      {isCompleted && winner && (
        <div className="bg-[#0DBACC]/10 border border-[#0DBACC]/20 rounded-xl p-4 flex items-center gap-3">
          <Trophy className="w-5 h-5 text-[#0DBACC]" />
          <div>
            <p className="text-sm font-medium text-[#303150]">
              וריאנט {winner} ניצח
            </p>
            <p className="text-xs text-[#7E7F90]">
              על בסיס {winningMetric === 'OPEN_RATE' ? 'שיעור פתיחה' : 'שיעור לחיצה'}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <VariantCard
          variantId="A"
          subject={variantASubject}
          metrics={variants.A}
          isWinner={winner === 'A'}
          accentColor="#69ADFF"
          accentBg="rgba(105, 173, 255, 0.1)"
        />
        <VariantCard
          variantId="B"
          subject={variantBSubject}
          metrics={variants.B}
          isWinner={winner === 'B'}
          accentColor="#8B5CF6"
          accentBg="rgba(139, 92, 246, 0.1)"
        />
      </div>
    </div>
  );
}
