'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface AccessibilityContextType {
  isAccessibilityOpen: boolean;
  openAccessibility: () => void;
  closeAccessibility: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [isAccessibilityOpen, setIsAccessibilityOpen] = useState(false);

  const openAccessibility = useCallback(() => {
    setIsAccessibilityOpen(true);
  }, []);

  const closeAccessibility = useCallback(() => {
    setIsAccessibilityOpen(false);
  }, []);

  return (
    <AccessibilityContext.Provider value={{ isAccessibilityOpen, openAccessibility, closeAccessibility }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}

