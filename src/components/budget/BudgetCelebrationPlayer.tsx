'use client';

import React, { useEffect, useRef } from 'react';
import { Player, type PlayerRef } from '@remotion/player';
import { BudgetCelebrationAnimation, type BudgetCelebrationProps } from '@/remotion/BudgetCelebrationAnimation';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CelebrationComponent = BudgetCelebrationAnimation as React.FC<any>;
import { ANIMATION_FPS } from '@/remotion/Root';

const CELEBRATION_DURATION = 120;

interface BudgetCelebrationPlayerProps {
  data: BudgetCelebrationProps;
  onAnimationEnd: () => void;
}

export default function BudgetCelebrationPlayer({
  data,
  onAnimationEnd,
}: BudgetCelebrationPlayerProps) {
  const playerRef = useRef<PlayerRef>(null);
  const endedRef = useRef(false);

  useEffect(() => {
    endedRef.current = false;
  }, []);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

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
      className="fixed inset-0 z-[9999] flex items-center justify-center cursor-pointer"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onAnimationEnd}
    >
      <div className="rounded-3xl overflow-hidden">
        <Player
          ref={playerRef}
          component={CelebrationComponent}
          inputProps={data}
          durationInFrames={CELEBRATION_DURATION}
          compositionWidth={400}
          compositionHeight={500}
          fps={ANIMATION_FPS}
          autoPlay
          numberOfSharedAudioTags={0}
          style={{
            width: 400,
            height: 500,
            maxWidth: '90vw',
          }}
          controls={false}
          showVolumeControls={false}
          clickToPlay={false}
        />
      </div>
    </div>
  );
}
