import { Composition } from 'remotion';
import { ReportLoadingAnimation } from './ReportLoadingAnimation';

export const ANIMATION_FPS = 30;
export const ANIMATION_DURATION_FRAMES = 300; // 10 seconds
export const ANIMATION_WIDTH = 400;
export const ANIMATION_HEIGHT = 500;

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="ReportLoadingAnimation"
      component={ReportLoadingAnimation}
      durationInFrames={ANIMATION_DURATION_FRAMES}
      fps={ANIMATION_FPS}
      width={ANIMATION_WIDTH}
      height={ANIMATION_HEIGHT}
    />
  );
};
