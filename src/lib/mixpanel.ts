'use client';

import mixpanel from 'mixpanel-browser';

const MIXPANEL_TOKEN = 'abb39b5aa2c86526ee9ede3dcba1fab8';

let isInitialized = false;
let isInitStarted = false; // Guard against React Strict Mode double-init
let isUserIdentified = false;

// Queue for identify calls that arrive before the SDK is ready
let pendingIdentify: { userId: string; traits?: { name?: string | null; email?: string | null } } | null = null;

// Listeners that want to know when the SDK is ready
const onReadyCallbacks: Array<() => void> = [];

/**
 * Register a callback to be called when Mixpanel SDK is loaded and ready.
 * If already ready, the callback fires immediately.
 */
export function onMixpanelReady(callback: () => void): void {
  if (isInitialized) {
    callback();
  } else {
    onReadyCallbacks.push(callback);
  }
}

/**
 * Execute the actual identify + people.set + super properties logic.
 * This is called either directly (if SDK is ready) or from the loaded callback (if queued).
 */
function executeIdentify(userId: string, traits?: { name?: string | null; email?: string | null }): void {
  try {
    mixpanel.identify(userId);

    // Standard user profile properties
    const profileProps: Record<string, string> = {};
    if (traits?.name) profileProps['$name'] = traits.name;
    if (traits?.email) profileProps['$email'] = traits.email;

    if (Object.keys(profileProps).length > 0) {
      mixpanel.people.set(profileProps);
    }

    // Set $created timestamp only once (won't overwrite if already set)
    mixpanel.people.set_once({
      $created: new Date().toISOString(),
    });

    // Set super properties so every future event includes user info
    const superProps: Record<string, string> = { user_id: userId };
    if (traits?.name) superProps['user_name'] = traits.name;
    if (traits?.email) superProps['user_email'] = traits.email;
    mixpanel.register(superProps);

    isUserIdentified = true;

    // Fire a confirmation event so we can verify in the Mixpanel dashboard
    mixpanel.track('User Identified', {
      user_id: userId,
      user_name: traits?.name || null,
      user_email: traits?.email || null,
      timestamp: new Date().toISOString(),
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('[Mixpanel] User identified:', userId, traits);
    }
  } catch (error) {
    console.error('[Mixpanel] Failed to identify user:', error);
  }
}

/**
 * Initialize Mixpanel with autocapture.
 * Uses isInitStarted guard to prevent double-init from React Strict Mode.
 * Uses the `loaded` callback to confirm the SDK is truly ready.
 */
export function initMixpanel(): void {
  if (isInitStarted) return; // Prevent double-init from React Strict Mode
  if (typeof window === 'undefined') return;
  isInitStarted = true;

  try {
    mixpanel.init(MIXPANEL_TOKEN, {
      debug: process.env.NODE_ENV === 'development',
      track_pageview: false, // We track page views manually for Next.js App Router
      persistence: 'localStorage',
      autocapture: true,
      record_sessions_percent: 0, // Disabled temporarily to fix mutex lock errors
      ignore_dnt: true,
      api_host: 'https://api-eu.mixpanel.com', // EU data residency
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

        // Process any queued identify call
        if (pendingIdentify) {
          console.log('[Mixpanel] Processing queued identify for:', pendingIdentify.userId);
          executeIdentify(pendingIdentify.userId, pendingIdentify.traits);
          pendingIdentify = null;
        }

        // Fire all registered onReady callbacks
        for (const cb of onReadyCallbacks) {
          try { cb(); } catch (e) { console.error('[Mixpanel] onReady callback error:', e); }
        }
        onReadyCallbacks.length = 0;
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
 * Check whether a user has been identified in this session.
 */
export function isUserIdentifiedInMixpanel(): boolean {
  return isUserIdentified;
}

/**
 * Identify the current user in Mixpanel.
 * If the SDK isn't ready yet, the call is queued and executed once the SDK loads.
 */
export function identifyUser(
  userId: string,
  traits?: { name?: string | null; email?: string | null }
): void {
  if (typeof window === 'undefined') return;

  // If SDK is ready, execute immediately
  if (isInitialized) {
    executeIdentify(userId, traits);
    return;
  }

  // Otherwise, queue it for when the SDK finishes loading
  console.log('[Mixpanel] SDK not ready yet, queuing identify for:', userId);
  pendingIdentify = { userId, traits };
}

/**
 * Reset Mixpanel identity (call on logout).
 */
export function resetMixpanel(): void {
  if (!isMixpanelAvailable()) return;

  try {
    mixpanel.reset();
    isUserIdentified = false;
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
