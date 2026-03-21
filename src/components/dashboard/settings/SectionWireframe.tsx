'use client';

import type { DashboardSectionId } from '@/types/dashboardConfig';

/**
 * Skeleton previews for dashboard layout editor.
 * Colors follow .cursor/Design_rules.mdc — Dodger Blue, Turquoise, Baby Blue, Cotton Candy Pink — at very low opacity so the UI stays calm.
 */
const BAR = 'rounded-full bg-[#303150]/[0.10]';
const BAR_BLUE = 'rounded-full bg-[#69ADFF]/25';
const BAR_TEAL = 'rounded-full bg-[#0DBACC]/22';
const BAR_SKY = 'rounded-full bg-[#74ACEF]/22';
const BAR_PINK = 'rounded-full bg-[#F18AB5]/20';

const BOX_BLUE = 'rounded-lg bg-[#69ADFF]/[0.07]';
const BOX_TEAL = 'rounded-lg bg-[#0DBACC]/[0.06]';
const BOX_SKY = 'rounded-lg bg-[#74ACEF]/[0.08]';
const BOX_PINK = 'rounded-lg bg-[#F18AB5]/[0.06]';

const CARD =
  'rounded-xl bg-white border border-[#F0F0F4] p-3 shadow-[0_1px_0_rgba(105,173,255,0.04)]';

const ICON_SQ = 'rounded-md bg-[#69ADFF]/15';
const ICON_SQ_TEAL = 'rounded-md bg-[#0DBACC]/14';

function FinancialStatusWireframe() {
  return (
    <div className="grid grid-cols-12 gap-3 w-full">
      <div className={`col-span-8 ${CARD} flex flex-col gap-2.5`}>
        <div className={`${BAR} h-2.5 w-20`} />
        <div className={`${BAR_BLUE} h-4 w-28`} />
        <div className="flex gap-2 mt-1">
          <div className={`${BOX_TEAL} flex-1 h-7 rounded-lg border border-[#0DBACC]/10`} />
          <div className={`${BOX_PINK} flex-1 h-7 rounded-lg border border-[#F18AB5]/10`} />
        </div>
        <svg viewBox="0 0 200 40" className="w-full h-8 mt-1" preserveAspectRatio="none">
          <path
            d="M0 35 Q30 20 60 25 T120 15 T200 10"
            fill="none"
            stroke="#69ADFF"
            strokeOpacity={0.35}
            strokeWidth="2"
          />
        </svg>
      </div>
      <div className={`col-span-4 ${CARD} flex flex-col items-center gap-2`}>
        <div className="size-16 rounded-full border-[4px] border-[#74ACEF]/25 border-t-[#0DBACC]/45 border-b-[#69ADFF]/30" />
        <div className="flex flex-col gap-1.5 w-full">
          <div className={`${BAR_SKY} h-2 w-full`} />
          <div className={`${BAR_TEAL} h-2 w-4/5`} />
          <div className={`${BAR} h-2 w-3/5`} />
        </div>
      </div>
    </div>
  );
}

function CashFlowWireframe() {
  const cardGradients = [
    'from-white to-[#69ADFF]/[0.06]',
    'from-white to-[#0DBACC]/[0.05]',
    'from-white to-[#F18AB5]/[0.05]',
  ] as const;
  const barTints = [BAR_SKY, BAR_TEAL, BAR_PINK] as const;
  return (
    <div className="grid grid-cols-3 gap-3 w-full">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`rounded-xl bg-gradient-to-b ${cardGradients[i]} border border-[#F0F0F4] p-3 shadow-[0_1px_0_rgba(105,173,255,0.04)] flex flex-col gap-2`}
        >
          <div className={`${BAR} h-2 w-14`} />
          <div className={`${barTints[i]} h-3.5 w-20`} />
          <div className="h-px w-full mt-1 bg-[#E8E8ED]" />
          <div className={`${barTints[i]} h-2 w-12 rounded-full opacity-80`} />
        </div>
      ))}
    </div>
  );
}

