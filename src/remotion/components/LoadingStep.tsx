import React, { useMemo } from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from 'remotion';

type StepState = 'upcoming' | 'active' | 'completed';

type LoadingStepProps = {
  index: number;
  label: string;
  state: StepState;
  stepStartFrame: number;
  iconRenderer?: (color: string) => React.ReactNode;
};

export const LoadingStep: React.FC<LoadingStepProps> = ({
  index,
  label,
  state,
  stepStartFrame,
  iconRenderer,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = Math.max(0, frame - stepStartFrame);

  const entrance = spring({
    frame: localFrame,
    fps,
    config: { damping: 18, stiffness: 120 },
  });

  const slideX = interpolate(entrance, [0, 1], [30, 0]);
  const opacity = interpolate(entrance, [0, 1], [0, 1]);

  const checkScale = state === 'completed'
    ? spring({
        frame: localFrame,
        fps,
        delay: 5,
        config: { damping: 10, stiffness: 200 },
      })
    : 0;

  const dotFrameBase = state === 'active' ? localFrame : 0;

  const circleColor =
    state === 'completed'
      ? '#0DBACC'
      : state === 'active'
        ? '#69ADFF'
        : '#E8E8ED';

  const textColor =
    state === 'completed'
      ? '#0DBACC'
      : state === 'active'
        ? '#303150'
        : '#BDBDCB';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        opacity,
        transform: `translateX(${slideX}px)`,
        direction: 'rtl',
      }}
    >
      {/* Step indicator circle */}
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          backgroundColor: circleColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transform: state === 'completed' ? `scale(${checkScale})` : 'none',
        }}
      >
        {state === 'completed' ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M20 6L9 17L4 12"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : iconRenderer ? (
          iconRenderer('white')
        ) : (
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'white',
              fontFamily: 'var(--font-nunito), system-ui, sans-serif',
            }}
          >
            {index + 1}
          </span>
        )}
      </div>

      {/* Step label */}
      <span
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: textColor,
          fontFamily: 'var(--font-nunito), system-ui, sans-serif',
          flex: 1,
        }}
      >
        {label}
      </span>

      {/* Loading dots for active step */}
      {state === 'active' && (
        <div style={{ display: 'flex', gap: 4, marginInlineStart: 'auto' }}>
          {[0, 1, 2].map((dotIdx) => {
            const dotBounce = interpolate(
              Math.sin((dotFrameBase + dotIdx * 5) * 0.25),
              [-1, 1],
              [0, -6],
            );
            return (
              <div
                key={dotIdx}
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  backgroundColor: '#69ADFF',
                  transform: `translateY(${dotBounce}px)`,
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

type StepIconProps = {
  state: StepState;
  localFrame: number;
  fps: number;
  children: React.ReactNode;
};

export const StepIcon: React.FC<StepIconProps> = ({
  state,
  localFrame,
  fps,
  children,
}) => {
  const iconScale = spring({
    frame: localFrame,
    fps,
    config: { damping: 12, stiffness: 150 },
  });

  const rotation = interpolate(
    spring({
      frame: localFrame,
      fps,
      config: { damping: 200 },
      durationInFrames: 30,
    }),
    [0, 1],
    [-15, 0],
  );

  const isActive = state === 'active';

  const pulseScale = isActive
    ? interpolate(Math.sin(localFrame * 0.1), [-1, 1], [0.97, 1.03])
    : 1;

  return (
    <div
      style={{
        width: 64,
        height: 64,
        borderRadius: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `scale(${iconScale * pulseScale}) rotate(${rotation}deg)`,
        position: 'relative',
      }}
    >
      {/* Glow background */}
      {isActive && (
        <div
          style={{
            position: 'absolute',
            inset: -8,
            borderRadius: 24,
            backgroundColor: 'rgba(105, 173, 255, 0.12)',
            filter: 'blur(8px)',
          }}
        />
      )}
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 16,
          backgroundColor: 'rgba(105, 173, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {children}
      </div>
    </div>
  );
};

type ParticleFieldProps = {
  count: number;
  color: string;
};

export const ParticleField: React.FC<ParticleFieldProps> = ({ count, color }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      angle: (i / count) * Math.PI * 2,
      speed: 0.8 + (i % 3) * 0.4,
      size: 2 + (i % 3),
      delay: i * 3,
    }));
  }, [count]);

  const entrance = spring({
    frame,
    fps,
    config: { damping: 200 },
    durationInFrames: 20,
  });

  return (
    <>
      {particles.map((p, i) => {
        const localFrame = Math.max(0, frame - p.delay);
        const radius = 40 + Math.sin(localFrame * 0.06 * p.speed) * 15;
        const angle = p.angle + localFrame * 0.015 * p.speed;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        const particleOpacity = interpolate(
          Math.sin(localFrame * 0.08 + i),
          [-1, 1],
          [0.15, 0.6],
        ) * entrance;

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              backgroundColor: color,
              left: `calc(50% + ${x}px)`,
              top: `calc(50% + ${y}px)`,
              opacity: particleOpacity,
              transform: 'translate(-50%, -50%)',
            }}
          />
        );
      })}
    </>
  );
};
