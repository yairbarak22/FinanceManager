'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { isMixpanelAvailable, trackMixpanelEvent } from '@/lib/mixpanel';

/**
 * Automatically tracks page views in Mixpanel when routes change.
 * Required for Next.js App Router since client-side navigation
 * doesn't trigger full page reloads.
 */
export default function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedPath = useRef<string>('');

  useEffect(() => {
    // Build full URL path
    const url = searchParams.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname;

    // Avoid duplicate tracking for the same path
    if (url === lastTrackedPath.current) return;

    // Wait a tick to ensure Mixpanel is initialized
    const timer = setTimeout(() => {
      if (!isMixpanelAvailable()) return;

      trackMixpanelEvent('Page View', {
        page_url: url,
        page_title: document.title,
      });

      lastTrackedPath.current = url;
    }, 100);

    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  return null;
}

