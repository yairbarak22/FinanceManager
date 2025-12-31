'use client';

/**
 * Smartlook Utility Functions
 * 
 * Provides helper functions for:
 * - User identification
 * - User anonymization (logout)
 * - Custom event tracking
 * - Sensitive data masking
 */

/**
 * Check if Smartlook is available and initialized
 */
export function isSmartlookAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.smartlook === 'function';
}

/**
 * Identify a user in Smartlook
 * Call this after successful login
 * 
 * @param userId - Unique user identifier
 * @param email - User's email (will be masked in recordings)
 * @param name - User's display name
 * @param additionalProps - Any additional properties to track
 */
export function identifyUser(
  userId: string,
  email?: string | null,
  name?: string | null,
  additionalProps?: Record<string, string | number | boolean>
): void {
  if (!isSmartlookAvailable()) {
    console.debug('[Smartlook] Not available, skipping identify');
    return;
  }

  const properties: Record<string, string | number | boolean | undefined> = {
    ...additionalProps,
  };

  // Add email if provided (Smartlook will mask it in recordings)
  if (email) {
    properties.email = email;
  }

  // Add name if provided
  if (name) {
    properties.name = name;
  }

  window.smartlook('identify', userId, properties);
  console.debug('[Smartlook] User identified:', userId);
}

/**
 * Anonymize the current user (reset identification)
 * Call this on logout
 */
export function resetUser(): void {
  if (!isSmartlookAvailable()) {
    console.debug('[Smartlook] Not available, skipping anonymize');
    return;
  }

  window.smartlook('anonymize');
  console.debug('[Smartlook] User anonymized');
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

