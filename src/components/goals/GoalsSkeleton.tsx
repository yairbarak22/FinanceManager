'use client';

function SkeletonPulse({ className }: { className: string }) {
  return (
    <div
      className={`bg-[#E8E8ED] rounded-full animate-pulse ${className}`}
    />
  );
}

function GoalCardSkeleton() {
  return (
    <div
      className="bg-white rounded-3xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
    >
      {/* Accent bar */}
      <SkeletonPulse className="h-[3px] w-full !rounded-none" />

      <div className="p-6">
        {/* Header: icon + name + deadline */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <SkeletonPulse className="h-10 w-10 !rounded-xl" />
            <div>
              <SkeletonPulse className="h-5 w-28 mb-1" />
              <SkeletonPulse className="h-3 w-20" />
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <SkeletonPulse className="h-2.5 w-full" />
        </div>

        {/* Amount info */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <SkeletonPulse className="h-3 w-10 mb-1" />
            <SkeletonPulse className="h-5 w-20" />
          </div>
          <div>
            <SkeletonPulse className="h-3 w-10 mb-1" />
            <SkeletonPulse className="h-5 w-24" />
          </div>
        </div>

        {/* Status row */}
        <div className="flex items-center justify-between pt-4 border-t border-[#F7F7F8]">
          <div className="flex items-center gap-2">
            <SkeletonPulse className="h-4 w-4 !rounded-full" />
            <SkeletonPulse className="h-3 w-28" />
          </div>
          <SkeletonPulse className="h-6 w-16 !rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default function GoalsSkeleton() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
      <GoalCardSkeleton />
      <GoalCardSkeleton />
      <GoalCardSkeleton />
    </div>
  );
}
