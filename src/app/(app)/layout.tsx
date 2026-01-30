'use client';

import { ReactNode } from 'react';
import { MonthProvider } from '@/context/MonthContext';
import { ModalProvider } from '@/context/ModalContext';
import { SidebarProvider } from '@/context/SidebarContext';

interface AppGroupLayoutProps {
  children: ReactNode;
}

export default function AppGroupLayout({ children }: AppGroupLayoutProps) {
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

