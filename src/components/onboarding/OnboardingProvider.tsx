'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import SpotlightOverlay from './SpotlightOverlay';
import TooltipBox from './TooltipBox';
import { tourSteps, TourStep } from './tourSteps';

interface OnboardingContextType {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  currentStepData: TourStep | null;
  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  endTour: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
}

interface OnboardingProviderProps {
  children: ReactNode;
}

export default function OnboardingProvider({ children }: OnboardingProviderProps) {
  const { status } = useSession();
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCheckedStatus, setHasCheckedStatus] = useState(false);

  // Check onboarding status on mount
  useEffect(() => {
    if (status === 'authenticated' && !hasCheckedStatus) {
      checkOnboardingStatus();
    }
  }, [status, hasCheckedStatus]);

  const checkOnboardingStatus = async () => {
    try {
      const res = await fetch('/api/user/onboarding');
      if (res.ok) {
        const data = await res.json();
        if (!data.hasSeenOnboarding) {
          // Small delay to let the page render first
          setTimeout(() => {
            setIsActive(true);
          }, 500);
        }
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    } finally {
      setHasCheckedStatus(true);
    }
  };

  const markOnboardingComplete = async () => {
    try {
      await fetch('/api/user/onboarding', { method: 'POST' });
    } catch (error) {
      console.error('Error marking onboarding complete:', error);
    }
  };

  const startTour = useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      endTour();
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const skipTour = useCallback(() => {
    setIsActive(false);
    setCurrentStep(0);
    markOnboardingComplete();
  }, []);

  const endTour = useCallback(() => {
    setIsActive(false);
    setCurrentStep(0);
    markOnboardingComplete();
  }, []);

  const currentStepData = isActive ? tourSteps[currentStep] : null;

  const value: OnboardingContextType = {
    isActive,
    currentStep,
    totalSteps: tourSteps.length,
    currentStepData,
    startTour,
    nextStep,
    prevStep,
    skipTour,
    endTour,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
      {isActive && currentStepData && (
        <>
          <SpotlightOverlay targetSelector={currentStepData.target} />
          <TooltipBox
            step={currentStepData}
            currentIndex={currentStep}
            totalSteps={tourSteps.length}
            onNext={nextStep}
            onPrev={prevStep}
            onSkip={skipTour}
          />
        </>
      )}
    </OnboardingContext.Provider>
  );
}

