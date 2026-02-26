'use client';

import React, { useEffect, useRef } from 'react';
import { Player, type PlayerRef } from '@remotion/player';
import { ImportClassificationAnimation } from '@/remotion/ImportClassificationAnimation';
import {
  ANIMATION_FPS,
  ANIMATION_DURATION_FRAMES,
} from '@/remotion/Root';

type ImportClassificationPlayerProps = {
  onAnimationEnd: () => void;
};

export default function ImportClassificationPlayer({
  onAnimationEnd,
}: ImportClassificationPlayerProps) {
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
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 24,
        overflow: 'hidden',
      }}
    >
      <Player
        ref={playerRef}
        component={ImportClassificationAnimation}
        durationInFrames={ANIMATION_DURATION_FRAMES}
        compositionWidth={400}
        compositionHeight={500}
        fps={ANIMATION_FPS}
        autoPlay
        style={{
          width: '100%',
          height: '100%',
        }}
        controls={false}
        showVolumeControls={false}
        clickToPlay={false}
      />
    </div>
  );
}
