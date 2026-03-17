'use client';

function Pulse({ className }: { className: string }) {
  return <div className={`bg-[#E8E8ED] rounded-full animate-pulse ${className}`} />;
}

function SummaryStripSkeleton() {
  return (
    <div
      className="rounded-2xl px-5 py-4 mb-4"
      style={{ background: '#F7F7F8' }}
    >
      <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-0">
        <div className="flex-1 flex flex-col gap-1.5 md:pe-5">
          <Pulse className="h-3 w-12" />
          <Pulse className="h-5 w-20" />
        </div>
        <div className="hidden md:block w-px h-10 bg-[#E8E8ED]" />
        <div className="flex-1 flex flex-col gap-1.5 md:px-5">
          <Pulse className="h-3 w-12" />
          <Pulse className="h-5 w-20" />
        </div>
        <div className="hidden md:block w-px h-10 bg-[#E8E8ED]" />
        <div className="flex-1 flex flex-col gap-1.5 md:px-5">
          <Pulse className="h-3 w-12" />
          <Pulse className="h-5 w-20" />
        </div>
        <div className="hidden md:block w-px h-10 bg-[#E8E8ED]" />
        <div className="flex-[1.5] flex flex-col gap-1.5 md:ps-5">
          <div className="flex items-center justify-between">
            <Pulse className="h-3 w-8" />
            <Pulse className="h-3 w-10" />
          </div>
          <Pulse className="h-1.5 w-full" />
        </div>
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div
      className="rounded-3xl p-5 flex flex-col gap-4"
      style={{
        background: '#FFFFFF',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
      }}
    >
      <div className="flex items-center gap-3">
        <Pulse className="h-9 w-9 !rounded-lg flex-shrink-0" />
        <Pulse className="h-4 flex-1 max-w-[120px]" />
      </div>
      <div className="flex justify-center">
        <Pulse className="h-[72px] w-[72px] !rounded-full" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col gap-1 items-center">
          <Pulse className="h-3 w-10" />
          <Pulse className="h-4 w-14" />
        </div>
        <div className="flex flex-col gap-1 items-center">
          <Pulse className="h-3 w-10" />
          <Pulse className="h-4 w-14" />
        </div>
        <div className="flex flex-col gap-1 items-center">
          <Pulse className="h-3 w-10" />
          <Pulse className="h-4 w-14" />
        </div>
      </div>
    </div>
  );
}

export default function BudgetSkeleton() {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div
        className="rounded-3xl p-5"
        style={{
          background: '#FFFFFF',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        }}
      >
        <SummaryStripSkeleton />

        <div className="flex justify-between mb-4">
          <Pulse className="h-5 w-28" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
