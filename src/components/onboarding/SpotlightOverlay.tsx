'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

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
  const [isAnimating, setIsAnimating] = useState(false);
  const prevSelectorRef = useRef<string | null>(null);

  // Smooth scroll to element
  const scrollToElement = useCallback((element: Element) => {
    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const elementCenter = rect.top + rect.height / 2;
    const viewportCenter = viewportHeight / 2;
    
    // Only scroll if element is not visible or too close to edges
    if (rect.top < 100 || rect.bottom > viewportHeight - 100) {
      const scrollTarget = window.scrollY + elementCenter - viewportCenter;
      window.scrollTo({
        top: Math.max(0, scrollTarget),
        behavior: 'smooth',
      });
    }
  }, []);

  const updateTargetRect = useCallback(() => {
    if (!targetSelector) {
      setTargetRect(null);
      return;
    }

    const element = document.querySelector(targetSelector);
    if (element) {
      const rect = element.getBoundingClientRect();
      const padding = 8;
      setTargetRect({
        top: rect.top - padding,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      });
    } else {
      setTargetRect(null);
    }
  }, [targetSelector]);

  // Handle selector change with animation
  useEffect(() => {
    if (prevSelectorRef.current !== targetSelector) {
      setIsAnimating(true);
      
      // First scroll to the new element
      if (targetSelector) {
        const element = document.querySelector(targetSelector);
        if (element) {
          scrollToElement(element);
        }
      }
      
      // Then update the rect after scroll starts
      const scrollTimeout = setTimeout(() => {
        updateTargetRect();
        setIsAnimating(false);
      }, 300);
      
      prevSelectorRef.current = targetSelector;
      
      return () => clearTimeout(scrollTimeout);
    }
  }, [targetSelector, scrollToElement, updateTargetRect]);

  // Update on scroll/resize
  useEffect(() => {
    const handleUpdate = () => {
      if (!isAnimating) {
        updateTargetRect();
      }
    };

    window.addEventListener('resize', handleUpdate);
    window.addEventListener('scroll', handleUpdate);

    // Initial update
    updateTargetRect();

    return () => {
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate);
    };
  }, [updateTargetRect, isAnimating]);

  // If no target (welcome/final screens), show full overlay
  if (!targetSelector || !targetRect) {
    return (
      <div 
        className="fixed inset-0 z-[9998] bg-black/70 pointer-events-auto transition-opacity duration-500"
        style={{ opacity: isAnimating ? 0.5 : 1 }}
      />
    );
  }

  return (
    <>
      {/* Dark overlay using box-shadow instead of clip-path for smoother animation */}
      <div
        className="fixed z-[9998] pointer-events-none rounded-xl transition-all duration-500 ease-out"
        style={{
          top: targetRect.top,
          left: targetRect.left,
          width: targetRect.width,
          height: targetRect.height,
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75)',
          opacity: isAnimating ? 0.7 : 1,
        }}
      />
      {/* Highlight border around target */}
      <div
        className="fixed z-[9999] pointer-events-none rounded-xl transition-all duration-500 ease-out"
        style={{
          top: targetRect.top,
          left: targetRect.left,
          width: targetRect.width,
          height: targetRect.height,
          boxShadow: '0 0 0 3px rgba(236, 72, 153, 0.8), 0 0 20px rgba(236, 72, 153, 0.4)',
          opacity: isAnimating ? 0 : 1,
        }}
      />
    </>
  );
}

