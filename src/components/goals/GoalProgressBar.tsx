'use client';

import { motion } from 'framer-motion';

interface GoalProgressBarProps {
  progress: number; // 0-100
  segments?: number;
  className?: string;
}

/**
 * Segmented progress bar with animated fill cascade + circular mini-ring
 */
export default function GoalProgressBar({
  progress,
  segments = 10,
  className = ''
}: GoalProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const filledSegments = Math.round((clampedProgress / 100) * segments);

  // Circular ring calculations
  const ringSize = 32;
  const strokeWidth = 3;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (clampedProgress / 100) * circumference;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-1 flex gap-1">
        {Array.from({ length: segments }).map((_, index) => {
          const isFilled = index < filledSegments;
          return (
            <motion.div
              key={index}
              className="flex-1 h-2 rounded-full"
              style={{
                backgroundColor: isFilled ? '#0DBACC' : '#F7F7F8',
                transformOrigin: 'right',
              }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{
                delay: index * 0.05,
                duration: 0.4,
                ease: 'easeOut',
              }}
            />
          );
        })}
      </div>

      {/* Circular progress mini-ring */}
      <div className="relative flex-shrink-0" style={{ width: ringSize, height: ringSize }}>
        <svg width={ringSize} height={ringSize} className="transform -rotate-90">
          {/* Track */}
          <circle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={radius}
            fill="none"
            stroke="#E8E8ED"
            strokeWidth={strokeWidth}
          />
          {/* Fill */}
          <motion.circle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={radius}
            fill="none"
            stroke="#0DBACC"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center font-bold"
          style={{
            fontSize: '10px',
            color: '#7E7F90',
            fontFamily: 'var(--font-nunito), system-ui, sans-serif',
          }}
        >
          {Math.round(clampedProgress)}%
        </span>
      </div>
    </div>
  );
}
