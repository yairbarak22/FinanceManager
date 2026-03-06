'use client';

function Pulse({ className }: { className: string }) {
  return <div className={`bg-[#E8E8ED] rounded-full animate-pulse ${className}`} />;
}

function SummaryCardSkeleton() {
  return (
    <div className="rounded-3xl p-8 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-between mb-4">
        <Pulse className="h-4 w-20" />
        <Pulse className="h-9 w-9 !rounded-xl" />
      </div>
      <Pulse className="h-9 w-32 mb-6" />
      <div className="w-full border-t border-[#F7F7F8] mb-4" />
      <Pulse className="h-3 w-28" />
    </div>
  );
}

function CategoryRowSkeleton() {
  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-center gap-3">
        <Pulse className="h-9 w-9 !rounded-xl flex-shrink-0" />
        <div>
          <Pulse className="h-4 w-20 mb-1.5" />
          <Pulse className="h-3 w-28" />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Pulse className="h-2 w-32 !rounded-full" />
        <Pulse className="h-4 w-16" />
      </div>
    </div>
  );
}

export default function BudgetSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCardSkeleton />
        <SummaryCardSkeleton />
        <SummaryCardSkeleton />
      </div>

      {/* Category list */}
      <div className="rounded-3xl p-6 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-between mb-4">
          <Pulse className="h-5 w-32" />
          <Pulse className="h-8 w-16 !rounded-lg" />
        </div>
        <div className="divide-y divide-[#F7F7F8]">
          {[...Array(5)].map((_, i) => (
            <CategoryRowSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
