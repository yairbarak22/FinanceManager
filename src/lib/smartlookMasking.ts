'use client';

import { isSmartlookAvailable } from './smartlook';

/**
 * Smartlook Complete Masking Utility
 * 
 * Masks ALL text and numbers in Smartlook recordings.
 * This includes static content, user input, buttons, and any visible text.
 */

/**
 * Comprehensive list of CSS selectors to mask
 * Covers all text-containing elements
 */
const ALL_TEXT_SELECTORS = [
  // Text elements
  'p',
  'span',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'label',
  'td', 'th',
  'li',
  'a',
  'strong', 'em', 'b', 'i', 'small',
  'blockquote',
  'pre', 'code',
  
  // Form elements (input content)
  'input',
  'textarea',
  'select',
  'option',
  
  // Buttons (mask text content)
  'button',
  
  // Common financial/amount classes
  '[class*="amount"]',
  '[class*="currency"]',
  '[class*="balance"]',
  '[class*="value"]',
  '[class*="price"]',
  '[class*="total"]',
  '[class*="sum"]',
  '[class*="cost"]',
  
  // Data attributes for sensitive data
  '[data-amount]',
  '[data-value]',
  '[data-balance]',
  '[data-sensitive]',
  
  // Smartlook mask class (for manually marked elements)
  '.smartlook-mask',
  '.sensitive-data',
  
  // Div elements that typically contain text
  // (being more specific to avoid masking layout containers)
  'div[class*="text"]',
  'div[class*="content"]',
  'div[class*="title"]',
  'div[class*="description"]',
  'div[class*="label"]',
  'div[class*="name"]',
  'div[class*="message"]',
];

/**
 * Apply comprehensive masking to all text elements
 * Should be called after Smartlook is initialized
 */
export function applyCompleteMasking(): void {
  if (!isSmartlookAvailable()) {
    console.debug('[Smartlook Masking] Smartlook not available, skipping masking');
    return;
  }

  console.debug('[Smartlook Masking] Applying complete text masking...');

  // Apply masking for each selector
  ALL_TEXT_SELECTORS.forEach((selector) => {
    try {
      window.smartlook('mask', selector);
    } catch (error) {
      console.debug(`[Smartlook Masking] Error masking selector "${selector}":`, error);
    }
  });

  console.debug('[Smartlook Masking] Complete masking applied for', ALL_TEXT_SELECTORS.length, 'selectors');
}

/**
 * MutationObserver to mask dynamically added content
 * Watches for new elements and applies masking
 */
let maskingObserver: MutationObserver | null = null;

export function startMaskingObserver(): void {
  if (typeof window === 'undefined' || maskingObserver) {
    return;
  }

  // Re-apply masking whenever new nodes are added
  maskingObserver = new MutationObserver((mutations) => {
    let hasNewNodes = false;

    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length > 0) {
        hasNewNodes = true;
      }
    });

    // If new nodes were added, re-apply masking
    // Debounce to avoid excessive calls
    if (hasNewNodes) {
      debouncedApplyMasking();
    }
  });

  // Observe the entire document for added nodes
  maskingObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });

  console.debug('[Smartlook Masking] MutationObserver started');
}

export function stopMaskingObserver(): void {
  if (maskingObserver) {
    maskingObserver.disconnect();
    maskingObserver = null;
    console.debug('[Smartlook Masking] MutationObserver stopped');
  }
}

/**
 * Debounced version of applyCompleteMasking
 * Prevents excessive masking calls when many DOM changes occur
 */
let maskingTimeout: ReturnType<typeof setTimeout> | null = null;

function debouncedApplyMasking(): void {
  if (maskingTimeout) {
    clearTimeout(maskingTimeout);
  }

  maskingTimeout = setTimeout(() => {
    applyCompleteMasking();
    maskingTimeout = null;
  }, 500); // Wait 500ms after last DOM change
}

/**
 * Initialize complete masking
 * - Applies initial masking
 * - Starts MutationObserver for dynamic content
 */
export function initializeCompleteMasking(): void {
  // Apply initial masking
  applyCompleteMasking();

  // Start observer for dynamic content
  startMaskingObserver();
}

/**
 * Export selectors for reference
 */
export { ALL_TEXT_SELECTORS };

