import { Composition } from 'remotion';
import { ReportLoadingAnimation } from './ReportLoadingAnimation';
import { ImportClassificationAnimation } from './ImportClassificationAnimation';
import { BudgetOverviewAnimation } from './BudgetOverviewAnimation';
import { BudgetCelebrationAnimation } from './BudgetCelebrationAnimation';
import { BudgetLoadingAnimation } from './BudgetLoadingAnimation';

// Remotion Composition requires LooseComponentType<Record<string, unknown>>
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BudgetOverview = BudgetOverviewAnimation as React.FC<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BudgetCelebration = BudgetCelebrationAnimation as React.FC<any>;

export const ANIMATION_FPS = 30;
export const ANIMATION_DURATION_FRAMES = 300; // 10 seconds
export const ANIMATION_WIDTH = 400;
export const ANIMATION_HEIGHT = 500;

const BUDGET_OVERVIEW_FRAMES = 240; // 8 seconds
const BUDGET_CELEBRATION_FRAMES = 120; // 4 seconds

const defaultBudgetOverviewProps = {
  overallPercentage: 68,
  totalBudget: 12000,
  totalSpent: 8160,
  totalRemaining: 3840,
  categories: [
    { nameHe: 'מזון', color: '#0DBACC', percentage: 85, spent: 1700, budget: 2000 },
    { nameHe: 'דיור', color: '#69ADFF', percentage: 60, spent: 3000, budget: 5000 },
    { nameHe: 'תחבורה', color: '#E9A800', percentage: 45, spent: 450, budget: 1000 },
  ],
};

const defaultBudgetCelebrationProps = {
  savedAmount: 3840,
  monthName: 'מרץ 2026',
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ReportLoadingAnimation"
        component={ReportLoadingAnimation}
        durationInFrames={ANIMATION_DURATION_FRAMES}
        fps={ANIMATION_FPS}
        width={ANIMATION_WIDTH}
        height={ANIMATION_HEIGHT}
      />
      <Composition
        id="ImportClassificationAnimation"
        component={ImportClassificationAnimation}
        durationInFrames={ANIMATION_DURATION_FRAMES}
        fps={ANIMATION_FPS}
        width={ANIMATION_WIDTH}
        height={ANIMATION_HEIGHT}
      />
      <Composition
        id="BudgetOverviewAnimation"
        component={BudgetOverview}
        durationInFrames={BUDGET_OVERVIEW_FRAMES}
        fps={ANIMATION_FPS}
        width={ANIMATION_WIDTH}
        height={ANIMATION_HEIGHT}
        defaultProps={defaultBudgetOverviewProps}
      />
      <Composition
        id="BudgetCelebrationAnimation"
        component={BudgetCelebration}
        durationInFrames={BUDGET_CELEBRATION_FRAMES}
        fps={ANIMATION_FPS}
        width={ANIMATION_WIDTH}
        height={ANIMATION_HEIGHT}
        defaultProps={defaultBudgetCelebrationProps}
      />
      <Composition
        id="BudgetLoadingAnimation"
        component={BudgetLoadingAnimation}
        durationInFrames={ANIMATION_DURATION_FRAMES}
        fps={ANIMATION_FPS}
        width={ANIMATION_WIDTH}
        height={ANIMATION_HEIGHT}
      />
    </>
  );
};
