'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  isMixpanelAvailable,
  isUserIdentifiedInMixpanel,
  trackMixpanelEvent,
  onMixpanelReady,
} from '@/lib/mixpanel';

/**
 * Automatically tracks page views in Mixpanel when routes change.
 * Required for Next.js App Router since client-side navigation
 * doesn't trigger full page reloads.
 *
 * Waits for user identification before sending page views when a session
 * exists, so events are properly attributed. Anonymous page views are
 * sent immediately when there is no active session.
 */
export default function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const lastTrackedPath = useRef<string>('');

  useEffect(() => {
    // Build full URL path
    const url = searchParams.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname;

    // Avoid duplicate tracking for the same path
    if (url === lastTrackedPath.current) return;

    const sendPageView = () => {
      if (!isMixpanelAvailable()) return;

      trackMixpanelEvent('Page View', {
        page_url: url,
        page_title: document.title,
      });

      lastTrackedPath.current = url;
    };

    // If the session is still loading, wait until we know whether the user
    // is authenticated before firing the page view so it can be attributed.
    if (status === 'loading') {
      // We'll re-run this effect when status changes
      return;
    }

    // If user is authenticated, wait for identification before tracking.
    // If user is already identified, send immediately.
    if (status === 'authenticated') {
      if (isUserIdentifiedInMixpanel()) {
        // Already identified, send right away (small delay for title to settle)
        const timer = setTimeout(sendPageView, 100);
        return () => clearTimeout(timer);
      } else {
        // Wait for the SDK to be ready + identify to complete
        // The identify is queued by Analytics.tsx, so once the SDK fires
        // its loaded callback and processes the queue, we can track.
        const timer = setTimeout(() => {
          // Re-check after a short delay — identify should have processed by now
          if (isMixpanelAvailable()) {
            sendPageView();
          }
        }, 500);
        return () => clearTimeout(timer);
      }
    }

    // Unauthenticated — track as anonymous after SDK is ready
    if (isMixpanelAvailable()) {
      const timer = setTimeout(sendPageView, 100);
      return () => clearTimeout(timer);
    } else {
      // SDK not ready yet, wait for it
      onMixpanelReady(() => {
        setTimeout(sendPageView, 100);
      });
    }
  }, [pathname, searchParams, status]);

  return null;
}
