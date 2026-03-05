import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from 'remotion';

interface BarData {
  nameHe: string;
  color: string;
  percentage: number;
  spent: number;
  budget: number;
}

interface AnimatedBarChartProps {
  data: BarData[];
  startFrame?: number;
  maxBars?: number;
}

const STAGGER_DELAY = 8;

function formatShortCurrency(amount: number): string {
  if (amount >= 1000) {
    return `₪${(amount / 1000).toFixed(1)}K`;
  }
  return `₪${Math.round(amount)}`;
}

export const AnimatedBarChart: React.FC<AnimatedBarChartProps> = ({
  data,
  startFrame = 60,
  maxBars = 6,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const visibleData = data.slice(0, maxBars);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        width: '100%',
        direction: 'rtl',
      }}
    >
      {visibleData.map((item, i) => {
        const localFrame = Math.max(0, frame - startFrame);
        const barProgress = spring({
          frame: localFrame,
          fps,
          delay: i * STAGGER_DELAY,
          config: { damping: 200 },
        });

        const slideX = interpolate(barProgress, [0, 1], [40, 0]);
        const opacity = interpolate(barProgress, [0, 1], [0, 1]);
        const barWidth = Math.min(item.percentage, 100) * barProgress;

        const barColor = item.percentage > 100 ? '#F18AB5' : item.percentage > 75 ? '#E9A800' : item.color;

        return (
          <div
            key={item.nameHe}
            style={{
              opacity,
              transform: `translateX(${slideX}px)`,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 3,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#303150',
                  fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                }}
              >
                {item.nameHe}
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  color: '#7E7F90',
                  fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                }}
                dir="ltr"
              >
                {formatShortCurrency(item.spent)} / {formatShortCurrency(item.budget)}
              </span>
            </div>
            <div
              style={{
                width: '100%',
                height: 6,
                borderRadius: 3,
                backgroundColor: '#E8E8ED',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  borderRadius: 3,
                  width: `${barWidth}%`,
                  backgroundColor: barColor,
                  boxShadow: `0 0 6px ${barColor}40`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
