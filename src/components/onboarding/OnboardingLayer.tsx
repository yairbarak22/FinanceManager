'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Bot } from 'lucide-react';
import { useOnboarding } from '@/context/OnboardingContext';
import OnboardingWizard from './OnboardingWizard';
import SmartGhostCursor from './SmartGhostCursor';
import MagicFrame from './MagicFrame';

/**
 * OnboardingLayer - Renders the onboarding UI components
 *
 * This component must be rendered inside OnboardingProvider
 * and handles:
 * - The OnboardingWizard modal
 * - The SmartGhostCursor for autopilot animations
 * - The MagicFrame glow effect during autopilot
 * - Backdrop blur during autopilot to keep user focused
 */
export default function OnboardingLayer() {
  const { cursorTarget, cursorLabel, isCursorClicking, isTourActive, isWizardOpen, isAutopilotInModal } = useOnboarding();

  // Show magic frame when autopilot is running (tour active but wizard closed)
  const isAutopilotRunning = isTourActive && !isWizardOpen;

  // Show blur only when autopilot has opened a modal (not during cursor movement)
  const showBackdropBlur = isAutopilotRunning && isAutopilotInModal;

  return (
    <>
      {/* Backdrop blur - only shows after autopilot opens a modal */}
      <AnimatePresence>
        {showBackdropBlur && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[9997] bg-slate-900/40 backdrop-blur-[2px] pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Magic Frame - glowing border during autopilot (above blur) */}
      <MagicFrame isVisible={isAutopilotRunning} />

      {/* AI Demo Explanation Overlay - shows when autopilot is running */}
      <AnimatePresence>
        {isAutopilotRunning && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none"
          >
            <div className="bg-white px-6 py-3 rounded-2xl shadow-xl border border-indigo-100 flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-indigo-600" />
              </div>
              <span className="font-medium text-slate-800">מצב הדגמה - צפה ב-AI מוסיף עבורך</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wizard Modal */}
      <OnboardingWizard />

      {/* Ghost Cursor - only show when tour is active and wizard is closed */}
      {isAutopilotRunning && cursorTarget && (
        <SmartGhostCursor
          x={cursorTarget.x}
          y={cursorTarget.y}
          label={cursorLabel}
          isClicking={isCursorClicking}
          isVisible={true}
        />
      )}
    </>
  );
}
