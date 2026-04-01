'use client';

import type { ReactNode } from 'react';

interface StepProps {
  number: number;
  title: string;
  children: ReactNode;
}

export function Step({ number, title, children }: StepProps) {
  return (
    <div className="flex gap-4">
      {/* Number + line */}
      <div className="flex flex-col items-center">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
          style={{ background: '#69ADFF' }}
        >
          {number}
        </div>
        <div className="flex-1 w-px bg-[#F7F7F8] mt-2" />
      </div>

      {/* Content */}
      <div className="pb-8 flex-1 min-w-0">
        <h4 className="text-[15px] font-bold text-[#303150] mb-2">{title}</h4>
        <div className="text-[14px] text-[#7E7F90] leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
}

export function StepList({ children }: { children: ReactNode }) {
  return <div className="my-6">{children}</div>;
}
