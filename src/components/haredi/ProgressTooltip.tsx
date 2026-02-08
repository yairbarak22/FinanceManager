'use client';

import { useState, useRef, useEffect, ReactNode, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface ProgressTooltipProps {
  content: string;
  timeEstimate?: string;
  children: ReactNode;
}

export default function ProgressTooltip({
  content,
  timeEstimate,
  children,
}: ProgressTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number; position: 'top' | 'bottom' }>({
    top: 0,
    left: 0,
    position: 'top',
  });
  const triggerRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const tooltipWidth = 224; // w-56 = 14rem = 224px
    const tooltipHeight = 60; // approximate height

    // Determine if tooltip should go above or below
    const showBelow = rect.top < tooltipHeight + 16;

    // Center horizontally on the trigger element
    let left = rect.left + rect.width / 2 - tooltipWidth / 2;
    // Clamp to viewport edges
    left = Math.max(8, Math.min(left, window.innerWidth - tooltipWidth - 8));

    setTooltipPos({
      top: showBelow ? rect.bottom + 8 : rect.top - 8,
      left,
      position: showBelow ? 'bottom' : 'top',
    });
  }, []);

  useEffect(() => {
    if (isVisible) {
      updatePosition();
    }
  }, [isVisible, updatePosition]);

  return (
    <div
      ref={triggerRef}
      className="relative"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}

      {typeof window !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isVisible && (
              <motion.div
                initial={{ opacity: 0, y: tooltipPos.position === 'top' ? 4 : -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: tooltipPos.position === 'top' ? 4 : -4 }}
                transition={{ duration: 0.2 }}
                style={{
                  position: 'fixed',
                  top: tooltipPos.position === 'top' ? undefined : tooltipPos.top,
                  bottom: tooltipPos.position === 'top' ? `${window.innerHeight - tooltipPos.top}px` : undefined,
                  left: tooltipPos.left,
                  width: 224,
                }}
                className="z-[200] px-3 py-2 rounded-xl
                  bg-[#303150] text-white text-xs leading-relaxed
                  shadow-lg pointer-events-none"
              >
                <p>{content}</p>
                {timeEstimate && (
                  <p className="mt-1 text-[#BDBDCB] text-[11px]">
                    ⏱ {timeEstimate}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
