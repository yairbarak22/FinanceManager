'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import OnboardingWizard from './OnboardingWizard';

interface OnboardingContextType {
  isActive: boolean;
  startOnboarding: () => void;
  completeOnboarding: () => void;
  openProfileModal: boolean;
  setOpenProfileModal: (open: boolean) => void;
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
  const [hasCheckedStatus, setHasCheckedStatus] = useState(false);
  const [openProfileModal, setOpenProfileModal] = useState(false);

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

  const startOnboarding = useCallback(() => {
    setIsActive(true);
  }, []);

  const completeOnboarding = useCallback(() => {
    setIsActive(false);
    markOnboardingComplete();
  }, []);

  const handleOpenProfile = useCallback(() => {
    setOpenProfileModal(true);
  }, []);

  const value: OnboardingContextType = {
    isActive,
    startOnboarding,
    completeOnboarding,
    openProfileModal,
    setOpenProfileModal,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
      {isActive && (
        <OnboardingWizard 
          onComplete={completeOnboarding}
          onOpenProfile={handleOpenProfile}
        />
      )}
    </OnboardingContext.Provider>
  );
}
