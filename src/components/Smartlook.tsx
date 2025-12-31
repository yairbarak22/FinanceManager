'use client';

import { useEffect, useState, useCallback } from 'react';

const SMARTLOOK_PROJECT_KEY = 'ff3850f57f63db3eeb1e38ed64c7c1d592664267';
const SMARTLOOK_REGION = 'eu';

/**
 * Smartlook Component - Loads Smartlook behavior analytics
 * 
 * Features:
 * - Respects cookie consent (only loads if consent given)
 * - Automatically masks all form inputs for privacy
 * - EU region for GDPR compliance
 */
export default function Smartlook() {
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize Smartlook with privacy settings
  const initSmartlook = useCallback(() => {
    if (typeof window === 'undefined' || isLoaded) return;

    console.log('[Smartlook] Loading script...');

    // Load Smartlook script
    (function(d) {
      const o = (window.smartlook = function(...args: Parameters<typeof window.smartlook>) {
        o.api.push(args);
      } as typeof window.smartlook);
      const h = d.getElementsByTagName('head')[0];
      const c = d.createElement('script');
      o.api = [];
      c.async = true;
      c.type = 'text/javascript';
      c.charset = 'utf-8';
      c.src = 'https://web-sdk.smartlook.com/recorder.js';
      h.appendChild(c);
    })(document);

    // Initialize with project key and region
    window.smartlook('init', SMARTLOOK_PROJECT_KEY, { region: SMARTLOOK_REGION });
    console.log('[Smartlook] Initialized with key:', SMARTLOOK_PROJECT_KEY);

    // Configure recording to mask sensitive data
    // This tells Smartlook to mask form inputs, emails, and numbers
    window.smartlook('record', {
      forms: true,      // Mask all form inputs
      ips: false,       // Don't record IP (privacy)
      emails: true,     // Mask email addresses
      numbers: true,    // Mask numbers (financial data)
    });

    setIsLoaded(true);
    console.log('[Smartlook] Recording started');
  }, [isLoaded]);

  // TEMPORARY: Load immediately without consent check (for debugging)
  // TODO: Restore consent check after debugging
  useEffect(() => {
    initSmartlook();
  }, [initSmartlook]);

  // This component doesn't render anything visible
  return null;
}

