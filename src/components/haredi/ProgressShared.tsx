'use client';

import { motion } from 'framer-motion';
import { Check, Lock } from 'lucide-react';
import { StepStatus } from '@/hooks/useHarediProgress';

// ============================================
// Circular Progress SVG
// ============================================

export function CircularProgress({
  percentage,
  size = 40,
  strokeWidth = 4,
  isPulsing = false,
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  isPulsing?: boolean;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <motion.div
      animate={isPulsing ? { scale: [1, 1.08, 1] } : { scale: 1 }}
      transition={isPulsing ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : {}}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E8E8ED"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#0DBACC"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 800ms ease-out' }}
        />
      </svg>
      {/* Percentage text */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <span className="text-[11px] font-bold text-[#303150]">
          {percentage}%
        </span>
      </div>
    </motion.div>
  );
}

// ============================================
// Status badge
// ============================================

export function StatusBadge({ status }: { status: StepStatus }) {
  const config: Record<StepStatus, { label: string; bg: string; text: string }> = {
    completed: { label: 'הושלם', bg: 'bg-[#0DBACC]/10', text: 'text-[#0DBACC]' },
    current: { label: 'בתהליך', bg: 'bg-[#69ADFF]/10', text: 'text-[#69ADFF]' },
    pending: { label: 'ממתין', bg: 'bg-[#E8E8ED]/40', text: 'text-[#7E7F90]' },
    locked: { label: 'נעול', bg: 'bg-[#E8E8ED]/40', text: 'text-[#BDBDCB]' },
  };

  const { label, bg, text } = config[status];

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${bg} ${text}`}>
      {label}
    </span>
  );
}

// ============================================
// Step icon with colored background
// ============================================

export function StepIcon({ step }: { step: { status: StepStatus; icon: React.ComponentType<{ className?: string; strokeWidth?: number }> } }) {
  const Icon = step.icon;

  const bgColors: Record<StepStatus, string> = {
    completed: 'bg-[#0DBACC]/10',
    current: 'bg-[#69ADFF]/10',
    pending: 'bg-[#E8E8ED]/40',
    locked: 'bg-[#E8E8ED]/40',
  };

  const iconColors: Record<StepStatus, string> = {
    completed: 'text-[#0DBACC]',
    current: 'text-[#69ADFF]',
    pending: 'text-[#7E7F90]',
    locked: 'text-[#BDBDCB]',
  };

  return (
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${bgColors[step.status]}`}>
      {step.status === 'completed' ? (
        <Check className="w-4 h-4 text-[#0DBACC]" strokeWidth={2.5} />
      ) : step.status === 'locked' ? (
        <Lock className="w-4 h-4 text-[#BDBDCB]" strokeWidth={1.75} />
      ) : (
        <Icon className={`w-4 h-4 ${iconColors[step.status]}`} strokeWidth={1.75} />
      )}
    </div>
  );
}
