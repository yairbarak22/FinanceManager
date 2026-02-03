'use client';

import InfoTooltip from '@/components/ui/InfoTooltip';

interface AllocationProgressBarProps {
  /** Current allocation percentage (0-100) */
  currentAllocation: number;
  /** Target allocation percentage (0-100) */
  targetAllocation?: number;
  /** Show label */
  showLabel?: boolean;
  /** Show tooltip */
  showTooltip?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * AllocationProgressBar - Visual progress bar showing current vs target allocation
 * Following Neto Design System - Apple Design Philosophy
 */
export function AllocationProgressBar({
  currentAllocation,
  targetAllocation,
  showLabel = true,
  showTooltip = false,
  className = '',
}: AllocationProgressBarProps) {
  // Clamp values to 0-100
  const current = Math.max(0, Math.min(100, currentAllocation));
  const target = targetAllocation !== undefined ? Math.max(0, Math.min(100, targetAllocation)) : undefined;

  // Determine if over or under target
  const hasTarget = target !== undefined && target > 0;
  const isOverTarget = hasTarget && current > target;
  const isUnderTarget = hasTarget && current < target;

  // Color based on allocation status
  let barColor = '#69ADFF'; // Dodger Blue - default
  if (isOverTarget) {
    barColor = '#F18AB5'; // Cotton Candy Pink - over allocated
  } else if (isUnderTarget) {
    barColor = '#0DBACC'; // Turquoise - under allocated (room to grow)
  }

  return (
    <div
      className={`flex items-center gap-2 ${className}`}
      style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
    >
      {/* Progress Bar Container */}
      <div className="relative flex-1 min-w-[3rem]">
        {/* Background Track */}
        <div className="h-1.5 bg-[#F7F7F8] rounded-full overflow-hidden">
          {/* Current Allocation Bar */}
          <div
            className="h-full rounded-full transition-all duration-300 ease-out"
            style={{
              width: `${Math.min(current, 100)}%`,
              backgroundColor: barColor,
            }}
          />
        </div>

        {/* Target Marker (if target is set) */}
        {hasTarget && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 bg-[#303150] rounded-full"
            style={{ left: `${target}%` }}
            title={`יעד: ${target}%`}
          />
        )}
      </div>

      {/* Label */}
      {showLabel && (
        <span
          className="text-sm text-[#7E7F90] min-w-[2.5rem] text-left"
          style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
        >
          {current.toFixed(1)}%
        </span>
      )}

      {/* Tooltip */}
      {showTooltip && (
        <InfoTooltip
          content={
            hasTarget
              ? `אלוקציה נוכחית: ${current.toFixed(1)}% | יעד: ${target}%`
              : `אלוקציה נוכחית: ${current.toFixed(1)}%`
          }
          side="top"
        />
      )}
    </div>
  );
}

export default AllocationProgressBar;

