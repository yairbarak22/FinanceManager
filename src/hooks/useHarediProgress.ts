'use client';

import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { Camera, Target, TrendingUp, LucideIcon } from 'lucide-react';
import { useRecurringTransactions } from './useRecurring';
import { useGoals } from './useGoals';
import { useAssets } from './useAssets';
import { useLiabilities } from './useLiabilities';
import { useHoldings } from './useHoldings';

// ============================================
// Types
// ============================================

export type StepStatus = 'completed' | 'current' | 'pending' | 'locked';

export interface ProgressStep {
  id: number;
  title: string;
  description: string;
  shortDescription: string;
  status: StepStatus;
  route: string;
  icon: LucideIcon;
  timeEstimate: string;
}

export interface HarediProgress {
  steps: ProgressStep[];
  currentStep: ProgressStep | null;
  progressPercentage: number;
  completedStepsCount: number;
  totalStepsCount: number;
  isLoading: boolean;
  justCompletedStep: ProgressStep | null;
  clearCelebration: () => void;
}

// ============================================
// Constants
// ============================================

const CACHE_KEY = 'haredi-progress-cache';
const TOTAL_STEPS = 3;

interface CachedProgress {
  completedSteps: boolean[];
  timestamp: number;
}

// ============================================
// Step definitions (static)
// ============================================

const STEP_DEFINITIONS = [
  {
    id: 1,
    title: 'תמונת מצב פיננסית',
    description: 'מיפוי מלא של הכנסות, הוצאות, נכסים והלוואות — כדי להבין כמה כסף נשאר בצד כל חודש שאפשר להשקיע',
    shortDescription: 'מיפוי הכנסות והוצאות',
    route: '/dashboard',
    icon: Camera,
    timeEstimate: '5 דקות',
  },
  {
    id: 2,
    title: 'הגדרת יעדים לילדים',
    description: 'הגדרת יעדי חיסכון לחתונות, דירות או כל מטרה אחרת — כדי להבין כמה צריך לחסוך כל חודש כדי להגיע ליעדים',
    shortDescription: 'הגדרת יעד ראשון',
    route: '/goals',
    icon: Target,
    timeEstimate: '3 דקות',
  },
  {
    id: 3,
    title: 'פתיחת תיק השקעות עצמאי',
    description: 'פתיחת תיק מסחר עצמאי כשר כדי שהכסף יעשה עוד כסף ויצמח — במקום להישחק באינפלציה',
    shortDescription: 'הוספת מניות לתיק',
    route: '/investments/guide',
    icon: TrendingUp,
    timeEstimate: '5 דקות',
  },
] as const;

// ============================================
// Hook
// ============================================

export function useHarediProgress(): HarediProgress {
  const { data: recurring, isLoading: recurringLoading } = useRecurringTransactions();
  const { data: goals, isLoading: goalsLoading } = useGoals();
  const { data: assets, isLoading: assetsLoading } = useAssets();
  const { data: liabilities, isLoading: liabilitiesLoading } = useLiabilities();
  const { data: holdings, isLoading: holdingsLoading } = useHoldings();

  const [justCompletedStep, setJustCompletedStep] = useState<ProgressStep | null>(null);
  const previousCompletedCountRef = useRef<number | null>(null);
  const isInitialLoadRef = useRef(true);

  // ---- Read cached progress for instant render ----
  const cachedProgress = useMemo<CachedProgress | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as CachedProgress;
      // Expire cache after 5 minutes
      if (Date.now() - parsed.timestamp > 5 * 60 * 1000) return null;
      return parsed;
    } catch {
      return null;
    }
  }, []);

  // ---- Compute completion booleans ----
  const isLoading = recurringLoading || goalsLoading || assetsLoading || liabilitiesLoading || holdingsLoading;

  const completedFlags = useMemo(() => {
    if (isLoading && !cachedProgress) {
      return [false, false, false];
    }

    if (isLoading && cachedProgress) {
      return cachedProgress.completedSteps;
    }

    // Step 1: has at least 1 asset AND at least 1 liability AND at least 1 expense or income
    const hasAssets = (assets ?? []).length > 0;
    const hasLiabilities = (liabilities ?? []).length > 0;
    const hasExpenseOrIncome = (recurring ?? []).some(
      (r: { type: string; isActive?: boolean }) =>
        (r.type === 'expense' || r.type === 'income') && r.isActive !== false
    );
    const step1Completed = hasAssets && hasLiabilities && hasExpenseOrIncome;

    // Step 2: has at least 1 financial goal
    const hasGoals = (goals ?? []).length > 0;

    // Step 3: has at least 1 holding in the portfolio
    const hasHoldings = (holdings ?? []).length > 0;

    return [step1Completed, hasGoals, hasHoldings];
  }, [isLoading, recurring, goals, assets, liabilities, holdings, cachedProgress]);

  // ---- Cache progress in localStorage ----
  useEffect(() => {
    if (!isLoading && typeof window !== 'undefined') {
      const cache: CachedProgress = {
        completedSteps: completedFlags,
        timestamp: Date.now(),
      };
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      } catch {
        // silently ignore
      }
    }
  }, [isLoading, completedFlags]);

  // ---- Build steps with statuses ----
  const steps: ProgressStep[] = useMemo(() => {
    return STEP_DEFINITIONS.map((def, index) => {
      let status: StepStatus;

      if (completedFlags[index]) {
        status = 'completed';
      } else if (index === 0) {
        // First step is always current if not completed
        status = 'current';
      } else if (completedFlags[index - 1]) {
        // Previous step is completed -> this step is current
        status = 'current';
      } else {
        status = 'locked';
      }

      return {
        ...def,
        status,
      };
    });
  }, [completedFlags]);

  const completedStepsCount = completedFlags.filter(Boolean).length;
  const progressPercentage = Math.round((completedStepsCount / TOTAL_STEPS) * 100);

  const currentStep = useMemo(() => {
    return steps.find((s) => s.status === 'current') ?? null;
  }, [steps]);

  // ---- Detect newly completed steps ----
  useEffect(() => {
    if (isLoading) return;

    if (isInitialLoadRef.current) {
      // On first load, just set the baseline
      previousCompletedCountRef.current = completedStepsCount;
      isInitialLoadRef.current = false;
      return;
    }

    const prevCount = previousCompletedCountRef.current;
    if (prevCount !== null && completedStepsCount > prevCount) {
      // Find the most recently completed step
      const newlyCompleted = steps.find(
        (s, i) => s.status === 'completed' && !cachedProgress?.completedSteps[i]
      );
      if (newlyCompleted) {
        setJustCompletedStep(newlyCompleted);
      }
    }

    previousCompletedCountRef.current = completedStepsCount;
  }, [isLoading, completedStepsCount, steps, cachedProgress]);

  const clearCelebration = useCallback(() => {
    setJustCompletedStep(null);
  }, []);

  return {
    steps,
    currentStep,
    progressPercentage,
    completedStepsCount,
    totalStepsCount: TOTAL_STEPS,
    isLoading,
    justCompletedStep,
    clearCelebration,
  };
}
