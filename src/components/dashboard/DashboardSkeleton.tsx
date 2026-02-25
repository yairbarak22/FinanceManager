'use client';

function SkeletonPulse({ className }: { className: string }) {
  return (
    <div
      className={`bg-[#E8E8ED] rounded-full animate-pulse ${className}`}
    />
  );
}

function CardSkeleton({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white rounded-[20px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.08)] ${className}`}
    >
      {children}
    </div>
  );
}

function SectionHeaderSkeleton() {
  return (
    <div className="flex flex-col gap-1 mb-8">
      <SkeletonPulse className="h-7 w-32" />
      <SkeletonPulse className="h-4 w-56" />
    </div>
  );
}

function SummaryCardSkeleton() {
  return (
    <div
      className="bg-white rounded-[20px] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
    >
      <SkeletonPulse className="h-4 w-16 mb-4" />
      <SkeletonPulse className="h-9 w-36 mb-6" />
      <div className="w-full border-t border-[#F7F7F8] mb-4" />
      <div className="flex items-center gap-2">
        <SkeletonPulse className="h-5 w-16 !rounded-full" />
        <SkeletonPulse className="h-3 w-24" />
      </div>
    </div>
  );
}

function PortfolioCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.08)] h-[500px] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <SkeletonPulse className="h-8 w-8 !rounded-lg" />
          <SkeletonPulse className="h-5 w-24" />
        </div>
        <SkeletonPulse className="h-8 w-8 !rounded-lg" />
      </div>
      <SkeletonPulse className="h-5 w-28 mb-4" />
      <div className="flex-1 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[#F5F5F7]/50">
            <SkeletonPulse className="h-9 w-9 !rounded-xl flex-shrink-0" />
            <div className="flex-1">
              <SkeletonPulse className="h-4 w-24 mb-1" />
              <SkeletonPulse className="h-3 w-16" />
            </div>
            <SkeletonPulse className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardSkeleton() {
  return (
    <div className="space-y-12 pb-12 animate-in fade-in duration-300">

      {/* Section 1: Financial Snapshot */}
      <section>
        <SectionHeaderSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* NetWorthHeroCard skeleton - 8 cols */}
          <div className="lg:col-span-8">
            <CardSkeleton className="h-full">
              <div className="flex items-center gap-3 mb-4">
                <SkeletonPulse className="h-10 w-10 !rounded-xl" />
                <SkeletonPulse className="h-4 w-16" />
              </div>
              <div className="flex items-center gap-3 mb-4">
                <SkeletonPulse className="h-10 w-48" />
                <SkeletonPulse className="h-6 w-16 !rounded-full" />
              </div>
              <SkeletonPulse className="h-[100px] w-full !rounded-xl mb-6" />
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-[#F5F5F7]/50">
                  <SkeletonPulse className="h-3 w-12 mb-2" />
                  <SkeletonPulse className="h-6 w-28" />
                </div>
                <div className="p-3 rounded-xl bg-[#F5F5F7]/50">
                  <SkeletonPulse className="h-3 w-16 mb-2" />
                  <SkeletonPulse className="h-6 w-28" />
                </div>
              </div>
            </CardSkeleton>
          </div>

          {/* AssetAllocationChart skeleton - 4 cols */}
          <div className="lg:col-span-4">
            <CardSkeleton className="h-full flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <SkeletonPulse className="h-8 w-8 !rounded-lg" />
                <SkeletonPulse className="h-5 w-28" />
              </div>
              <div className="flex-1 flex items-center justify-center mb-4">
                <div className="w-[180px] h-[180px] rounded-full border-[16px] border-[#E8E8ED] animate-pulse" />
              </div>
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <SkeletonPulse className="h-3 w-3 !rounded-full" />
                    <SkeletonPulse className="h-3 w-16" />
                    <div className="flex-1" />
                    <SkeletonPulse className="h-3 w-12" />
                  </div>
                ))}
              </div>
            </CardSkeleton>
          </div>
        </div>
      </section>

      {/* Section 2: Monthly Cashflow */}
      <section>
        <SectionHeaderSkeleton />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SummaryCardSkeleton />
          <SummaryCardSkeleton />
          <SummaryCardSkeleton />
        </div>
      </section>

      {/* Section 3: Portfolio Details */}
      <section>
        <SectionHeaderSkeleton />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <PortfolioCardSkeleton />
          <PortfolioCardSkeleton />
          <div className="md:col-span-2 lg:col-span-1">
            <PortfolioCardSkeleton />
          </div>
        </div>
      </section>

      {/* Section 4: Monthly Trends */}
      <section>
        <SectionHeaderSkeleton />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CardSkeleton className="min-h-[350px] md:min-h-[420px]">
            <div className="flex items-center gap-2 mb-4">
              <SkeletonPulse className="h-8 w-8 !rounded-lg" />
              <SkeletonPulse className="h-5 w-32" />
            </div>
            <div className="flex items-center gap-3 mb-6">
              <SkeletonPulse className="h-7 w-20 !rounded-lg" />
              <SkeletonPulse className="h-7 w-20 !rounded-lg" />
            </div>
            <SkeletonPulse className="h-[260px] w-full !rounded-xl" />
          </CardSkeleton>
          <CardSkeleton className="min-h-[350px] md:min-h-[420px]">
            <div className="flex items-center gap-2 mb-4">
              <SkeletonPulse className="h-8 w-8 !rounded-lg" />
              <SkeletonPulse className="h-5 w-28" />
            </div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[#F5F5F7]/50">
                  <SkeletonPulse className="h-4 w-20" />
                  <div className="flex items-center gap-4">
                    <SkeletonPulse className="h-4 w-16" />
                    <SkeletonPulse className="h-4 w-16" />
                    <SkeletonPulse className="h-4 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </CardSkeleton>
        </div>
      </section>

      {/* Section 5: Activity */}
      <section>
        <SectionHeaderSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Expenses Pie Chart */}
          <div className="bg-white rounded-3xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.08)] h-[500px] flex flex-col lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <SkeletonPulse className="h-8 w-8 !rounded-lg" />
              <SkeletonPulse className="h-5 w-28" />
            </div>
            <div className="flex-1 flex items-center justify-center mb-4">
              <div className="w-[200px] h-[200px] rounded-full border-[14px] border-[#E8E8ED] animate-pulse" />
            </div>
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <SkeletonPulse className="h-2 w-2 !rounded-full" />
                  <SkeletonPulse className="h-3 w-16" />
                  <SkeletonPulse className="h-2 flex-1" />
                  <SkeletonPulse className="h-3 w-14" />
                </div>
              ))}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-3xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.08)] h-[500px] flex flex-col lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <SkeletonPulse className="h-8 w-8 !rounded-lg" />
                <SkeletonPulse className="h-5 w-32" />
              </div>
              <div className="flex items-center gap-2">
                <SkeletonPulse className="h-8 w-20 !rounded-lg" />
                <SkeletonPulse className="h-8 w-20 !rounded-lg" />
              </div>
            </div>
            <div className="flex-1 space-y-2">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[#F5F5F7]/50">
                  <SkeletonPulse className="h-9 w-9 !rounded-xl flex-shrink-0" />
                  <div className="flex-1">
                    <SkeletonPulse className="h-4 w-32 mb-1" />
                    <SkeletonPulse className="h-3 w-20" />
                  </div>
                  <SkeletonPulse className="h-4 w-20" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
