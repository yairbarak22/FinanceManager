'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { initMixpanel, identifyUser } from '@/lib/mixpanel';

const GA_MEASUREMENT_ID = 'G-RBSC0M8FV3';

interface AnalyticsProps {
  nonce?: string;
}

export default function Analytics({ nonce }: AnalyticsProps) {
  const [consentGiven, setConsentGiven] = useState<boolean | null>(null);
  const { data: session, status } = useSession();

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

  // Initialize Mixpanel immediately (the loaded callback inside initMixpanel
  // handles firing a test event once the SDK is truly ready)
  useEffect(() => {
    initMixpanel();
  }, []);

  // Identify user in Mixpanel when session is fully loaded (status === 'authenticated').
  // identifyUser() internally queues the call if the SDK isn't ready yet,
  // so this works regardless of Mixpanel init timing.
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      identifyUser(session.user.id, {
        name: session.user.name,
        email: session.user.email,
      });
    }
  }, [status, session]);

  return (
    <>
      {/* Google Analytics - only loads with consent */}
      {consentGiven && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
            nonce={nonce}
          />
          <Script
            id="google-analytics"
            strategy="afterInteractive"
            nonce={nonce}
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
      )}
    </>
  );
}
