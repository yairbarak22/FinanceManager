'use client';

import { motion } from 'framer-motion';

interface MagicFrameProps {
  isVisible: boolean;
}

/**
 * MagicFrame - A glowing border effect for autopilot mode
 *
 * Creates a magical glowing line around the screen edges
 * to indicate that something special is happening.
 */
export default function MagicFrame({ isVisible }: MagicFrameProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9998] pointer-events-none overflow-hidden">
      {/* Main glowing border */}
      <motion.div
        className="absolute inset-3 rounded-2xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          border: '2px solid rgba(99, 102, 241, 0.6)',
          boxShadow: `
            0 0 10px rgba(99, 102, 241, 0.4),
            0 0 20px rgba(99, 102, 241, 0.3),
            0 0 40px rgba(99, 102, 241, 0.2),
            inset 0 0 10px rgba(99, 102, 241, 0.1)
          `,
        }}
      />

      {/* Pulsing glow overlay */}
      <motion.div
        className="absolute inset-3 rounded-2xl"
        animate={{
          boxShadow: [
            '0 0 15px rgba(99, 102, 241, 0.3), 0 0 30px rgba(99, 102, 241, 0.2), 0 0 60px rgba(99, 102, 241, 0.1)',
            '0 0 20px rgba(99, 102, 241, 0.5), 0 0 40px rgba(99, 102, 241, 0.3), 0 0 80px rgba(99, 102, 241, 0.2)',
            '0 0 15px rgba(99, 102, 241, 0.3), 0 0 30px rgba(99, 102, 241, 0.2), 0 0 60px rgba(99, 102, 241, 0.1)',
          ],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          border: '1px solid transparent',
        }}
      />

      {/* Animated traveling light effect */}
      <svg
        className="absolute inset-3 w-[calc(100%-24px)] h-[calc(100%-24px)]"
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* Gradient for the traveling light */}
          <linearGradient id="magicGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(99, 102, 241, 0)" />
            <stop offset="40%" stopColor="rgba(129, 140, 248, 0.8)" />
            <stop offset="50%" stopColor="rgba(165, 180, 252, 1)" />
            <stop offset="60%" stopColor="rgba(129, 140, 248, 0.8)" />
            <stop offset="100%" stopColor="rgba(99, 102, 241, 0)" />
          </linearGradient>
        </defs>

        {/* The border path */}
        <motion.rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          rx="16"
          ry="16"
          fill="none"
          stroke="url(#magicGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: 0, pathOffset: 0 }}
          animate={{ pathOffset: [0, 1] }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{
            strokeDasharray: '0.15 0.85',
            filter: 'drop-shadow(0 0 6px rgba(129, 140, 248, 0.8))',
          }}
        />
      </svg>
    </div>
  );
}
