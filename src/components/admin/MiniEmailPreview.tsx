'use client';

import { useRef, useEffect } from 'react';

interface MiniEmailPreviewProps {
  htmlContent: string;
  height?: number;
  className?: string;
}

/**
 * Lightweight iframe-based mini preview for the templates list page.
 * Renders a scaled-down, non-interactive version of the email template
 * inside an isolated iframe to prevent CSS leakage.
 */
export default function MiniEmailPreview({
  htmlContent,
  height = 140,
  className = '',
}: MiniEmailPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !htmlContent) return;

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(htmlContent);
    doc.close();

    // Disable all interactions and scrolling inside the iframe
    const disableInteractions = () => {
      try {
        const body = doc.body;
        if (body) {
          body.style.pointerEvents = 'none';
          body.style.userSelect = 'none';
          body.style.overflow = 'hidden';
        }
        const html = doc.documentElement;
        if (html) {
          html.style.overflow = 'hidden';
        }
      } catch {
        // Ignore cross-origin errors
      }
    };

    iframe.addEventListener('load', disableInteractions);
    const timeout = setTimeout(disableInteractions, 100);

    return () => {
      iframe.removeEventListener('load', disableInteractions);
      clearTimeout(timeout);
    };
  }, [htmlContent]);

  if (!htmlContent) {
    return null;
  }

  return (
    <div
      className={`overflow-hidden ${className}`}
      style={{ height: `${height}px` }}
    >
      <iframe
        ref={iframeRef}
        sandbox="allow-same-origin"
        title="Template Preview"
        className="w-full border-0 pointer-events-none"
        style={{
          height: '466px', // ~140 * 3.33 to match the scale
          transform: 'scale(0.3)',
          transformOrigin: 'top right',
          width: '333%',
        }}
        tabIndex={-1}
      />
    </div>
  );
}

