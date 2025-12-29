'use client';

import { motion, AnimatePresence } from 'framer-motion';
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
