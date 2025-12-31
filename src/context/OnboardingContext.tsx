'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

/**
 * Onboarding Tour Steps
 */
export type OnboardingTourStep =
  | 'idle'
  | 'welcome'
  | 'profile'
  | 'net-worth-card'
  | 'cash-flow-card'
  | 'add-transaction'
  | 'add-asset'
  | 'complete';

/**
 * Cursor target coordinates
 */
interface CursorTarget {
  x: number;
  y: number;
}

/**
 * Wizard data collected from user inputs
 */
export type WizardData = Record<string, string>;

/**
 * Onboarding Context State
 */
interface OnboardingState {
  // Tour State
  /** Whether the tour is currently active */
  isTourActive: boolean;
  /** Current step in the tour */
  currentTourStep: OnboardingTourStep;
  /** Target coordinates for the ghost cursor */
  cursorTarget: CursorTarget | null;
  /** Label to display on the cursor tooltip */
  cursorLabel: string;
  /** Whether cursor is currently "clicking" */
  isCursorClicking: boolean;
  /** Whether autopilot has opened a modal (for backdrop blur) */
  isAutopilotInModal: boolean;

  // Wizard State
  /** Whether the wizard modal is open */
  isWizardOpen: boolean;
  /** Current step index in the wizard (0-4) */
  currentStepIndex: number;
  /** Data collected from wizard inputs */
  wizardData: WizardData;
}

/**
 * Onboarding Context Actions
 */
interface OnboardingActions {
  // Tour Actions
  /** Start the onboarding tour */
  startTour: () => void;
  /** End the onboarding tour */
  endTour: () => void;
  /** Go to a specific tour step */
  goToTourStep: (step: OnboardingTourStep) => void;
  /** Move cursor to target element by ID */
  moveCursorToElement: (elementId: string, label?: string) => void;
  /** Move cursor to specific coordinates */
  moveCursorTo: (x: number, y: number, label?: string) => void;
  /** Simulate a click at current position */
  simulateClick: () => Promise<void>;
  /** Clear cursor target */
  clearCursor: () => void;
  /** Set cursor label */
  setCursorLabel: (label: string) => void;
  /** Set whether autopilot is in a modal (for backdrop blur) */
  setAutopilotInModal: (inModal: boolean) => void;

  // Wizard Actions
  /** Open the wizard modal */
  openWizard: () => void;
  /** Close the wizard modal */
  closeWizard: () => void;
  /** Set the current wizard step index */
  setCurrentStepIndex: (index: number) => void;
  /** Update wizard data */
  setWizardData: (data: WizardData) => void;
  /** Start autopilot animation for a step */
  startAutopilot: (stepId: string, data: WizardData) => void;
}

type OnboardingContextType = OnboardingState & OnboardingActions;

const OnboardingContext = createContext<OnboardingContextType | null>(null);

interface OnboardingProviderProps {
  children: ReactNode;
}

/**
 * OnboardingProvider - Manages the Magic Autopilot Onboarding state
 *
 * Provides:
 * - Tour state management (active, current step)
 * - Ghost cursor positioning
 * - Element targeting by DOM ID
 * - Click simulation
 * - Wizard modal state
 * - Wizard data collection
 */
