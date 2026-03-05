'use client';

import React, { useEffect, useRef } from 'react';
import { Player, type PlayerRef } from '@remotion/player';
import { BudgetLoadingAnimation } from '@/remotion/BudgetLoadingAnimation';
import { ANIMATION_FPS, ANIMATION_DURATION_FRAMES } from '@/remotion/Root';

interface BudgetLoadingPlayerProps {
  onAnimationEnd?: () => void;
}

export default function BudgetLoadingPlayer({
  onAnimationEnd,
}: BudgetLoadingPlayerProps) {
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
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 400,
      }}
    >
      <Player
        ref={playerRef}
        component={BudgetLoadingAnimation}
        durationInFrames={ANIMATION_DURATION_FRAMES}
        compositionWidth={400}
        compositionHeight={500}
        fps={ANIMATION_FPS}
        autoPlay
        loop
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
