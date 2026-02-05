'use client';

import { motion, AnimatePresence } from 'framer-motion';
import UnlockOverlay from './UnlockOverlay';
import CalculatorTabs from './CalculatorTabs';

interface LockedCalculatorsGridProps {
  isUnlocked: boolean;
  onInviteSent: () => void;
  pendingInvites?: number;
}

export default function LockedCalculatorsGrid({ isUnlocked, onInviteSent, pendingInvites = 0 }: LockedCalculatorsGridProps) {
  return (
    <div className="relative">
      {/* Unlock Overlay - positioned at top when locked */}
      <AnimatePresence>
        {!isUnlocked && (
          <UnlockOverlay onInviteSent={onInviteSent} pendingInvites={pendingInvites} />
        )}
      </AnimatePresence>

      {/* Calculators with Tabs Interface */}
      <motion.div
        initial={false}
        animate={{
          filter: isUnlocked ? 'blur(0px)' : 'blur(6px)',
        }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={!isUnlocked ? 'pointer-events-none select-none' : ''}
      >
        <CalculatorTabs />
      </motion.div>
    </div>
  );
}
