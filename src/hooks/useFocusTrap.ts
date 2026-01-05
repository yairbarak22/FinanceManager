import { useEffect, useRef, useCallback } from 'react';

/**
 * useFocusTrap - Accessibility Hook for Modal Focus Management
 *
 * Implements WCAG 2.4.3 Focus Order by trapping focus within a modal
 * and returning focus to the trigger element when closed.
 *
 * @param isOpen - Whether the modal is currently open
 * @param options - Configuration options
 * @returns ref to attach to the modal container
 */

interface UseFocusTrapOptions {
  /** Auto-focus the first focusable element when opened */
  autoFocus?: boolean;
  /** Return focus to trigger element when closed */
  returnFocus?: boolean;
  /** Close the modal when Escape is pressed */
  onEscape?: () => void;
}

const FOCUSABLE_SELECTORS = [
  'button:not([disabled])',
  'a[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(
  isOpen: boolean,
  options: UseFocusTrapOptions = {}
) {
  const { autoFocus = true, returnFocus = true, onEscape } = options;
  const containerRef = useRef<T>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Store the previously focused element when opening
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    }
  }, [isOpen]);

  // Return focus when closing
  useEffect(() => {
    if (!isOpen && returnFocus && previousFocusRef.current) {
      // Delay to ensure the modal is fully closed
      const timeout = setTimeout(() => {
        previousFocusRef.current?.focus();
      }, 0);
      return () => clearTimeout(timeout);
    }
  }, [isOpen, returnFocus]);

  // Auto-focus the first focusable element
  useEffect(() => {
    if (isOpen && autoFocus && containerRef.current) {
      const timeout = setTimeout(() => {
        const focusableElements = containerRef.current?.querySelectorAll<HTMLElement>(
          FOCUSABLE_SELECTORS
        );
        const firstElement = focusableElements?.[0];
        firstElement?.focus();
      }, 0);
      return () => clearTimeout(timeout);
    }
  }, [isOpen, autoFocus]);

  // Handle keyboard events
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Escape key handler
    if (e.key === 'Escape' && onEscape) {
      e.preventDefault();
      onEscape();
      return;
    }

    // Tab trapping
    if (e.key === 'Tab' && containerRef.current) {
      const focusableElements = containerRef.current.querySelectorAll<HTMLElement>(
        FOCUSABLE_SELECTORS
      );

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab - go to last element when on first
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab - go to first element when on last
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  }, [onEscape]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  return {
    containerRef,
    handleKeyDown,
  };
}

export default useFocusTrap;
