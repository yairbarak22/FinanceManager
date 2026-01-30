'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Bot, SkipForward, Check } from 'lucide-react';
import { useOnboarding } from '@/context/OnboardingContext';
import { useAutopilot } from '@/hooks/useAutopilot';
import OnboardingWizard from './OnboardingWizard';
import SmartGhostCursor from './SmartGhostCursor';
import MagicFrame from './MagicFrame';
import AddToHomeScreenModal from '../modals/AddToHomeScreenModal';

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
  const { cursorTarget, cursorLabel, isCursorClicking, isTourActive, isWizardOpen, isAutopilotInModal, skipAutopilotAndAdd, showSuccessNotification, successNotificationMessage, isAddToHomeScreenModalOpen, closeAddToHomeScreenModal } = useOnboarding();
  const { abortAutopilot } = useAutopilot();

  // Show magic frame when autopilot is running (tour active but wizard closed)
  const isAutopilotRunning = isTourActive && !isWizardOpen;

  // Show blur only when autopilot has opened a modal (not during cursor movement)
  const showBackdropBlur = isAutopilotRunning && isAutopilotInModal;

  return (
    <>
      {/* Success Notification - shows above everything */}
      <AnimatePresence>
        {showSuccessNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-[10000] pointer-events-none"
          >
            <div className="bg-[#0DBACC] text-white px-6 py-3 rounded-xl shadow-xl flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Check className="w-5 h-5" />
              </div>
              <span className="font-medium text-sm">{successNotificationMessage}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop blur - only shows after autopilot opens a modal */}
      <AnimatePresence>
        {showBackdropBlur && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[9997] bg-black/40 backdrop-blur-[2px] pointer-events-none"
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
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999]"
          >
            <div className="bg-white px-6 py-4 rounded-3xl shadow-xl border border-[#F7F7F8]">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-[#C1DDFF] rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-[#69ADFF]" />
                </div>
                <div>
                  <p className="font-medium text-[#303150]">מצב הדגמה</p>
                  <p className="text-sm text-[#7E7F90]">אל תיגע בכלום - צפה ב-AI מוסיף עבורך</p>
                  <p className="text-xs text-[#BDBDCB] mt-1">כך תדע להוסיף בעצמך בפעם הבאה</p>
                </div>
              </div>
              <button
                onClick={() => {
                  abortAutopilot(); // Stop the running autopilot first
                  skipAutopilotAndAdd(); // Then add and move to next step
                }}
                className="w-full mt-2 px-4 py-2 text-sm font-medium text-[#7E7F90] bg-[#F7F7F8] hover:bg-[#E8E8ED] rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <SkipForward className="w-4 h-4" />
                דלג והוסף ישירות
              </button>
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

      {/* Add to Home Screen Modal - shows after onboarding completion */}
      <AddToHomeScreenModal
        isOpen={isAddToHomeScreenModalOpen}
        onClose={closeAddToHomeScreenModal}
      />
    </>
  );
}
