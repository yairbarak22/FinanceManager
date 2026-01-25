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
  /** Skip autopilot, add directly via API, and continue to next step */
  skipAutopilotAndAdd: () => Promise<void>;
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

    // Mark onboarding as completed in the database with retry logic
    let success = false;
    let attempts = 0;
    const maxAttempts = 3;

    while (!success && attempts < maxAttempts) {
      attempts++;
      try {
        // IMPORTANT: Must include X-CSRF-Protection header for POST requests
        const response = await fetch('/api/user/onboarding', { 
          method: 'POST',
          headers: {
            'X-CSRF-Protection': '1',
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          // Verify the update succeeded by checking the status
          const verifyResponse = await fetch('/api/user/onboarding');
          if (verifyResponse.ok) {
            const data = await verifyResponse.json();
            if (data.hasSeenOnboarding === true) {
              success = true;
              console.debug('[Onboarding] Successfully marked as complete');
            }
          }
        } else {
          console.error(`[Onboarding] POST failed with status ${response.status}:`, await response.text());
        }
        
        if (!success && attempts < maxAttempts) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
      } catch (error) {
        console.error(`[Onboarding] Failed to mark onboarding as complete (attempt ${attempts}/${maxAttempts}):`, error);
        if (attempts < maxAttempts) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
      }
    }

    if (!success) {
      console.error('[Onboarding] Failed to mark onboarding as complete after all retries');
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

  /**
   * Skip autopilot, add data via API, and continue to next step
   */
  const skipAutopilotAndAdd = useCallback(async () => {
    const stepIds = ['profile', 'assets', 'liabilities', 'income', 'expenses', 'features'];
    const currentStepId = stepIds[currentStepIndex] || 'profile';
    
    console.log('[Onboarding] Skipping autopilot for step:', currentStepId);
    
    try {
      if (currentStepId === 'profile') {
        await fetch('/api/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'X-CSRF-Protection': '1' },
          body: JSON.stringify({
            ageRange: wizardData.ageRange || '26-35',
            employmentType: wizardData.employmentType || 'employee',
            militaryStatus: wizardData.militaryStatus || 'none',
            hasChildren: false,
            childrenCount: 0,
          }),
        });
      } else if (currentStepId === 'assets') {
        await fetch('/api/assets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-CSRF-Protection': '1' },
          body: JSON.stringify({
            name: wizardData.assetName || 'נכס חדש',
            category: wizardData.assetCategory || 'savings',
            value: parseFloat((wizardData.assetValue || '10000').replace(/,/g, '')),
          }),
        });
      } else if (currentStepId === 'liabilities' && wizardData.liabilityType !== 'none') {
        await fetch('/api/liabilities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-CSRF-Protection': '1' },
          body: JSON.stringify({
            name: wizardData.liabilityType === 'mortgage' ? 'משכנתא' : 'הלוואה',
            type: wizardData.liabilityType || 'loan',
            totalAmount: parseFloat((wizardData.liabilityAmount || '100000').replace(/,/g, '')),
            monthlyPayment: 1000,
            interestRate: parseFloat(wizardData.liabilityInterest || '5'),
            loanTermMonths: parseInt(wizardData.liabilityTerm || '120'),
          }),
        });
      } else if (currentStepId === 'income') {
        await fetch('/api/recurring', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-CSRF-Protection': '1' },
          body: JSON.stringify({
            type: 'income',
            name: wizardData.incomeName || 'הכנסה חודשית',
            category: wizardData.incomeCategory || 'salary',
            amount: parseFloat((wizardData.incomeAmount || '10000').replace(/,/g, '')),
          }),
        });
      } else if (currentStepId === 'expenses') {
        await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-CSRF-Protection': '1' },
          body: JSON.stringify({
            type: 'expense',
            description: wizardData.expenseName || 'הוצאה',
            category: wizardData.expenseCategory || 'other',
            amount: parseFloat((wizardData.expenseAmount || '100').replace(/,/g, '')),
            date: new Date().toISOString(),
          }),
        });
      }
      
      console.log('[Onboarding] Skip add successful for step:', currentStepId);
    } catch (error) {
      console.error('[Onboarding] Skip add error:', error);
    }
    
    // Stop autopilot animation
    setCursorTarget(null);
    setCursorLabelState('');
    setIsAutopilotInModalState(false);
    
    // Force close any open modals immediately by removing them from DOM
    const modalOverlays = document.querySelectorAll('.modal-overlay');
    modalOverlays.forEach(overlay => {
      (overlay as HTMLElement).style.display = 'none';
    });
    const modalContents = document.querySelectorAll('.modal-content');
    modalContents.forEach(modal => {
      (modal as HTMLElement).style.display = 'none';
    });
    
    // Dispatch escape to trigger React state cleanup
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    
    // Move to next step and reopen wizard immediately
    const nextIndex = Math.min(currentStepIndex + 1, stepIds.length - 1);
    setCurrentStepIndexState(nextIndex);
    setIsWizardOpen(true);
  }, [currentStepIndex, wizardData]);

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
    skipAutopilotAndAdd,
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
