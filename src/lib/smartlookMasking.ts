'use client';

import { isSmartlookAvailable } from './smartlook';

/**
 * Smartlook Complete Masking Utility
 * 
 * Masks ALL text and numbers in Smartlook recordings.
 * Uses aggressive global masking to ensure nothing is visible.
 */

/**
 * Comprehensive list of CSS selectors to mask
 * Includes global containers and all text-containing elements
 */
const ALL_TEXT_SELECTORS = [
  // GLOBAL MASKING - Most aggressive approach
  'body',
  
  // Global containers
  'main',
  'section',
  'article',
  'header',
  'footer',
  'nav',
  'aside',
  
  // ALL div elements (not just those with specific classes)
  'div',
  
  // Text elements
  'p',
  'span',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'label',
  'td', 'th', 'tr',
  'li', 'ul', 'ol',
  'a',
  'strong', 'em', 'b', 'i', 'small',
  'blockquote',
  'pre', 'code',
  'figcaption',
  'caption',
  'summary',
  'details',
  
  // Form elements (input content)
  'input',
  'textarea',
  'select',
  'option',
  'optgroup',
  
  // Buttons (mask text content)
  'button',
  
  // SVG text elements
  'text',
  'tspan',
  
  // Data display elements
  'time',
  'data',
  'output',
  'meter',
  'progress',
  
  // Custom classes for sensitive data
  '.smartlook-mask',
  '.sensitive-data',
  
  // Elements with data attributes
  '[data-sensitive]',
  '[data-amount]',
  '[data-value]',
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
 * Watches for new elements, text changes, and attribute changes
 */
let maskingObserver: MutationObserver | null = null;

export function startMaskingObserver(): void {
  if (typeof window === 'undefined' || maskingObserver) {
    return;
  }

  // Re-apply masking whenever DOM changes
  maskingObserver = new MutationObserver((mutations) => {
    let shouldReapply = false;

    mutations.forEach((mutation) => {
      // Check for added nodes
      if (mutation.addedNodes.length > 0) {
        shouldReapply = true;
      }
      // Check for text content changes
      if (mutation.type === 'characterData') {
        shouldReapply = true;
      }
      // Check for attribute changes (class changes might add new text)
      if (mutation.type === 'attributes') {
        shouldReapply = true;
      }
    });

    // If changes detected, re-apply masking
    if (shouldReapply) {
      debouncedApplyMasking();
    }
  });

  // Observe the entire document for all types of changes
  maskingObserver.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,  // Detect text content changes
    attributes: true,     // Detect attribute changes
    attributeFilter: ['class', 'style', 'data-sensitive'],  // Only watch relevant attributes
  });

  console.debug('[Smartlook Masking] MutationObserver started with enhanced detection');
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
 * Reduced to 100ms for faster response to DOM changes
 */
let maskingTimeout: ReturnType<typeof setTimeout> | null = null;

function debouncedApplyMasking(): void {
  if (maskingTimeout) {
    clearTimeout(maskingTimeout);
  }

  maskingTimeout = setTimeout(() => {
    applyCompleteMasking();
    maskingTimeout = null;
  }, 100); // Reduced from 500ms to 100ms for faster masking
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
