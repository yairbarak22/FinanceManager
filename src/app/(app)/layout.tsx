'use client';

import { ReactNode } from 'react';
import { MonthProvider } from '@/context/MonthContext';
import { ModalProvider } from '@/context/ModalContext';
import { OnboardingProvider } from '@/context/OnboardingContext';
import { SidebarProvider } from '@/context/SidebarContext';

interface AppGroupLayoutProps {
  children: ReactNode;
}

export default function AppGroupLayout({ children }: AppGroupLayoutProps) {
  return (
    <SidebarProvider>
      <MonthProvider>
        <ModalProvider>
          <OnboardingProvider>
            {children}
          </OnboardingProvider>
        </ModalProvider>
      </MonthProvider>
    </SidebarProvider>
  );
}

