'use client';

import { ReactNode } from 'react';
import { MonthProvider } from '@/context/MonthContext';
import { ModalProvider } from '@/context/ModalContext';
import { SidebarProvider } from '@/context/SidebarContext';

export default function InvestProviders({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <MonthProvider>
        <ModalProvider>
          {children}
        </ModalProvider>
      </MonthProvider>
    </SidebarProvider>
  );
}
