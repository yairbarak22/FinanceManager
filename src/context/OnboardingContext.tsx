'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { liabilityTypes as defaultLiabilityTypes } from '@/lib/categories';

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
  /** Whether this is a Haredi user (signupSource === 'prog') */
  isHarediUser: boolean;

  // Add to Home Screen Modal State
  /** Whether the add to home screen modal is open */
  isAddToHomeScreenModalOpen: boolean;
}

/**
 * Onboarding Context Actions
 */
interface OnboardingActions {
  // Tour Actions
  /** Start the onboarding tour */
  startTour: () => void;
  /** Start the Haredi onboarding tour */
  startHarediTour: () => void;
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
  /** Show success notification */
  showSuccess: (message: string) => void;

  // Add to Home Screen Modal Actions
  /** Open the add to home screen modal */
  openAddToHomeScreenModal: () => void;
  /** Close the add to home screen modal */
  closeAddToHomeScreenModal: () => void;
}

/**
 * Extended state including success notification
 */
interface OnboardingNotificationState {
  showSuccessNotification: boolean;
  successNotificationMessage: string;
}

type OnboardingContextType = OnboardingState & OnboardingActions & OnboardingNotificationState;

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
  const [isHarediUser, setIsHarediUser] = useState(false);

  // Success Notification State
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [successNotificationMessage, setSuccessNotificationMessage] = useState('');

  // Add to Home Screen Modal State
  const [isAddToHomeScreenModalOpen, setIsAddToHomeScreenModalOpen] = useState(false);

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
    setIsHarediUser(false);
  }, []);

  /**
   * Start the Haredi onboarding tour
   */
  const startHarediTour = useCallback(() => {
    setIsTourActive(true);
    setCurrentTourStep('welcome');
    setIsWizardOpen(true);
    setCurrentStepIndexState(0);
    setIsHarediUser(true);
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

    // First, fill any empty steps with demo data
    try {
      const fillResponse = await fetch('/api/onboarding/fill-empty-steps', {
        method: 'POST',
        headers: {
          'X-CSRF-Protection': '1',
          'Content-Type': 'application/json',
        },
      });
      
      if (fillResponse.ok) {
        const fillData = await fillResponse.json();
        if (fillData.filledSteps) {
          console.debug('[Onboarding] Filled empty steps with demo data:', fillData.data);
          // Trigger dashboard data refresh
          window.dispatchEvent(new CustomEvent('onboarding-data-added'));
        }
      }
    } catch (error) {
      console.error('[Onboarding] Failed to fill empty steps:', error);
    }

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

    // Open the "Add to Home Screen" modal after a short delay
    setTimeout(() => {
      setIsAddToHomeScreenModalOpen(true);
    }, 500);
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
    const stepIds = ['welcome', 'profile', 'assets', 'liabilities', 'income', 'expenses', 'features'];
    const currentStepId = stepIds[currentStepIndex] || 'welcome';
    
    console.log('[Onboarding] Skipping autopilot for step:', currentStepId);
    
    let successMessage = '';
    
    try {
      if (currentStepId === 'profile') {
        const res = await fetch('/api/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'X-CSRF-Protection': '1' },
          body: JSON.stringify({
            ageRange: wizardData.ageRange || '26-35',
            employmentType: wizardData.employmentType || 'employee',
            hasChildren: false,
            childrenCount: 0,
          }),
        });
        if (res.ok) successMessage = 'הפרופיל עודכן בהצלחה!';
      } else if (currentStepId === 'assets') {
        const res = await fetch('/api/assets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-CSRF-Protection': '1' },
          body: JSON.stringify({
            name: wizardData.assetName || 'נכס חדש',
            category: wizardData.assetCategory || 'savings_account', // Default from categories.ts
            value: parseFloat((wizardData.assetValue || '10000').replace(/,/g, '')),
          }),
        });
        if (res.ok) successMessage = 'הנכס נוסף בהצלחה!';
      } else if (currentStepId === 'liabilities') {
        if (wizardData.liabilityType !== 'none') {
          // Get liability name from selected category
          const liabilityType = wizardData.liabilityType || 'loan';
          const liabilityCategory = defaultLiabilityTypes.find(c => c.id === liabilityType);
          const liabilityName = liabilityCategory?.nameHe || 'הלוואה';
          
          const res = await fetch('/api/liabilities', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-Protection': '1' },
            body: JSON.stringify({
              name: liabilityName,
              type: liabilityType,
              totalAmount: parseFloat((wizardData.liabilityAmount || '100000').replace(/,/g, '')),
              monthlyPayment: 1000,
              interestRate: parseFloat(wizardData.liabilityInterest || '5'),
              loanTermMonths: parseInt(wizardData.liabilityTerm || '120'),
            }),
          });
          if (res.ok) successMessage = 'ההתחייבות נוספה בהצלחה!';
        } else {
          successMessage = 'דילגת על הוספת התחייבויות';
        }
      } else if (currentStepId === 'income') {
        const res = await fetch('/api/recurring', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-CSRF-Protection': '1' },
          body: JSON.stringify({
            type: 'income',
            name: wizardData.incomeName || 'הכנסה חודשית',
            category: wizardData.incomeCategory || 'salary',
            amount: parseFloat((wizardData.incomeAmount || '10000').replace(/,/g, '')),
          }),
        });
        if (res.ok) successMessage = 'ההכנסה נוספה בהצלחה!';
      } else if (currentStepId === 'expenses') {
        const res = await fetch('/api/transactions', {
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
        if (res.ok) successMessage = 'ההוצאה נוספה בהצלחה!';
      }
      
      // Show success notification
      if (successMessage) {
        setSuccessNotificationMessage(successMessage);
        setShowSuccessNotification(true);
        setTimeout(() => setShowSuccessNotification(false), 2000);
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

  /**
   * Show success notification
   */
  const showSuccess = useCallback((message: string) => {
    setSuccessNotificationMessage(message);
    setShowSuccessNotification(true);
    setTimeout(() => setShowSuccessNotification(false), 2000);
  }, []);

  // ============================================
  // Add to Home Screen Modal Actions
  // ============================================

  /**
   * Open the add to home screen modal
   */
  const openAddToHomeScreenModal = useCallback(() => {
    setIsAddToHomeScreenModalOpen(true);
  }, []);

  /**
   * Close the add to home screen modal
   */
  const closeAddToHomeScreenModal = useCallback(() => {
    setIsAddToHomeScreenModalOpen(false);
  }, []);

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
    isHarediUser,
    // Add to Home Screen Modal State
    isAddToHomeScreenModalOpen,
    // Notification State
    showSuccessNotification,
    successNotificationMessage,
    // Tour Actions
    startTour,
    startHarediTour,
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
    showSuccess,
    // Add to Home Screen Modal Actions
    openAddToHomeScreenModal,
    closeAddToHomeScreenModal,
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
