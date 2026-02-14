'use client';

import { useRef, useEffect, useState } from 'react';

interface EmailPreviewProps {
  htmlContent: string;
  previewMode?: 'desktop' | 'mobile';
  maxHeight?: string;
  className?: string;
}

/**
 * Renders HTML email content inside an isolated iframe to prevent
 * template CSS/styles from leaking into and breaking the parent page.
 */
export default function EmailPreview({
  htmlContent,
  previewMode = 'desktop',
  maxHeight = '600px',
  className = '',
}: EmailPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState<number>(400);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(htmlContent);
    doc.close();

    // Auto-resize iframe to fit content after load
    const handleLoad = () => {
      try {
        const body = doc.body;
        const html = doc.documentElement;
        if (body && html) {
          const height = Math.max(
            body.scrollHeight,
            body.offsetHeight,
            html.scrollHeight,
            html.offsetHeight
          );
          setIframeHeight(height);
        }
      } catch {
        // Cross-origin or other error — keep default height
      }
    };

    // Wait for content to render
    iframe.addEventListener('load', handleLoad);
    // Also try after a short delay for inline content
    const timeout = setTimeout(handleLoad, 150);

    return () => {
      iframe.removeEventListener('load', handleLoad);
      clearTimeout(timeout);
    };
  }, [htmlContent]);

  if (!htmlContent) {
    return null;
  }

  return (
    <div
      className={`border border-[#E8E8ED] rounded-xl bg-[#F7F7F8] overflow-hidden transition-all duration-300 ${
        previewMode === 'mobile' ? 'w-[375px]' : 'w-full'
      } ${className}`}
      style={{ maxHeight }}
    >
      <iframe
        ref={iframeRef}
        sandbox="allow-same-origin"
        title="Email Preview"
        className="w-full border-0"
        style={{
          height: `${Math.min(iframeHeight, parseInt(maxHeight))}px`,
          maxHeight,
          overflow: 'auto',
        }}
      />
    </div>
  );
}

