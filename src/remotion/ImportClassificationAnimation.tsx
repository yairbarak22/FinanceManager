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

export const IMPORT_ANIMATION_FPS = 30;
export const IMPORT_ANIMATION_DURATION_FRAMES = 300; // 10 seconds

const STEPS = [
  { label: 'קורא את הקובץ...' },
  { label: 'מנתח עסקאות...' },
  { label: 'מסווג עם AI...' },
  { label: 'מכין לסקירה...' },
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

const SmallFileSearch = (color: string) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <circle cx="11.5" cy="14.5" r="2.5" />
    <path d="M13.3 16.3 15 18" />
  </svg>
);

const SmallBarChart = (color: string) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18" />
    <path d="M18 17V9" />
    <path d="M13 17V5" />
    <path d="M8 17v-3" />
  </svg>
);

const SmallBrain = (color: string) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
    <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
    <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
    <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
    <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
    <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
    <path d="M19.938 10.5a4 4 0 0 1 .585.396" />
    <path d="M6 18a4 4 0 0 1-1.967-.516" />
    <path d="M19.967 17.484A4 4 0 0 1 18 18" />
  </svg>
);

const SmallCheckList = (color: string) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 18H3" />
    <path d="M11 12H3" />
    <path d="M11 6H3" />
    <path d="m15 18 2 2 4-4" />
    <path d="m15 12 2 2 4-4" />
    <path d="m15 6 2 2 4-4" />
  </svg>
);

const STEP_ICON_RENDERERS = [SmallFileSearch, SmallBarChart, SmallBrain, SmallCheckList];

const CompletionSparkles: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const completionStart = IMPORT_ANIMATION_DURATION_FRAMES - 45;
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
    const color = i % 3 === 0 ? '#0DBACC' : i % 3 === 1 ? '#69ADFF' : '#9F7FE0';

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

export const ImportClassificationAnimation: React.FC = () => {
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

  const particleColor = currentStep >= 2 ? '#9F7FE0' : '#69ADFF';

  const isCompleting = frame >= IMPORT_ANIMATION_DURATION_FRAMES - 45;

  const completionBgOpacity = isCompleting
    ? interpolate(frame, [IMPORT_ANIMATION_DURATION_FRAMES - 45, IMPORT_ANIMATION_DURATION_FRAMES - 15], [0, 0.05], {
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
            background: 'radial-gradient(circle at 50% 40%, rgba(159,127,224,0.15), transparent 70%)',
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
          מסווג עסקאות עם AI
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
                width: `${interpolate(frame, [0, IMPORT_ANIMATION_DURATION_FRAMES - 15], [0, 100], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                  easing: Easing.inOut(Easing.quad),
                })}%`,
                background: 'linear-gradient(90deg, #69ADFF, #9F7FE0, #0DBACC)',
              }}
            />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
