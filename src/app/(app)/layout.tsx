'use client';

import { ReactNode, Suspense } from 'react';
import { MonthProvider } from '@/context/MonthContext';
import { ModalProvider } from '@/context/ModalContext';
import { SidebarProvider } from '@/context/SidebarContext';
import PageViewTracker from '@/components/PageViewTracker';

interface AppGroupLayoutProps {
  children: ReactNode;
}

export default function AppGroupLayout({ children }: AppGroupLayoutProps) {
  return (
    <SidebarProvider>
      <MonthProvider>
        <ModalProvider>
          <Suspense fallback={null}>
            <PageViewTracker />
          </Suspense>
          {children}
        </ModalProvider>
      </MonthProvider>
    </SidebarProvider>
  );
}

