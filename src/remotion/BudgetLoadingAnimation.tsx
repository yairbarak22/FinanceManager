import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Easing,
} from 'remotion';
import { ProgressRing } from './components/ProgressRing';
import { LoadingStep, ParticleField } from './components/LoadingStep';
import { ANIMATION_DURATION_FRAMES } from './Root';

const STEPS = [
  { label: 'טוען נתוני תקציב...' },
  { label: 'מחשב הוצאות...' },
  { label: 'משווה לתקציב...' },
  { label: 'מכין תצוגה...' },
];

const STEP_FRAMES = 75;

function getStepState(
  stepIndex: number,
  frame: number,
): 'upcoming' | 'active' | 'completed' {
  const stepStart = stepIndex * STEP_FRAMES;
  const stepEnd = stepStart + STEP_FRAMES;
  if (frame < stepStart) return 'upcoming';
  if (frame >= stepEnd) return 'completed';
  return 'active';
}

function getCurrentStepIndex(frame: number): number {
  return Math.min(Math.floor(frame / STEP_FRAMES), STEPS.length - 1);
}

const SmallWallet = (color: string) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
  </svg>
);

const SmallCalculator = (color: string) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="16" height="20" x="4" y="2" rx="2" />
    <line x1="8" x2="16" y1="6" y2="6" />
    <line x1="16" x2="16" y1="14" y2="18" />
    <path d="M16 10h.01" />
    <path d="M12 10h.01" />
    <path d="M8 10h.01" />
    <path d="M12 14h.01" />
    <path d="M8 14h.01" />
    <path d="M12 18h.01" />
    <path d="M8 18h.01" />
  </svg>
);

const SmallScale = (color: string) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
    <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
    <path d="M7 21h10" />
    <path d="M12 3v18" />
    <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
  </svg>
);

const SmallLayout = (color: string) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
    <line x1="3" x2="21" y1="9" y2="9" />
    <line x1="9" x2="9" y1="21" y2="9" />
  </svg>
);

const STEP_ICON_RENDERERS = [SmallWallet, SmallCalculator, SmallScale, SmallLayout];

const CompletionSparkles: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const completionStart = ANIMATION_DURATION_FRAMES - 45;
  const localFrame = Math.max(0, frame - completionStart);

  if (frame < completionStart) return null;

  const sparkles = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * Math.PI * 2;
    const distance = spring({
      frame: localFrame,
      fps,
      delay: i * 2,
      config: { damping: 15, stiffness: 80 },
    }) * 60;

    const fadeOut = interpolate(localFrame, [15, 40], [1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });

    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    const size = 3 + (i % 3) * 2;
    const color = i % 3 === 0 ? '#0DBACC' : i % 3 === 1 ? '#69ADFF' : '#E9A800';

    return (
      <div
        key={i}
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: '50%',
          backgroundColor: color,
          left: `calc(50% + ${x}px)`,
          top: `calc(50% + ${y}px)`,
          transform: 'translate(-50%, -50%)',
          opacity: fadeOut,
        }}
      />
    );
  });

  return <>{sparkles}</>;
};

export const BudgetLoadingAnimation: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentStep = getCurrentStepIndex(frame);

  const bgEntrance = spring({
    frame,
    fps,
    config: { damping: 200 },
    durationInFrames: 15,
  });

  const titleEntrance = spring({
    frame,
    fps,
    delay: 5,
    config: { damping: 200 },
    durationInFrames: 20,
  });
  const titleY = interpolate(titleEntrance, [0, 1], [15, 0]);

  const particleColor = currentStep >= 2 ? '#0DBACC' : '#69ADFF';

  const isCompleting = frame >= ANIMATION_DURATION_FRAMES - 45;
  const completionBgOpacity = isCompleting
    ? interpolate(frame, [ANIMATION_DURATION_FRAMES - 45, ANIMATION_DURATION_FRAMES - 15], [0, 0.05], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 0;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: `rgba(255, 255, 255, ${0.97 * bgEntrance})`,
        backdropFilter: `blur(${8 * bgEntrance}px)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-nunito), system-ui, sans-serif',
        direction: 'rtl',
      }}
    >
      {completionBgOpacity > 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 50% 40%, rgba(13,186,204,0.15), transparent 70%)',
            opacity: completionBgOpacity * 20,
          }}
        />
      )}

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 28,
          width: '100%',
          maxWidth: 320,
          padding: '0 24px',
        }}
      >
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: '#303150',
            opacity: titleEntrance,
            transform: `translateY(${titleY}px)`,
            letterSpacing: '-0.01em',
          }}
        >
          טוען את התקציב שלך
        </div>

        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 140,
            height: 140,
          }}
        >
          <ProgressRing />
          <ParticleField count={8} color={particleColor} />
          <CompletionSparkles />
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            width: '100%',
          }}
        >
          {STEPS.map((step, i) => (
            <LoadingStep
              key={i}
              index={i}
              label={step.label}
              state={getStepState(i, frame)}
              stepStartFrame={i * STEP_FRAMES}
              iconRenderer={STEP_ICON_RENDERERS[i]}
            />
          ))}
        </div>

        <div style={{ width: '100%' }}>
          <div
            style={{
              width: '100%',
              height: 4,
              borderRadius: 2,
              backgroundColor: '#E8E8ED',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                borderRadius: 2,
                width: `${interpolate(frame, [0, ANIMATION_DURATION_FRAMES - 15], [0, 100], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                  easing: Easing.inOut(Easing.quad),
                })}%`,
                background: 'linear-gradient(90deg, #69ADFF, #0DBACC)',
              }}
            />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
