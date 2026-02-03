'use client';

interface GoalProgressBarProps {
  progress: number; // 0-100
  segments?: number;
  className?: string;
}

/**
 * Segmented progress bar for financial goals
 * Uses 10 segments by default with Turquoise fill and Ice Cream background
 */
export default function GoalProgressBar({ 
  progress, 
  segments = 10,
  className = '' 
}: GoalProgressBarProps) {
  // Clamp progress between 0 and 100
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const filledSegments = Math.round((clampedProgress / 100) * segments);
  
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex-1 flex gap-1">
        {Array.from({ length: segments }).map((_, index) => {
          const isFilled = index < filledSegments;
          return (
            <div
              key={index}
              className="flex-1 h-2 rounded-full transition-colors"
              style={{
                backgroundColor: isFilled ? '#0DBACC' : '#F7F7F8',
              }}
            />
          );
        })}
      </div>
      <span 
        className="text-sm font-medium mr-2 tabular-nums"
        style={{ 
          color: '#7E7F90',
          fontFamily: 'var(--font-nunito), system-ui, sans-serif',
          minWidth: '40px',
          textAlign: 'left',
        }}
      >
        {Math.round(clampedProgress)}%
      </span>
    </div>
  );
}

