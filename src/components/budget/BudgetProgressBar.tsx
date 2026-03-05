'use client';

import React from 'react';

interface BudgetProgressBarProps {
  percentage: number;
  height?: number;
  showLabel?: boolean;
  label?: string;
}

function getProgressColor(percentage: number): string {
  if (percentage > 100) return '#F18AB5';
  if (percentage > 75) return '#E9A800';
  return '#0DBACC';
}

export default function BudgetProgressBar({
  percentage,
  height = 4,
  showLabel = false,
  label,
}: BudgetProgressBarProps) {
  const color = getProgressColor(percentage);
  const clampedWidth = Math.min(percentage, 100);

  return (
    <div>
      {showLabel && (
        <div className="flex items-center justify-between mb-2">
          <span
            style={{
              fontFamily: 'var(--font-nunito), system-ui, sans-serif',
              fontWeight: 500,
              fontSize: '13px',
              color: '#7E7F90',
            }}
          >
            {label || 'ניצול תקציב כולל'}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-nunito), system-ui, sans-serif',
              fontWeight: 600,
              fontSize: '13px',
              color: color,
            }}
            dir="ltr"
          >
            {percentage.toFixed(1)}%
          </span>
        </div>
      )}
      <div
        className="w-full rounded-full overflow-hidden"
        style={{
          height: `${height}px`,
          backgroundColor: '#E8E8ED',
        }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${clampedWidth}%`,
            backgroundColor: color,
            transition: 'width 500ms ease-out, background-color 300ms ease-out',
            boxShadow: percentage > 0 ? `0 0 8px ${color}40` : 'none',
          }}
        />
      </div>
    </div>
  );
}
