'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * Scroll-spy hook: observes h2/h3 headings inside a container
 * and returns the ID of the one currently closest to the top.
 */
export function useActiveHeading(containerRef: React.RefObject<HTMLElement | null>) {
  const [activeId, setActiveId] = useState<string>('');
  const headingsRef = useRef<HTMLElement[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const headings = Array.from(
      container.querySelectorAll<HTMLElement>('h2[id], h3[id]')
    );
    headingsRef.current = headings;

    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the topmost visible heading
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: '-80px 0px -70% 0px',
        threshold: 0,
      }
    );

    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [containerRef]);

  return { activeId, headings: headingsRef };
}
