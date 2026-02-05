'use client';

/**
 * Smartlook Utility Functions
 * 
 * PRIVACY: Complete anonymization mode - NO user identification is sent.
 * All users appear as "Anonymous Visitor" in the dashboard.
 * 
 * Provides helper functions for:
 * - Custom event tracking (anonymous)
 * - Recording control (pause/resume)
 */

/**
 * Check if Smartlook is available and initialized
 */
export function isSmartlookAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.smartlook === 'function';
}

/**
 * Track a custom event in Smartlook
 * 
 * @param eventName - Name of the event
 * @param properties - Event properties
 */
export function trackSmartlookEvent(
  eventName: string,
  properties?: Record<string, string | number | boolean>
): void {
  if (!isSmartlookAvailable()) {
    return;
  }

  window.smartlook('track', eventName, properties);
}

/**
 * Pause Smartlook recording
 * Useful when showing sensitive screens
 */
export function pauseRecording(): void {
  if (!isSmartlookAvailable()) {
    return;
  }

  window.smartlook('pause');
  console.debug('[Smartlook] Recording paused');
}

/**
 * Resume Smartlook recording
 */
export function resumeRecording(): void {
  if (!isSmartlookAvailable()) {
    return;
  }

  window.smartlook('resume');
  console.debug('[Smartlook] Recording resumed');
}

/**
 * Get Smartlook session data
 * Returns visitor ID, session ID, and record ID
 */
export function getSmartlookData(): Promise<{ visitorId: string; sessionId: string; recordId: string } | null> {
  return new Promise((resolve) => {
    if (!isSmartlookAvailable()) {
      resolve(null);
      return;
    }

    window.smartlook('getData', (data) => {
      resolve(data);
    });
  });
}

/**
 * Configure IP consent
 * Set to false to prevent IP recording (GDPR compliance)
 */
export function setIPConsent(consent: boolean): void {
  if (!isSmartlookAvailable()) {
    return;
  }

  window.smartlook('consentIP', consent);
}

/**
 * Sensitive data selectors that should be masked
 * These are applied via CSS data attributes
 */
export const SENSITIVE_SELECTORS = [
  'input[type="text"]',
  'input[type="number"]',
  'input[type="email"]',
  'input[type="password"]',
  'input[type="tel"]',
  'textarea',
  '[data-sensitive]',
  '.sensitive-data',
  // Financial specific
  '.currency-input',
  '.amount-field',
] as const;

/**
 * Selectors for user profile images that should be masked for privacy
 * These include Google profile images and any images marked with data-sl="mask"
 */
export const PROFILE_IMAGE_SELECTORS = [
  // Images explicitly marked for masking
  'img[data-sl="mask"]',
  // Google profile images (covers all Google domains)
  'img[src*="googleusercontent.com"]',
  'img[src*="lh3.googleusercontent.com"]',
  // Generic avatar/profile selectors
  'img[alt*="profile"]',
  'img[alt*="avatar"]',
  'img[alt*="User"]',
] as const;

/**
 * Apply masking to user profile images using Smartlook's mask API
 * This ensures profile images from Google OAuth are hidden in recordings
 * 
 * PRIVACY: Critical function for GDPR compliance - user faces should not be recorded
 */
export function maskUserProfileImages(): void {
  if (!isSmartlookAvailable()) {
    console.debug('[Smartlook] Not available, skipping image masking');
    return;
  }

  // Apply masking for each profile image selector
  PROFILE_IMAGE_SELECTORS.forEach((selector) => {
    try {
      window.smartlook('mask', selector);
      console.debug(`[Smartlook] Applied mask to: ${selector}`);
    } catch (error) {
      console.error(`[Smartlook] Failed to mask selector ${selector}:`, error);
    }
  });

  console.debug('[Smartlook] Profile image masking applied');
}

/**
 * Initialize all privacy masking for Smartlook
 * Should be called after Smartlook is initialized
 * 
 * Includes retry mechanism in case Smartlook isn't fully loaded yet
 */
export function initializePrivacyMasking(retries = 3, delay = 500): void {
  if (!isSmartlookAvailable()) {
    if (retries > 0) {
      console.debug(`[Smartlook] Not ready, retrying in ${delay}ms (${retries} retries left)`);
      setTimeout(() => initializePrivacyMasking(retries - 1, delay), delay);
      return;
    }
    console.warn('[Smartlook] Failed to initialize privacy masking - Smartlook not available');
    return;
  }

  // Apply profile image masking
  maskUserProfileImages();

  // Apply masking for sensitive data selectors
  SENSITIVE_SELECTORS.forEach((selector) => {
    try {
      window.smartlook('mask', selector);
    } catch (error) {
      console.error(`[Smartlook] Failed to mask selector ${selector}:`, error);
    }
  });

  console.debug('[Smartlook] All privacy masking initialized');
}

