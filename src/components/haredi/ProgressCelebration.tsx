'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProgressStep } from '@/hooks/useHarediProgress';

// ============================================
// Confetti particle config
// ============================================

const CONFETTI_COLORS = ['#0DBACC', '#69ADFF', '#F18AB5', '#E9A800'];
const PARTICLE_COUNT = 25;

interface Particle {
  id: number;
  color: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

function generateParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    x: (Math.random() - 0.5) * 300,
    y: -(Math.random() * 200 + 50),
    rotation: Math.random() * 720 - 360,
    scale: Math.random() * 0.6 + 0.4,
  }));
}

// ============================================
// Confetti component
// ============================================

function Confetti({ isActive }: { isActive: boolean }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (isActive) {
      setParticles(generateParticles());
    }
  }, [isActive]);

  return (
    <AnimatePresence>
      {isActive &&
        particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ x: 0, y: 0, opacity: 1, scale: 0, rotate: 0 }}
            animate={{
              x: p.x,
              y: p.y,
              opacity: [1, 1, 0],
              scale: p.scale,
              rotate: p.rotation,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 2,
              ease: 'easeOut',
            }}
            className="absolute pointer-events-none"
            style={{
              width: 8,
              height: 8,
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              backgroundColor: p.color,
              top: '50%',
              left: '50%',
            }}
          />
        ))}
    </AnimatePresence>
  );
}

// ============================================
// Success checkmark
// ============================================

function SuccessCheckmark({ isActive }: { isActive: boolean }) {
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.2, 1], opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <svg width="48" height="48" viewBox="0 0 48 48">
            <motion.circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke="#0DBACC"
              strokeWidth="3"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
            <motion.path
              d="M14 24 L21 31 L34 18"
              fill="none"
              stroke="#0DBACC"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.4, delay: 0.3, ease: 'easeOut' }}
            />
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================
// Toast notification
// ============================================

function CelebrationToast({
  message,
  isVisible,
}: {
  message: string;
  isVisible: boolean;
}) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[10000]
            px-5 py-3 rounded-xl shadow-xl
            text-white text-sm font-medium
            pointer-events-none"
          style={{ backgroundColor: 'rgba(13, 186, 204, 0.95)' }}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================
// Main celebration component
// ============================================

interface ProgressCelebrationProps {
  justCompletedStep: ProgressStep | null;
  allCompleted: boolean;
  onCelebrationEnd: () => void;
}

export default function ProgressCelebration({
  justCompletedStep,
  allCompleted,
  onCelebrationEnd,
}: ProgressCelebrationProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCheckmark, setShowCheckmark] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (!justCompletedStep) return;

    // Start celebration sequence
    setShowConfetti(true);
    setShowCheckmark(true);

    const message = allCompleted
      ? 'מעולה! השלמת את כל השלבים'
      : `כל הכבוד! השלמת את "${justCompletedStep.title}"`;
    setToastMessage(message);

    // Show toast after a brief delay
    const toastTimer = setTimeout(() => setShowToast(true), 300);

    // Hide confetti after 2s
    const confettiTimer = setTimeout(() => setShowConfetti(false), 2000);

    // Hide checkmark after 1.5s
    const checkTimer = setTimeout(() => setShowCheckmark(false), 1500);

    // Hide toast after 3s
    const toastHideTimer = setTimeout(() => setShowToast(false), 3300);

    // Signal celebration end
    const endTimer = setTimeout(() => {
      onCelebrationEnd();
    }, allCompleted ? 5000 : 3500);

    return () => {
      clearTimeout(toastTimer);
      clearTimeout(confettiTimer);
      clearTimeout(checkTimer);
      clearTimeout(toastHideTimer);
      clearTimeout(endTimer);
    };
  }, [justCompletedStep, allCompleted, onCelebrationEnd]);

  if (!justCompletedStep) return null;

  return (
    <>
      {/* Confetti burst from the dock area */}
      <div className="relative overflow-visible pointer-events-none">
        <Confetti isActive={showConfetti} />
        <SuccessCheckmark isActive={showCheckmark} />
      </div>

      {/* Toast notification at top of screen */}
      <CelebrationToast message={toastMessage} isVisible={showToast} />
    </>
  );
}

