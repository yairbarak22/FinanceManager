'use client';

import React from 'react';

function SkeletonPulse({ className }: { className: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl ${className}`}
      style={{ backgroundColor: '#E8E8ED' }}
    />
  );
}

export default function BudgetSkeleton() {
  return (
    <div className="space-y-6">
      {/* Month selector skeleton */}
      <div className="flex items-center justify-center gap-4">
        <SkeletonPulse className="w-8 h-8 rounded-lg" />
        <SkeletonPulse className="w-40 h-7" />
        <SkeletonPulse className="w-8 h-8 rounded-lg" />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="rounded-3xl p-8"
            style={{
              background: '#FFFFFF',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            }}
          >
            <SkeletonPulse className="w-24 h-4 mb-4" />
            <SkeletonPulse className="w-36 h-9 mb-6" />
            <div style={{ borderTop: '1px solid #F7F7F8' }} className="mb-4" />
            <SkeletonPulse className="w-28 h-3" />
          </div>
        ))}
      </div>

      {/* Global progress bar */}
      <div
        className="rounded-3xl p-6"
        style={{
          background: '#FFFFFF',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <SkeletonPulse className="w-32 h-4" />
          <SkeletonPulse className="w-16 h-4" />
        </div>
        <SkeletonPulse className="w-full h-2 rounded-full" />
      </div>

      {/* Category rows */}
      <div
        className="rounded-3xl p-6 space-y-4"
        style={{
          background: '#FFFFFF',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        }}
      >
        <SkeletonPulse className="w-36 h-5 mb-2" />
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-center gap-4 py-3">
            <SkeletonPulse className="w-10 h-10 rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <SkeletonPulse className="w-20 h-4" />
                <SkeletonPulse className="w-32 h-4" />
              </div>
              <SkeletonPulse className="w-full h-2 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
