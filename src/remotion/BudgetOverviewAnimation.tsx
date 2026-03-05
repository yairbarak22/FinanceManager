import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from 'remotion';
import { BudgetRing } from './components/BudgetRing';
import { AnimatedBarChart } from './components/AnimatedBarChart';
import { NumberCounter } from './components/NumberCounter';
import { ParticleField } from './components/LoadingStep';

export interface BudgetOverviewProps {
  overallPercentage: number;
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  categories: Array<{
    nameHe: string;
    color: string;
    percentage: number;
    spent: number;
    budget: number;
  }>;
}

const CompletionSparkles: React.FC<{ startFrame: number }> = ({ startFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = Math.max(0, frame - startFrame);

  if (frame < startFrame) return null;

  const sparkles = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * Math.PI * 2;
    const distance = spring({
      frame: localFrame,
      fps,
      delay: i * 2,
      config: { damping: 15, stiffness: 80 },
    }) * 50;

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

export const BudgetOverviewAnimation: React.FC<BudgetOverviewProps> = ({
  overallPercentage,
  totalBudget,
  totalSpent,
  totalRemaining,
  categories,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

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
  const titleY = interpolate(titleEntrance, [0, 1], [12, 0]);

  const isHealthy = overallPercentage <= 75;
  const particleColor = isHealthy ? '#0DBACC' : overallPercentage <= 100 ? '#E9A800' : '#F18AB5';

  const countersEntrance = spring({
    frame,
    fps,
    delay: 140,
    config: { damping: 200 },
    durationInFrames: 20,
  });
  const countersY = interpolate(countersEntrance, [0, 1], [15, 0]);

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
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
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
          סקירת תקציב
        </div>

        {/* Ring */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 150,
            height: 150,
          }}
        >
          <BudgetRing targetPercentage={overallPercentage} />
          <ParticleField count={6} color={particleColor} />
          {isHealthy && <CompletionSparkles startFrame={190} />}
        </div>

        {/* Bar chart */}
        <AnimatedBarChart
          data={categories}
          startFrame={60}
          maxBars={5}
        />

        {/* Summary counters */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            width: '100%',
            opacity: countersEntrance,
            transform: `translateY(${countersY}px)`,
            gap: 8,
          }}
        >
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 500, color: '#7E7F90', marginBottom: 2 }}>
              תקציב
            </div>
            <NumberCounter
              targetValue={totalBudget}
              startFrame={140}
              fontSize={15}
              color="#69ADFF"
            />
          </div>
          <div style={{ width: 1, backgroundColor: '#F7F7F8' }} />
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 500, color: '#7E7F90', marginBottom: 2 }}>
              הוצאות
            </div>
            <NumberCounter
              targetValue={totalSpent}
              startFrame={148}
              fontSize={15}
              color="#F18AB5"
            />
          </div>
          <div style={{ width: 1, backgroundColor: '#F7F7F8' }} />
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 500, color: '#7E7F90', marginBottom: 2 }}>
              יתרה
            </div>
            <NumberCounter
              targetValue={Math.abs(totalRemaining)}
              startFrame={156}
              fontSize={15}
              color={totalRemaining >= 0 ? '#0DBACC' : '#F18AB5'}
              prefix={totalRemaining >= 0 ? '₪' : '-₪'}
            />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
