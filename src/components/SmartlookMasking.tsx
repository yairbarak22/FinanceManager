'use client';

import { useEffect, useRef } from 'react';
import { initializeCompleteMasking, stopMaskingObserver, applyCompleteMasking } from '@/lib/smartlookMasking';
import { isSmartlookAvailable } from '@/lib/smartlook';

/**
 * SmartlookMasking Component
 * 
 * Initializes complete text/number masking for Smartlook recordings.
 * - Waits for Smartlook to be available
 * - Applies masking to all text elements
 * - Starts MutationObserver for dynamic content
 */
export default function SmartlookMasking() {
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;

    // Wait for Smartlook to be available
    const waitForSmartlook = () => {
      if (isSmartlookAvailable()) {
        console.log('[SmartlookMasking] Smartlook available, initializing masking...');
        initializeCompleteMasking();
        hasInitialized.current = true;
      } else {
        // Retry after a short delay
        setTimeout(waitForSmartlook, 1000);
      }
    };

    // Start checking after initial delay (Smartlook script needs time to load)
    const initialTimer = setTimeout(waitForSmartlook, 2000);

    // Cleanup
    return () => {
      clearTimeout(initialTimer);
      stopMaskingObserver();
    };
  }, []);

  // Re-apply masking on route changes (for Next.js client-side navigation)
  useEffect(() => {
    const handleRouteChange = () => {
      if (isSmartlookAvailable()) {
        // Wait for new content to render
        setTimeout(() => {
          applyCompleteMasking();
        }, 500);
      }
    };

    // Listen for popstate (browser back/forward)
    window.addEventListener('popstate', handleRouteChange);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  // This component doesn't render anything
  return null;
}

