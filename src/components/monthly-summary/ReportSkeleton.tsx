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
      className={`bg-white rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.08)] ${className}`}
    >
      {children}
    </div>
  );
}

export default function ReportSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Hero Card */}
      <CardSkeleton className="p-8">
        <SkeletonPulse className="h-4 w-40 mb-4" />
        <SkeletonPulse className="h-10 w-52 mb-5" />
        <SkeletonPulse className="h-1.5 w-full mb-4" />
        <div className="flex justify-between">
          <div className="flex items-center gap-2">
            <SkeletonPulse className="h-2 w-2 !rounded-full" />
            <SkeletonPulse className="h-3 w-12" />
            <SkeletonPulse className="h-4 w-20" />
          </div>
          <div className="flex items-center gap-2">
            <SkeletonPulse className="h-2 w-2 !rounded-full" />
            <SkeletonPulse className="h-3 w-12" />
            <SkeletonPulse className="h-4 w-20" />
          </div>
        </div>
      </CardSkeleton>

      {/* AI Insights Card */}
      <CardSkeleton>
        <div className="flex items-center gap-2 mb-6">
          <SkeletonPulse className="h-8 w-8 !rounded-lg" />
          <SkeletonPulse className="h-5 w-24" />
        </div>
        <div className="space-y-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-[#F5F5F7]/50">
              <SkeletonPulse className="h-9 w-9 !rounded-xl flex-shrink-0" />
              <div className="flex-1">
                <SkeletonPulse className="h-3 w-16 mb-2" />
                <SkeletonPulse className="h-4 w-full max-w-[280px]" />
              </div>
            </div>
          ))}
        </div>
      </CardSkeleton>

      {/* Two-column row: Expenses + Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CardSkeleton>
          <SkeletonPulse className="h-5 w-32 mb-5" />
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="w-[200px] h-[200px] mx-auto lg:mx-0">
              <div className="w-full h-full rounded-full border-[14px] border-[#E8E8ED] animate-pulse" />
            </div>
            <div className="flex-1 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <SkeletonPulse className="h-2 w-2 !rounded-full" />
                  <SkeletonPulse className="h-4 w-16" />
                  <SkeletonPulse className="h-2 flex-1" />
                  <SkeletonPulse className="h-4 w-14" />
                </div>
              ))}
            </div>
          </div>
        </CardSkeleton>

        <CardSkeleton>
          <div className="flex items-center gap-2 mb-5">
            <SkeletonPulse className="h-8 w-8 !rounded-lg" />
            <SkeletonPulse className="h-5 w-40" />
          </div>
          <SkeletonPulse className="h-[220px] w-full !rounded-xl" />
        </CardSkeleton>
      </div>

      {/* Two-column row: Goals + Obligations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CardSkeleton>
          <div className="flex items-center gap-2 mb-5">
            <SkeletonPulse className="h-8 w-8 !rounded-lg" />
            <SkeletonPulse className="h-5 w-28" />
          </div>
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="p-3 rounded-xl bg-[#F5F5F7]/50">
                <div className="flex justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <SkeletonPulse className="h-8 w-8 !rounded-lg" />
                    <SkeletonPulse className="h-4 w-20" />
                  </div>
                  <SkeletonPulse className="h-4 w-28" />
                </div>
                <SkeletonPulse className="h-2.5 w-full" />
              </div>
            ))}
          </div>
        </CardSkeleton>

        <CardSkeleton>
          <div className="flex items-center gap-2 mb-5">
            <SkeletonPulse className="h-8 w-8 !rounded-lg" />
            <SkeletonPulse className="h-5 w-40" />
          </div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[#F5F5F7]/50">
                <SkeletonPulse className="h-9 w-9 !rounded-xl flex-shrink-0" />
                <div className="flex-1">
                  <SkeletonPulse className="h-4 w-32 mb-1" />
                  <SkeletonPulse className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        </CardSkeleton>
      </div>

      {/* Net Worth Card */}
      <CardSkeleton>
        <div className="flex items-center gap-2 mb-4">
          <SkeletonPulse className="h-8 w-8 !rounded-lg" />
          <SkeletonPulse className="h-5 w-40" />
        </div>
        <SkeletonPulse className="h-8 w-36 mb-4" />
        <SkeletonPulse className="h-[80px] w-full !rounded-xl mb-5" />
        <SkeletonPulse className="h-10 w-full !rounded-xl" />
      </CardSkeleton>
    </div>
  );
}
