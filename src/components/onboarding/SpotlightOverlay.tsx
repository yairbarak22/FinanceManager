'use client';

import { useState, useEffect, useCallback } from 'react';

interface SpotlightOverlayProps {
  targetSelector: string | null;
}

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export default function SpotlightOverlay({ targetSelector }: SpotlightOverlayProps) {
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);

  const updateTargetRect = useCallback(() => {
    if (!targetSelector) {
      setTargetRect(null);
      return;
    }

    const element = document.querySelector(targetSelector);
    if (element) {
      const rect = element.getBoundingClientRect();
      const padding = 8; // Add some padding around the element
      setTargetRect({
        top: rect.top - padding + window.scrollY,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      });

      // Scroll element into view if needed
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      setTargetRect(null);
    }
  }, [targetSelector]);

  useEffect(() => {
    // Initial update
    updateTargetRect();

    // Update on resize
    window.addEventListener('resize', updateTargetRect);
    window.addEventListener('scroll', updateTargetRect);

    // Small delay to account for animations
    const timeout = setTimeout(updateTargetRect, 100);

    return () => {
      window.removeEventListener('resize', updateTargetRect);
      window.removeEventListener('scroll', updateTargetRect);
      clearTimeout(timeout);
    };
  }, [updateTargetRect]);

  // If no target (welcome/final screens), show full overlay
  if (!targetSelector || !targetRect) {
    return (
      <div className="fixed inset-0 z-[9998] bg-black/70 transition-all duration-300" />
    );
  }

  // Create clip-path to cut out the target element
  const clipPath = `
    polygon(
      0% 0%,
      0% 100%,
      ${targetRect.left}px 100%,
      ${targetRect.left}px ${targetRect.top}px,
      ${targetRect.left + targetRect.width}px ${targetRect.top}px,
      ${targetRect.left + targetRect.width}px ${targetRect.top + targetRect.height}px,
      ${targetRect.left}px ${targetRect.top + targetRect.height}px,
      ${targetRect.left}px 100%,
      100% 100%,
      100% 0%
    )
  `;

  return (
    <>
      {/* Dark overlay with cutout */}
      <div
        className="fixed inset-0 z-[9998] bg-black/70 transition-all duration-300"
        style={{ clipPath }}
      />
      {/* Highlight border around target */}
      <div
        className="fixed z-[9999] pointer-events-none rounded-xl transition-all duration-300"
        style={{
          top: targetRect.top,
          left: targetRect.left,
          width: targetRect.width,
          height: targetRect.height,
          boxShadow: '0 0 0 3px rgba(236, 72, 153, 0.8), 0 0 20px rgba(236, 72, 153, 0.4)',
        }}
      />
    </>
  );
}

