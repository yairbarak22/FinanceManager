'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

const GA_MEASUREMENT_ID = 'G-RBSC0M8FV3';

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

  // Don't load analytics if no consent
  if (!consentGiven) {
    return null;
  }

  return (
    <>
      {/* Google tag (gtag.js) */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `,
        }}
      />
    </>
  );
}
