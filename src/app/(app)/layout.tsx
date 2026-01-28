'use client';

import { ReactNode } from 'react';
import { MonthProvider } from '@/context/MonthContext';
import { ModalProvider } from '@/context/ModalContext';
import { OnboardingProvider } from '@/context/OnboardingContext';

interface AppGroupLayoutProps {
  children: ReactNode;
}

export default function AppGroupLayout({ children }: AppGroupLayoutProps) {
  return (
    <MonthProvider>
      <ModalProvider>
        <OnboardingProvider>
          {children}
        </OnboardingProvider>
      </ModalProvider>
    </MonthProvider>
  );
}

