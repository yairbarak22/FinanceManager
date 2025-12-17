'use client';

import { GoogleAnalytics } from '@next/third-parties/google';
import { useEffect, useState } from 'react';

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export default function Analytics() {
  const [consentGiven, setConsentGiven] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if user has given consent
    const consent = localStorage.getItem('analytics-consent');
    if (consent === 'true') {
      setConsentGiven(true);
    } else if (consent === 'false') {
      setConsentGiven(false);
    }
    // If no consent stored, stay null (banner will show)
  }, []);

  // Listen for consent changes
  useEffect(() => {
    const handleConsentChange = () => {
      const consent = localStorage.getItem('analytics-consent');
      setConsentGiven(consent === 'true');
    };

    window.addEventListener('analytics-consent-change', handleConsentChange);
    return () => window.removeEventListener('analytics-consent-change', handleConsentChange);
  }, []);

  // Don't load analytics if no consent or no ID
  if (!consentGiven || !GA_MEASUREMENT_ID) {
    return null;
  }

  return <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />;
}

