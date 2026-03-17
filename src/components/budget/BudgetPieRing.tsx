'use client';

import React, { useEffect, useState } from 'react';

interface BudgetPieRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}

function getRingColor(pct: number): string {
  if (pct > 100) return '#F18AB5';
  if (pct > 75) return '#E9A800';
  return '#0DBACC';
}

export default function BudgetPieRing({
  percentage,
  size = 56,
  strokeWidth = 4,
}: BudgetPieRingProps) {
  const [mounted, setMounted] = useState(false);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPct = Math.min(percentage, 100);
  const dashOffset = circumference - (clampedPct / 100) * circumference;
  const color = getRingColor(percentage);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E8E8ED"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={mounted ? dashOffset : circumference}
          style={{
            transition: 'stroke-dashoffset 800ms ease-out, stroke 300ms ease-out',
          }}
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center"
        style={{
          fontFamily: 'var(--font-nunito), system-ui, sans-serif',
          fontSize: size <= 48 ? '10px' : '12px',
          fontWeight: 700,
          color,
        }}
        dir="ltr"
      >
        {percentage.toFixed(0)}%
      </span>
    </div>
  );
}
