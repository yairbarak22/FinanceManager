import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Easing,
} from 'remotion';
import { evolvePath } from '@remotion/paths';
import { NumberCounter } from './components/NumberCounter';

export interface BudgetCelebrationProps {
  savedAmount: number;
  monthName: string;
}

const CONFETTI_COLORS = ['#0DBACC', '#69ADFF', '#F18AB5', '#E9A800'];
const CHECKMARK_PATH = 'M 12 24 L 22 34 L 38 14';

export const BudgetCelebrationAnimation: React.FC<BudgetCelebrationProps> = ({
  savedAmount,
  monthName,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Scene entrance
  const bgEntrance = spring({
    frame,
    fps,
    config: { damping: 200 },
    durationInFrames: 15,
  });

  // Checkmark circle
  const circleScale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 150 },
  });

  // Checkmark path draw
  const checkProgress = interpolate(frame, [10, 35], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });
  const { strokeDasharray, strokeDashoffset } = evolvePath(checkProgress, CHECKMARK_PATH);

  // Text entrances
  const titleEntrance = spring({
    frame,
    fps,
    delay: 15,
    config: { damping: 200 },
    durationInFrames: 20,
  });
  const titleY = interpolate(titleEntrance, [0, 1], [15, 0]);

  const subtitleEntrance = spring({
    frame,
    fps,
    delay: 25,
    config: { damping: 200 },
    durationInFrames: 20,
  });
  const subtitleY = interpolate(subtitleEntrance, [0, 1], [12, 0]);

  // Savings entrance
  const savingsEntrance = spring({
    frame,
    fps,
    delay: 60,
    config: { damping: 200 },
    durationInFrames: 20,
  });
  const savingsY = interpolate(savingsEntrance, [0, 1], [15, 0]);

  // Exit animation
  const exitProgress = spring({
    frame,
    fps,
    delay: durationInFrames - 25,
    config: { damping: 200 },
    durationInFrames: 20,
  });
  const exitScale = interpolate(exitProgress, [0, 1], [1, 0.9]);
  const exitOpacity = interpolate(exitProgress, [0, 1], [1, 0]);

  // Confetti particles
  const confetti = Array.from({ length: 24 }, (_, i) => {
    const angle = (i / 24) * Math.PI * 2;
    const localFrame = Math.max(0, frame - 20);

    const distance = spring({
      frame: localFrame,
      fps,
      delay: i * 1.5,
      config: { damping: 15, stiffness: 80 },
    }) * 80;

    const fadeOut = interpolate(localFrame, [30, 70], [1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });

    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance - localFrame * 0.3;
    const size = 4 + (i % 4) * 2;
    const rotation = localFrame * (3 + i % 5);
    const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    const isRect = i % 3 === 0;

    return (
      <div
        key={i}
        style={{
          position: 'absolute',
          width: isRect ? size * 1.5 : size,
          height: size,
          borderRadius: isRect ? 2 : '50%',
          backgroundColor: color,
          left: `calc(50% + ${x}px)`,
          top: `calc(40% + ${y}px)`,
          transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
          opacity: fadeOut,
        }}
      />
    );
  });

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
        transform: `scale(${exitScale})`,
        opacity: exitOpacity,
      }}
    >
      {confetti}

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
        }}
      >
        {/* Checkmark circle */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            backgroundColor: '#0DBACC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `scale(${circleScale})`,
            boxShadow: '0 4px 24px rgba(13, 186, 204, 0.35)',
          }}
        >
          <svg width="50" height="50" viewBox="0 0 50 50" fill="none">
            <path
              d={CHECKMARK_PATH}
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
            />
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: '#303150',
            opacity: titleEntrance,
            transform: `translateY(${titleY}px)`,
          }}
        >
          כל הכבוד!
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 14,
            fontWeight: 400,
            color: '#7E7F90',
            opacity: subtitleEntrance,
            transform: `translateY(${subtitleY}px)`,
            textAlign: 'center',
            maxWidth: 260,
          }}
        >
          סיימת את {monthName} בתוך התקציב
        </div>

        {/* Savings amount */}
        <div
          style={{
            opacity: savingsEntrance,
            transform: `translateY(${savingsY}px)`,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: '#7E7F90',
              marginBottom: 4,
            }}
          >
            חסכת
          </div>
          <NumberCounter
            targetValue={savedAmount}
            startFrame={60}
            durationFrames={35}
            fontSize={28}
            color="#0DBACC"
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
