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
      <SkeletonPulse className="h-7 w-36" />
      <SkeletonPulse className="h-4 w-52" />
    </div>
  );
}

export function InvestmentsSkeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`space-y-12 pb-12 animate-in fade-in duration-300 ${className}`}
    >
      {/* Section 1: Portfolio Overview */}
      <section>
        <SectionHeaderSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Portfolio Summary Hero - 8 cols */}
          <div className="lg:col-span-8">
            <CardSkeleton className="h-full">
              <div className="flex items-center gap-3 mb-4">
                <SkeletonPulse className="h-10 w-10 !rounded-xl" />
                <SkeletonPulse className="h-4 w-24" />
              </div>
              <div className="flex items-center gap-3 mb-2">
                <SkeletonPulse className="h-10 w-48" />
                <SkeletonPulse className="h-6 w-20 !rounded-full" />
              </div>
              <SkeletonPulse className="h-4 w-32 mb-6" />
              <SkeletonPulse className="h-[120px] w-full !rounded-xl mb-6" />
              <div className="grid grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="p-3 rounded-xl bg-[#F5F5F7]/50">
                    <SkeletonPulse className="h-3 w-16 mb-2" />
                    <SkeletonPulse className="h-5 w-24" />
                  </div>
                ))}
              </div>
            </CardSkeleton>
          </div>

          {/* Portfolio Settings Card - 4 cols */}
          <div className="lg:col-span-4">
            <CardSkeleton className="h-full flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                <SkeletonPulse className="h-8 w-8 !rounded-lg" />
                <SkeletonPulse className="h-5 w-20" />
              </div>
              <div className="space-y-4 flex-1">
                <div className="p-3 rounded-xl bg-[#F5F5F7]/50">
                  <SkeletonPulse className="h-3 w-20 mb-2" />
                  <SkeletonPulse className="h-8 w-full !rounded-lg" />
                </div>
                <div className="p-3 rounded-xl bg-[#F5F5F7]/50">
                  <SkeletonPulse className="h-3 w-24 mb-2" />
                  <SkeletonPulse className="h-4 w-32" />
                </div>
                <div className="flex gap-3 mt-auto pt-4">
                  <SkeletonPulse className="h-10 flex-1 !rounded-xl" />
                  <SkeletonPulse className="h-10 flex-1 !rounded-xl" />
                </div>
              </div>
            </CardSkeleton>
          </div>
        </div>
      </section>

      {/* Section 2: Detailed Portfolio */}
      <section>
        <SectionHeaderSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" style={{ height: '700px' }}>
          {/* Holdings Table - 8 cols */}
          <div className="lg:col-span-8 h-full">
            <CardSkeleton className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <SkeletonPulse className="h-8 w-8 !rounded-lg" />
                  <SkeletonPulse className="h-5 w-28" />
                </div>
                <SkeletonPulse className="h-8 w-24 !rounded-lg" />
              </div>
              {/* Table header */}
              <div className="flex items-center gap-4 p-3 mb-2">
                <SkeletonPulse className="h-3 w-20" />
                <SkeletonPulse className="h-3 w-16" />
                <SkeletonPulse className="h-3 w-16" />
                <SkeletonPulse className="h-3 w-12" />
                <div className="flex-1" />
                <SkeletonPulse className="h-3 w-16" />
              </div>
              {/* Table rows */}
              <div className="flex-1 space-y-2">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-[#F5F5F7]/50">
                    <SkeletonPulse className="h-8 w-8 !rounded-lg flex-shrink-0" />
                    <div className="flex-1">
                      <SkeletonPulse className="h-4 w-24 mb-1" />
                      <SkeletonPulse className="h-3 w-16" />
                    </div>
                    <SkeletonPulse className="h-4 w-16" />
                    <SkeletonPulse className="h-4 w-16" />
                    <SkeletonPulse className="h-5 w-14 !rounded-full" />
                  </div>
                ))}
              </div>
            </CardSkeleton>
          </div>

          {/* Smart Insights Panel - 4 cols */}
          <div className="lg:col-span-4 h-full">
            <CardSkeleton className="h-full flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                <SkeletonPulse className="h-8 w-8 !rounded-lg" />
                <SkeletonPulse className="h-5 w-32" />
              </div>
              {/* Risk gauge */}
              <div className="flex items-center justify-center mb-6">
                <div className="w-[140px] h-[70px] rounded-t-full border-[10px] border-b-0 border-[#E8E8ED] animate-pulse" />
              </div>
              <SkeletonPulse className="h-4 w-20 mx-auto mb-6" />
              {/* Sector allocation */}
              <div className="flex-1 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <SkeletonPulse className="h-3 w-3 !rounded-full" />
                    <SkeletonPulse className="h-3 w-20" />
                    <SkeletonPulse className="h-2 flex-1" />
                    <SkeletonPulse className="h-3 w-10" />
                  </div>
                ))}
              </div>
            </CardSkeleton>
          </div>
        </div>
      </section>
    </div>
  );
}
