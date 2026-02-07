'use client';

import mixpanel from 'mixpanel-browser';

const MIXPANEL_TOKEN = 'abb39b5aa2c86526ee9ede3dcba1fab8';

let isInitialized = false;

/**
 * Initialize Mixpanel with autocapture.
 * Uses the `loaded` callback to confirm the SDK is truly ready before
 * marking it as initialized and firing a test event.
 */
export function initMixpanel(): void {
  if (isInitialized) return;
  if (typeof window === 'undefined') return;

  try {
    mixpanel.init(MIXPANEL_TOKEN, {
      debug: process.env.NODE_ENV === 'development',
      track_pageview: false, // We track page views manually for Next.js App Router
      persistence: 'localStorage',
      autocapture: true,
      record_sessions_percent: 0, // Disabled temporarily to fix mutex lock errors
      ignore_dnt: true,
      api_host: 'https://api-js.mixpanel.com',
      batch_flush_interval_ms: 1000, // Flush every 1 second for faster delivery
      loaded: (mp) => {
        isInitialized = true;
        console.log('[Mixpanel] SDK loaded and ready');

        // Fire a guaranteed test event from inside the loaded callback
        mp.track('Mixpanel Loaded', {
          page_url: window.location.href,
          page_title: document.title,
          timestamp: new Date().toISOString(),
        });
      },
    });
  } catch (error) {
    console.error('[Mixpanel] Failed to initialize:', error);
  }
}

/**
 * Check whether Mixpanel has been initialized.
 */
export function isMixpanelAvailable(): boolean {
  return isInitialized;
}

/**
 * Identify the current user in Mixpanel.
 * Call this after the user signs in.
 */
export function identifyUser(
  userId: string,
  traits?: { name?: string | null; email?: string | null }
): void {
  if (!isMixpanelAvailable()) return;

  try {
    mixpanel.identify(userId);

    const profileProps: Record<string, string> = {};
    if (traits?.name) profileProps['$name'] = traits.name;
    if (traits?.email) profileProps['$email'] = traits.email;

    if (Object.keys(profileProps).length > 0) {
      mixpanel.people.set(profileProps);
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[Mixpanel] User identified:', userId);
    }
  } catch (error) {
    console.error('[Mixpanel] Failed to identify user:', error);
  }
}

/**
 * Reset Mixpanel identity (call on logout).
 */
export function resetMixpanel(): void {
  if (!isMixpanelAvailable()) return;

  try {
    mixpanel.reset();
  } catch (error) {
    console.error('[Mixpanel] Failed to reset:', error);
  }
}

/**
 * Track a custom event in Mixpanel.
 */
export function trackMixpanelEvent(
  eventName: string,
  properties?: Record<string, unknown>
): void {
  if (!isMixpanelAvailable()) return;

  try {
    mixpanel.track(eventName, properties);

    if (process.env.NODE_ENV === 'development') {
      console.log('[Mixpanel] Event tracked:', eventName, properties);
    }
  } catch (error) {
    console.error('[Mixpanel] Failed to track event:', eventName, error);
  }
}
