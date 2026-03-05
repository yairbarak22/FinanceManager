import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';

interface NumberCounterProps {
  targetValue: number;
  startFrame: number;
  durationFrames?: number;
  color?: string;
  fontSize?: number;
  prefix?: string;
}

export const NumberCounter: React.FC<NumberCounterProps> = ({
  targetValue,
  startFrame,
  durationFrames = 40,
  color = '#303150',
  fontSize = 20,
  prefix = '₪',
}) => {
  const frame = useCurrentFrame();
  const localFrame = Math.max(0, frame - startFrame);

  const progress = interpolate(localFrame, [0, durationFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });

  const currentValue = Math.round(targetValue * progress);
  const formattedValue = new Intl.NumberFormat('he-IL').format(currentValue);

  const opacity = interpolate(localFrame, [0, 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <span
      style={{
        fontSize,
        fontWeight: 700,
        color,
        fontFamily: 'var(--font-nunito), system-ui, sans-serif',
        opacity,
        letterSpacing: '-0.01em',
      }}
      dir="ltr"
    >
      {prefix}{formattedValue}
    </span>
  );
};
