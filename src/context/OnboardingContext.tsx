'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { trackMixpanelEvent } from '@/lib/mixpanel';
import { apiFetch } from '@/lib/utils';

/**
 * Onboarding Context State
 */
interface OnboardingState {
  /** Whether the onboarding modal is open */
  isWizardOpen: boolean;
}

/**
 * Onboarding Context Actions
 */
interface OnboardingActions {
  /** Open the onboarding modal (for new users or re-triggering from menu) */
  startTour: () => void;
  /** Open the onboarding modal (alias for startTour, kept for Haredi user flow) */
  startHarediTour: () => void;
  /** Mark onboarding as complete and close the modal */
  endTour: () => Promise<void>;
  /** Close the onboarding modal without marking as complete */
  closeWizard: () => void;
}

type OnboardingContextType = OnboardingState & OnboardingActions;

const OnboardingContext = createContext<OnboardingContextType | null>(null);

interface OnboardingProviderProps {
  children: ReactNode;
}

/**
 * OnboardingProvider - Manages the new-user onboarding modal state.
 *
 * Provides:
 * - Modal open/close state for the new user onboarding choice modal
 * - Mark-onboarding-complete API call with retry logic
 */
export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  /**
   * Open the onboarding modal
   */
  const startTour = useCallback(() => {
    setIsWizardOpen(true);
    trackMixpanelEvent('Onboarding Started', { user_type: 'regular' });
  }, []);

  /**
   * Open the onboarding modal (unified — Haredi and regular users get the same modal)
   */
  const startHarediTour = useCallback(() => {
    setIsWizardOpen(true);
    trackMixpanelEvent('Onboarding Started', { user_type: 'haredi' });
  }, []);

  /**
   * Close the onboarding modal and mark onboarding as complete in the database.
   * Includes retry logic for resilience.
   */
  const endTour = useCallback(async () => {
    setIsWizardOpen(false);

    // Mark onboarding as completed in the database with retry logic
    let success = false;
    let attempts = 0;
    const maxAttempts = 3;

    while (!success && attempts < maxAttempts) {
      attempts++;
      try {
        const response = await apiFetch('/api/user/onboarding', {
          method: 'POST',
        });

        if (response.ok) {
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
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
      } catch (error) {
        console.error(`[Onboarding] Failed to mark onboarding as complete (attempt ${attempts}/${maxAttempts}):`, error);
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
      }
    }

    if (!success) {
      console.error('[Onboarding] Failed to mark onboarding as complete after all retries');
    }

    trackMixpanelEvent('Onboarding Completed', {});

    // Dispatch event so ProgressBell can react
    window.dispatchEvent(new CustomEvent('onboarding-completed'));
  }, []);

  /**
   * Close the onboarding modal without marking as complete (skip/close button)
   */
  const closeWizard = useCallback(() => {
    setIsWizardOpen(false);
  }, []);

  const value: OnboardingContextType = {
    isWizardOpen,
    startTour,
    startHarediTour,
    endTour,
    closeWizard,
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