function ActivityWireframe() {
  return (
    <div className="grid grid-cols-3 gap-3 w-full">
      <div className={`col-span-1 ${CARD} flex flex-col items-center gap-2`}>
        <div className="size-14 rounded-full border-[4px] border-[#74ACEF]/20 border-l-[#0DBACC]/35 border-b-[#F18AB5]/28" />
        <div className="flex flex-col gap-1.5 w-full">
          <div className={`${BAR_PINK} h-2 w-full`} />
          <div className={`${BAR_SKY} h-2 w-3/4`} />
        </div>
      </div>
      <div className={`col-span-2 ${CARD} flex flex-col gap-2`}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`size-5 shrink-0 ${ICON_SQ}`} />
            <div className={`${BAR} h-2 flex-1`} />
            <div className={`${i % 2 ? BAR_TEAL : BAR_PINK} h-2 w-10`} />
          </div>
        ))}
      </div>
    </div>
  );
}

function PortfolioWireframe() {
  return (
    <div className="grid grid-cols-3 gap-3 w-full">
      {[0, 1, 2].map((i) => (
        <div key={i} className={`${CARD} flex flex-col gap-2`}>
          <div className={`${BAR_BLUE} h-2 w-14`} />
          {[1, 2, 3].map((j) => (
            <div key={j} className="flex items-center gap-1.5">
              <div className={`size-3.5 shrink-0 rounded bg-[#69ADFF]/12`} />
              <div className={`${BAR} h-2 flex-1`} />
              <div className={`${j % 2 ? BAR_TEAL : BAR_PINK} h-2 w-8`} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function TrendsWireframe() {
  return (
    <div className="grid grid-cols-2 gap-3 w-full">
      <div className={`${CARD} flex flex-col gap-2`}>
        <div className={`${BAR} h-2 w-20`} />
        <div className="flex items-end gap-1.5 h-14 mt-1">
          {[50, 70, 40, 80, 55, 65, 45, 75].map((h, i) => (
            <div key={i} className="flex-1 flex flex-col gap-0.5 items-stretch" style={{ height: `${h}%` }}>
              <div className="flex-1 rounded-t bg-[#69ADFF]/22" />
              <div className="flex-1 rounded-b bg-[#F18AB5]/16" />
            </div>
          ))}
        </div>
      </div>
      <div className={`${CARD} flex flex-col gap-2`}>
        <div className={`${BAR_SKY} h-2 w-16`} />
        <div className="grid grid-cols-3 gap-2 mt-1">
          {[BOX_BLUE, BOX_TEAL, BOX_SKY].map((cls, idx) => (
            <div key={idx} className={`${cls} h-8 rounded-lg`} />
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className={`${BAR} h-2 flex-1`} />
            <div className={`${i % 2 ? BAR_BLUE : BAR_TEAL} h-2 w-10`} />
          </div>
        ))}
      </div>
    </div>
  );
}

function InvestmentPortfolioWireframe() {
  return (
    <div className="grid grid-cols-12 gap-3 w-full">
      <div className={`col-span-8 ${CARD} flex flex-col gap-2.5`}>
        <div className={`${BAR} h-2.5 w-24`} />
        <div className={`${BAR_BLUE} h-4 w-32`} />
        <div className={`${BAR_TEAL} h-2 w-16 rounded-full`} />
        <svg viewBox="0 0 200 40" className="w-full h-8 mt-1" preserveAspectRatio="none">
          <path
            d="M0 30 Q50 10 100 20 T200 8"
            fill="none"
            stroke="#0DBACC"
            strokeOpacity={0.32}
            strokeWidth="2"
          />
        </svg>
      </div>
      <div className={`col-span-4 ${CARD} flex flex-col items-center gap-2`}>
        <div className="size-16 rounded-full border-[4px] border-[#69ADFF]/22 border-b-[#74ACEF]/35 border-l-[#0DBACC]/30" />
        <div className="flex flex-col gap-1.5 w-full">
          <div className={`${BAR_SKY} h-2 w-full`} />
          <div className={`${BAR_BLUE} h-2 w-3/4`} />
        </div>
      </div>
    </div>
  );
}

function GoalsWireframe() {
  return (
    <div className="grid grid-cols-12 gap-3 w-full">
      <div className={`col-span-4 ${CARD} flex flex-col items-center gap-2`}>
        <div className={`size-8 rounded-lg ${ICON_SQ_TEAL}`} />
        <div className={`${BAR_TEAL} h-3.5 w-20`} />
        <div className="w-full h-2 rounded-full bg-[#74ACEF]/12 overflow-hidden">
          <div className="h-full w-3/5 rounded-full bg-[#0DBACC]/28" />
        </div>
        <div className={`${BAR} h-2 w-16`} />
      </div>
      <div className={`col-span-8 ${CARD} flex flex-col gap-2`}>
        <div className="flex items-center justify-between">
          <div className={`${BAR} h-2 w-14`} />
          <div className={`${BAR_BLUE} h-2 w-12`} />
        </div>
        {[60, 35, 80].map((w, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`size-5 shrink-0 ${ICON_SQ}`} />
            <div className="flex-1 flex flex-col gap-1">
              <div className={`${BAR} h-2 w-20`} />
              <div className="h-1.5 rounded-full bg-[#74ACEF]/10 overflow-hidden">
                <div
                  className={`h-full rounded-full ${i === 1 ? 'bg-[#F18AB5]/25' : 'bg-[#0DBACC]/26'}`}
                  style={{ width: `${w}%` }}
                />
              </div>
            </div>
            <div className={`${BAR_SKY} h-2 w-10`} />
          </div>
        ))}
      </div>
    </div>
  );
}

function BudgetsWireframe() {
  return (
    <div className="grid grid-cols-12 gap-3 w-full">
      <div className={`col-span-4 ${CARD} flex flex-col items-center gap-2`}>
        <div className={`size-8 rounded-lg ${ICON_SQ}`} />
        <div className={`${BAR_PINK} h-3.5 w-20`} />
        <div className="w-full h-2 rounded-full bg-[#74ACEF]/10 overflow-hidden relative">
          <div className="h-full w-2/3 rounded-full bg-[#69ADFF]/22" />
          <div
            className="absolute top-0 h-full w-px bg-[#0DBACC]/45"
            style={{ left: '55%' }}
          />
        </div>
        <div className={`${BAR_TEAL} h-2 w-14 rounded-full`} />
      </div>
      <div className={`col-span-8 ${CARD} flex flex-col gap-2`}>
        <div className="flex items-center justify-between">
          <div className={`${BAR} h-2 w-14`} />
          <div className={`${BAR_SKY} h-2 w-12`} />
        </div>
        {[75, 40, 90].map((w, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`size-5 shrink-0 ${ICON_SQ_TEAL}`} />
            <div className="flex-1 flex flex-col gap-1">
              <div className={`${BAR} h-2 w-16`} />
              <div className="h-1.5 rounded-full bg-[#F18AB5]/08 overflow-hidden">
                <div className="h-full rounded-full bg-[#69ADFF]/24" style={{ width: `${w}%` }} />
              </div>
            </div>
            <div className={`${BAR_PINK} h-2 w-10`} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SectionWireframe({ id }: { id: DashboardSectionId }) {
  switch (id) {
    case 'financial_status':
      return <FinancialStatusWireframe />;
    case 'cash_flow':
      return <CashFlowWireframe />;
    case 'activity':
      return <ActivityWireframe />;
    case 'portfolio':
      return <PortfolioWireframe />;
    case 'trends':
      return <TrendsWireframe />;
    case 'investment_portfolio':
      return <InvestmentPortfolioWireframe />;
    case 'goals':
      return <GoalsWireframe />;
    case 'budgets':
      return <BudgetsWireframe />;
  }
}
