import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig, spring, Easing } from 'remotion';
import { ANIMATION_DURATION_FRAMES } from '../Root';

const RING_RADIUS = 54;
const RING_STROKE = 5;
const RING_SIZE = (RING_RADIUS + RING_STROKE) * 2;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export const ProgressRing: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = interpolate(frame, [0, ANIMATION_DURATION_FRAMES - 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.quad),
  });

  const dashOffset = CIRCUMFERENCE * (1 - progress);

  const colorProgress = interpolate(frame, [0, ANIMATION_DURATION_FRAMES], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const r = Math.round(interpolate(colorProgress, [0, 1], [105, 13]));
  const g = Math.round(interpolate(colorProgress, [0, 1], [173, 186]));
  const b = Math.round(interpolate(colorProgress, [0, 1], [255, 204]));
  const strokeColor = `rgb(${r}, ${g}, ${b})`;

  const glowOpacity = interpolate(
    Math.sin(frame * 0.12),
    [-1, 1],
    [0.15, 0.45],
  );

  const entranceScale = spring({
    frame,
    fps,
    config: { damping: 200 },
    durationInFrames: 20,
  });

  const completionPulse = frame >= ANIMATION_DURATION_FRAMES - 30
    ? spring({
        frame: frame - (ANIMATION_DURATION_FRAMES - 30),
        fps,
        config: { damping: 12, stiffness: 150 },
      })
    : 0;

  const scale = entranceScale + completionPulse * 0.08;

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
          <filter id="ring-glow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background ring */}
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          fill="none"
          stroke="#E8E8ED"
          strokeWidth={RING_STROKE}
          opacity={0.5}
        />

        {/* Glow ring */}
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          fill="none"
          stroke={strokeColor}
          strokeWidth={RING_STROKE + 6}
          strokeDasharray={`${CIRCUMFERENCE}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
          opacity={glowOpacity}
          filter="url(#ring-glow)"
        />

        {/* Main progress ring */}
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

      {/* Percentage text */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: 22,
          fontWeight: 700,
          color: strokeColor,
          fontFamily: 'var(--font-nunito), system-ui, sans-serif',
          letterSpacing: '-0.02em',
        }}
      >
        {Math.round(progress * 100)}%
      </div>
    </div>
  );
};