export function OnboardingProvider({ children }: OnboardingProviderProps) {
  // Tour State
  const [isTourActive, setIsTourActive] = useState(false);
  const [currentTourStep, setCurrentTourStep] = useState<OnboardingTourStep>('idle');
  const [cursorTarget, setCursorTarget] = useState<CursorTarget | null>(null);
  const [cursorLabel, setCursorLabelState] = useState('');
  const [isCursorClicking, setIsCursorClicking] = useState(false);
  const [isAutopilotInModal, setIsAutopilotInModalState] = useState(false);

  // Wizard State
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndexState] = useState(0);
  const [wizardData, setWizardDataState] = useState<WizardData>({});

  // ============================================
  // Tour Actions
  // ============================================

  /**
   * Start the onboarding tour
   */
  const startTour = useCallback(() => {
    setIsTourActive(true);
    setCurrentTourStep('welcome');
    setIsWizardOpen(true);
    setCurrentStepIndexState(0);
  }, []);

  /**
   * End the onboarding tour
   */
  const endTour = useCallback(async () => {
    setIsTourActive(false);
    setCurrentTourStep('idle');
    setCursorTarget(null);
    setCursorLabelState('');
    setIsCursorClicking(false);
    setIsWizardOpen(false);

    // Mark onboarding as completed in the database
    try {
      await fetch('/api/user/onboarding', { method: 'POST' });
    } catch (error) {
      console.error('[Onboarding] Failed to mark onboarding as complete:', error);
    }
  }, []);

  /**
   * Go to a specific tour step
   */
  const goToTourStep = useCallback((step: OnboardingTourStep) => {
    setCurrentTourStep(step);
  }, []);

  /**
   * Calculate element center coordinates
   */
  const getElementCenter = useCallback((elementId: string): CursorTarget | null => {
    const element = document.getElementById(elementId);
    if (!element) {
      console.warn(`[Onboarding] Element not found: #${elementId}`);
      return null;
    }

    const rect = element.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  }, []);

  /**
   * Move cursor to target element by ID
   */
  const moveCursorToElement = useCallback(
    (elementId: string, label?: string) => {
      const target = getElementCenter(elementId);
      if (target) {
        setCursorTarget(target);
        if (label !== undefined) {
          setCursorLabelState(label);
        }
      }
    },
    [getElementCenter]
  );

  /**
   * Move cursor to specific coordinates
   */
  const moveCursorTo = useCallback((x: number, y: number, label?: string) => {
    setCursorTarget({ x, y });
    if (label !== undefined) {
      setCursorLabelState(label);
    }
  }, []);

  /**
   * Simulate a click animation at current position
   */
  const simulateClick = useCallback(async (): Promise<void> => {
    setIsCursorClicking(true);
    await new Promise((resolve) => setTimeout(resolve, 200));
    setIsCursorClicking(false);
  }, []);

  /**
   * Clear cursor target (hide cursor)
   */
  const clearCursor = useCallback(() => {
    setCursorTarget(null);
    setCursorLabelState('');
  }, []);

  /**
   * Set cursor label
   */
  const setCursorLabel = useCallback((label: string) => {
    setCursorLabelState(label);
  }, []);

  /**
   * Set whether autopilot is in a modal
   */
  const setAutopilotInModal = useCallback((inModal: boolean) => {
    setIsAutopilotInModalState(inModal);
  }, []);

  // ============================================
  // Wizard Actions
  // ============================================

  /**
   * Open the wizard modal
   */
  const openWizard = useCallback(() => {
    setIsWizardOpen(true);
    setIsTourActive(true);
    setIsAutopilotInModalState(false); // Reset blur state when wizard opens
  }, []);

  /**
   * Close the wizard modal
   */
  const closeWizard = useCallback(() => {
    setIsWizardOpen(false);
  }, []);

  /**
   * Set current wizard step index
   */
  const setCurrentStepIndex = useCallback((index: number) => {
    setCurrentStepIndexState(index);
  }, []);

  /**
   * Update wizard data
   */
  const setWizardData = useCallback((data: WizardData) => {
    setWizardDataState(data);
  }, []);

  /**
   * Start autopilot animation for a step
   * Hides the wizard and prepares for cursor animation
   */
  const startAutopilot = useCallback(
    (stepId: string, data: WizardData) => {
      console.log('[Onboarding] Starting autopilot for:', stepId);
      console.log('[Onboarding] Data:', data);

      // Store the wizard data
      setWizardDataState(data);

      // Hide the wizard to show the autopilot
      setIsWizardOpen(false);

      // Set tour as active
      setIsTourActive(true);

      // TODO: Phase C will implement the actual cursor animation
      // For now, we just log and hide the modal
    },
    []
  );

  const value: OnboardingContextType = {
    // Tour State
    isTourActive,
    currentTourStep,
    cursorTarget,
    cursorLabel,
    isCursorClicking,
    isAutopilotInModal,
    // Wizard State
    isWizardOpen,
    currentStepIndex,
    wizardData,
    // Tour Actions
    startTour,
    endTour,
    goToTourStep,
    moveCursorToElement,
    moveCursorTo,
    simulateClick,
    clearCursor,
    setCursorLabel,
    setAutopilotInModal,
    // Wizard Actions
    openWizard,
    closeWizard,
    setCurrentStepIndex,
    setWizardData,
    startAutopilot,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

/**
 * Hook to access onboarding context
 * @throws Error if used outside OnboardingProvider
 */
export function useOnboarding(): OnboardingContextType {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}

export default OnboardingContext;
