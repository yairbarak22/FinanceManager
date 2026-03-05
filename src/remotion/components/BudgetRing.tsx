import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig, spring, Easing } from 'remotion';

const RING_RADIUS = 58;
const RING_STROKE = 6;
const RING_SIZE = (RING_RADIUS + RING_STROKE) * 2;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function getProgressColor(percentage: number, progress: number): string {
  if (percentage > 100) {
    const r = Math.round(interpolate(progress, [0, 1], [105, 241]));
    const g = Math.round(interpolate(progress, [0, 1], [173, 138]));
    const b = Math.round(interpolate(progress, [0, 1], [255, 181]));
    return `rgb(${r}, ${g}, ${b})`;
  }
  if (percentage > 75) {
    const r = Math.round(interpolate(progress, [0, 1], [105, 233]));
    const g = Math.round(interpolate(progress, [0, 1], [173, 168]));
    const b = Math.round(interpolate(progress, [0, 1], [255, 0]));
    return `rgb(${r}, ${g}, ${b})`;
  }
  const r = Math.round(interpolate(progress, [0, 1], [105, 13]));
  const g = Math.round(interpolate(progress, [0, 1], [173, 186]));
  const b = Math.round(interpolate(progress, [0, 1], [255, 204]));
  return `rgb(${r}, ${g}, ${b})`;
}

interface BudgetRingProps {
  targetPercentage: number;
  startFrame?: number;
  durationFrames?: number;
}

export const BudgetRing: React.FC<BudgetRingProps> = ({
  targetPercentage,
  startFrame = 20,
  durationFrames = 70,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const localFrame = Math.max(0, frame - startFrame);

  const progress = interpolate(localFrame, [0, durationFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.quad),
  });

  const displayPercentage = Math.min(targetPercentage, 100);
  const dashOffset = CIRCUMFERENCE * (1 - (displayPercentage / 100) * progress);
  const strokeColor = getProgressColor(targetPercentage, progress);

  const glowOpacity = interpolate(
    Math.sin(frame * 0.1),
    [-1, 1],
    [0.12, 0.4],
  );

  const entranceScale = spring({
    frame,
    fps,
    config: { damping: 200 },
    durationInFrames: 20,
  });

  const completionPulse = progress >= 0.95
    ? spring({
        frame: Math.max(0, localFrame - durationFrames + 5),
        fps,
        config: { damping: 12, stiffness: 150 },
      })
    : 0;

  const scale = entranceScale + completionPulse * 0.06;

  const currentValue = Math.round(targetPercentage * progress);

  return (
    <div
      style={{
        width: RING_SIZE,
        height: RING_SIZE,
        position: 'relative',
        transform: `scale(${scale})`,
      }}
    >
      <svg
        width={RING_SIZE}
        height={RING_SIZE}
        viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        <defs>
          <filter id="budget-ring-glow">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          fill="none"
          stroke="#E8E8ED"
          strokeWidth={RING_STROKE}
          opacity={0.5}
        />

        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          fill="none"
          stroke={strokeColor}
          strokeWidth={RING_STROKE + 8}
          strokeDasharray={`${CIRCUMFERENCE}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
          opacity={glowOpacity}
          filter="url(#budget-ring-glow)"
        />

        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          fill="none"
          stroke={strokeColor}
          strokeWidth={RING_STROKE}
          strokeDasharray={`${CIRCUMFERENCE}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
        />
      </svg>

      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: strokeColor,
            fontFamily: 'var(--font-nunito), system-ui, sans-serif',
            letterSpacing: '-0.02em',
            lineHeight: 1,
          }}
          dir="ltr"
        >
          {currentValue}%
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: '#7E7F90',
            fontFamily: 'var(--font-nunito), system-ui, sans-serif',
            marginTop: 2,
          }}
        >
          ניצול
        </div>
      </div>
    </div>
  );
};
