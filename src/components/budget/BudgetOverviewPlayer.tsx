'use client';

import React, { useEffect, useRef } from 'react';
import { Player, type PlayerRef } from '@remotion/player';
import { BudgetOverviewAnimation, type BudgetOverviewProps } from '@/remotion/BudgetOverviewAnimation';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const OverviewComponent = BudgetOverviewAnimation as React.FC<any>;
import { ANIMATION_FPS } from '@/remotion/Root';

const OVERVIEW_DURATION = 240;

interface BudgetOverviewPlayerProps {
  data: BudgetOverviewProps;
  onAnimationEnd?: () => void;
}

export default function BudgetOverviewPlayer({
  data,
  onAnimationEnd,
}: BudgetOverviewPlayerProps) {
  const playerRef = useRef<PlayerRef>(null);
  const endedRef = useRef(false);

  useEffect(() => {
    endedRef.current = false;
  }, []);

  useEffect(() => {
    const player = playerRef.current;
    if (!player || !onAnimationEnd) return;

    const onEnded = () => {
      if (endedRef.current) return;
      endedRef.current = true;
      onAnimationEnd();
    };

    player.addEventListener('ended', onEnded);
    return () => {
      player.removeEventListener('ended', onEnded);
    };
  }, [onAnimationEnd]);

  return (
    <div
      className="rounded-3xl overflow-hidden"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
      }}
    >
      <Player
        ref={playerRef}
          component={OverviewComponent}
        inputProps={data}
        durationInFrames={OVERVIEW_DURATION}
        compositionWidth={400}
        compositionHeight={500}
        fps={ANIMATION_FPS}
        autoPlay
        numberOfSharedAudioTags={0}
        style={{
          width: 400,
          height: 500,
          maxWidth: '100%',
        }}
        controls={false}
        showVolumeControls={false}
        clickToPlay={false}
      />
    </div>
  );
}
