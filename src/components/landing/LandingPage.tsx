'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { trackMixpanelEvent, onMixpanelReady } from '@/lib/mixpanel';
import LegalModal from '@/components/modals/LegalModal';
import Navbar from './Navbar';
import HeroSection from './HeroSection';
import FeaturesSection from './FeaturesSection';
import PlatformOverview from './PlatformOverview';
import HowItWorksSection from './HowItWorksSection';
import FAQSection from './FAQSection';
import FinalCTASection from './FinalCTASection';
import Footer from './Footer';

// Cookie name for signup source tracking
const SIGNUP_SOURCE_COOKIE = 'signup_source';

function LandingPageContent() {
  const searchParams = useSearchParams();
  const callbackUrl = '/dashboard';

  // Capture signup source from URL and store in cookie
  useEffect(() => {
    try {
      const source = searchParams.get('source') || searchParams.get('utm_source');
      if (source) {
        const maxAge = 60 * 60 * 24 * 7; // 7 days
        document.cookie = `${SIGNUP_SOURCE_COOKIE}=${encodeURIComponent(source)}; path=/; max-age=${maxAge}; SameSite=Lax`;
      }
    } catch {
      // Silently ignore cookie errors
    }
  }, [searchParams]);

  // Track "Landing Page Viewed" event once
  const hasTrackedRef = useRef(false);
  useEffect(() => {
    if (hasTrackedRef.current) return;
    hasTrackedRef.current = true;

    const source = searchParams.get('source') || undefined;
    const utmSource = searchParams.get('utm_source') || undefined;

    onMixpanelReady(() => {
      trackMixpanelEvent('Landing Page Viewed', {
        ...(source && { source }),
        ...(utmSource && { utm_source: utmSource }),
      });
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Legal modal state
  const [legalModal, setLegalModal] = useState<{
    isOpen: boolean;
    type: 'terms' | 'privacy';
  }>({ isOpen: false, type: 'terms' });

  return (
    <div dir="rtl" style={{ fontFamily: 'var(--font-heebo)' }}>
      <Navbar callbackUrl={callbackUrl} />
      <HeroSection callbackUrl={callbackUrl} onOpenLegal={(type) => setLegalModal({ isOpen: true, type })} />
      <FeaturesSection />
      <PlatformOverview />
      <HowItWorksSection />
      <FAQSection />
      <FinalCTASection callbackUrl={callbackUrl} onOpenLegal={(type) => setLegalModal({ isOpen: true, type })} />
      <Footer
        onOpenLegal={(type) => setLegalModal({ isOpen: true, type })}
      />

      <LegalModal
        isOpen={legalModal.isOpen}
        onClose={() => setLegalModal({ ...legalModal, isOpen: false })}
        type={legalModal.type}
      />
    </div>
  );
}

export default function LandingPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{
            background:
              'linear-gradient(180deg, #F5F9FE 0%, #EAF3FC 50%, #CCE4F5 100%)',
          }}
        >
          <div
            className="w-12 h-12 rounded-full animate-spin"
            style={{
              border: '4px solid #2B4699',
              borderTopColor: 'transparent',
            }}
          />
        </div>
      }
    >
      <LandingPageContent />
    </Suspense>
  );
}
