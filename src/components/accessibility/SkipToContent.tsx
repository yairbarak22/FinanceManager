'use client';

/**
 * SkipToContent - Accessibility Skip Link Component
 *
 * Provides a visually hidden link that becomes visible on focus,
 * allowing keyboard users to skip directly to main content.
 * This is a WCAG 2.1 Level A requirement (Success Criterion 2.4.1).
 */
export default function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="
        sr-only focus:not-sr-only
        fixed top-4 right-4 z-[10000]
        bg-indigo-600 text-white
        px-4 py-3 rounded-lg
        font-medium text-sm
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
        transition-all duration-200
        shadow-lg
      "
    >
      דלג לתוכן הראשי
    </a>
  );
}
