'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SmartGhostCursorProps {
  x: number;
  y: number;
  label?: string;
  isClicking?: boolean;
  isVisible?: boolean;
}

/**
 * SmartGhostCursor - A high-fidelity virtual mouse cursor for onboarding tours
 *
 * Features:
 * - macOS-style pointer SVG with shadow
 * - Smooth spring animations via Framer Motion
 * - Glassmorphism tooltip for labels
 * - Click animation feedback
 * - RTL support for Hebrew text
 * - Smart tooltip positioning (stays within screen bounds)
 */
export default function SmartGhostCursor({
  x,
  y,
  label,
  isClicking = false,
  isVisible = true,
}: SmartGhostCursorProps) {
  // Calculate tooltip position to keep it within screen bounds
  const tooltipPosition = useMemo(() => {
    if (typeof window === 'undefined') {
      return { top: 30, left: 30, right: 'auto', bottom: 'auto' };
    }

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const tooltipWidth = 200; // Approximate max tooltip width
    const tooltipHeight = 40; // Approximate tooltip height
    const cursorOffset = 30; // Distance from cursor

    // Determine horizontal position
    const nearRightEdge = x > screenWidth - tooltipWidth - 50;
    // Determine vertical position
    const nearBottomEdge = y > screenHeight - tooltipHeight - 100;

    return {
      top: nearBottomEdge ? 'auto' : cursorOffset,
      bottom: nearBottomEdge ? cursorOffset : 'auto',
      left: nearRightEdge ? 'auto' : cursorOffset,
      right: nearRightEdge ? cursorOffset : 'auto',
    };
  }, [x, y]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed z-[10001] pointer-events-none"
          initial={{ opacity: 0, scale: 0.5, left: x, top: y }}
          animate={{
            opacity: 1,
            scale: isClicking ? 0.9 : 1,
            left: x,
            top: y,
          }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{
            // Smooth movement animation
            left: { type: 'spring', stiffness: 50, damping: 15, mass: 1 },
            top: { type: 'spring', stiffness: 50, damping: 15, mass: 1 },
            // Quick scale/opacity
            opacity: { duration: 0.2 },
            scale: { type: 'spring', stiffness: 300, damping: 20 },
          }}
          style={{
            // Offset to position cursor tip at exact coordinates
            marginLeft: -2,
            marginTop: -2,
          }}
        >
          {/* macOS-style Cursor SVG */}
          <motion.svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-lg"
            animate={{ scale: isClicking ? 0.85 : 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            {/* Drop shadow filter */}
            <defs>
              <filter id="cursor-shadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity="0.3" />
              </filter>
            </defs>

            {/* Cursor shape - macOS style pointer */}
            <g filter="url(#cursor-shadow)">
              {/* White outline */}
              <path
                d="M5.5 2L5.5 19.5L9.5 15.5L13.5 22L16 21L12 14L18 14L5.5 2Z"
                fill="white"
                stroke="white"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              {/* Black fill */}
              <path
                d="M5.5 2L5.5 19.5L9.5 15.5L13.5 22L16 21L12 14L18 14L5.5 2Z"
                fill="#1D1D1F"
                stroke="#1D1D1F"
                strokeWidth="0.5"
                strokeLinejoin="round"
              />
            </g>
          </motion.svg>

          {/* Floating Tooltip - smart positioning */}
          <AnimatePresence>
            {label && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 5, scale: 0.95 }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 25,
                  delay: 0.1,
                }}
                className="absolute min-w-max"
                style={{
                  top: tooltipPosition.top,
                  bottom: tooltipPosition.bottom,
                  left: tooltipPosition.left,
                  right: tooltipPosition.right,
                }}
              >
                <div
                  className="
                    px-3 py-2
                    bg-white/90 backdrop-blur-xl
                    border border-slate-200
                    rounded-xl shadow-xl
                    text-sm font-medium text-slate-800
                    whitespace-nowrap
                  "
                  dir="rtl"
                >
                  {label}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Click ripple effect */}
          <AnimatePresence>
            {isClicking && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0.8 }}
                animate={{ scale: 2, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="absolute top-0 start-0 w-6 h-6 rounded-full bg-blue-500/30"
              />
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
