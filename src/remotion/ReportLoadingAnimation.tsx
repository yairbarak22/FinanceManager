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
  { label: 'מנתח נתונים תקופתיים' },
  { label: 'משווה לתקופות עבר' },
  { label: 'מנתח מסקנות' },
  { label: 'מפיק דוח' },
];

const STEP_FRAMES = 75; // 2.5 seconds per step
const TRANSITION_FRAMES = 15; // 0.5 seconds transition

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

// Small SVG icons for inline display next to each step
const SmallBarChart3 = (color: string) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18" />
    <path d="M18 17V9" />
    <path d="M13 17V5" />
    <path d="M8 17v-3" />
  </svg>
);

const SmallCompare = (color: string) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="5" cy="18" r="3" />
    <circle cx="19" cy="18" r="3" />
    <circle cx="12" cy="6" r="3" />
    <path d="M7.5 16.5 12 9" />
    <path d="M16.5 16.5 12 9" />
  </svg>
);

const SmallLightbulb = (color: string) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
    <path d="M9 18h6" />
    <path d="M10 22h4" />
  </svg>
);

const SmallFileOutput = (color: string) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <path d="M12 18v-6" />
    <path d="m9 15 3 3 3-3" />
  </svg>
);

const STEP_ICON_RENDERERS = [SmallBarChart3, SmallCompare, SmallLightbulb, SmallFileOutput];

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
    const color = i % 3 === 0 ? '#0DBACC' : i % 3 === 1 ? '#69ADFF' : '#FFD700';

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

export const ReportLoadingAnimation: React.FC = () => {
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
      {/* Completion gradient overlay */}
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
        {/* Title */}
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
          מכין את הדוח שלך
        </div>

        {/* Center icon area with ring */}
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

          {/* Particles */}
          <ParticleField count={8} color={particleColor} />

          {/* Completion sparkles */}
          <CompletionSparkles />
        </div>

        {/* Steps list */}
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

        {/* Bottom progress bar */}
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
                background: `linear-gradient(90deg, #69ADFF, #0DBACC)`,
              }}
            />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
