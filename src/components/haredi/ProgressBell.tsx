'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, ArrowLeft } from 'lucide-react';
import { useHarediProgress } from '@/hooks/useHarediProgress';
import { useModal } from '@/context/ModalContext';
import ProgressCelebration from './ProgressCelebration';
import ProgressTooltip from './ProgressTooltip';
import { CircularProgress, StatusBadge, StepIcon } from './ProgressShared';

// ============================================
// Bell swing animation — eye-catching loop
// ============================================

const bellSwingVariants = {
  idle: { rotate: 0, scale: 1 },
  swing: {
    rotate: [0, 14, -12, 8, -6, 3, 0],
    scale: [1, 1.12, 1.08, 1.1, 1.05, 1.02, 1],
    transition: {
      duration: 1.2,
      ease: 'easeInOut',
      repeat: Infinity,
      repeatDelay: 5,
    },
  },
};

const dotPulseVariants = {
  pulse: {
    scale: [1, 1.4, 1],
    opacity: [1, 0.7, 1],
    transition: {
      duration: 1.8,
      ease: 'easeInOut',
      repeat: Infinity,
    },
  },
};

const DROPDOWN_WIDTH = 320; // w-80 = 20rem = 320px

export default function ProgressBell() {
  const router = useRouter();
  const pathname = usePathname();
  const {
    steps,
    currentStep,
    progressPercentage,
    completedStepsCount,
    totalStepsCount,
    isLoading,
    justCompletedStep,
    clearCelebration,
  } = useHarediProgress();

  const { openModal } = useModal();

  const [isOpen, setIsOpen] = useState(false);
  const [isHarediUser, setIsHarediUser] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [pendingQuickAdd, setPendingQuickAdd] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);
  const bellRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ---- Check if user is Haredi and has completed onboarding ----
  useEffect(() => {
    const checkUser = async () => {
      try {
        const res = await fetch('/api/user/onboarding');
        if (res.ok) {
          const data = await res.json();
          setIsHarediUser(data.signupSource === 'prog');
          setHasSeenOnboarding(data.hasSeenOnboarding === true);
        }
      } catch {
        // silently ignore
      }
    };
    checkUser();
  }, []);

  // ---- Listen for onboarding-completed event ----
  useEffect(() => {
    const handleOnboardingCompleted = () => {
      setHasSeenOnboarding(true);
      setIsHarediUser(true);
    };

    window.addEventListener('onboarding-completed', handleOnboardingCompleted);
    return () => window.removeEventListener('onboarding-completed', handleOnboardingCompleted);
  }, []);

  // ---- Re-check onboarding status on navigation ----
  useEffect(() => {
    if (hasSeenOnboarding) return;

    const recheck = async () => {
      try {
        const res = await fetch('/api/user/onboarding');
        if (res.ok) {
          const data = await res.json();
          if (data.signupSource === 'prog' && data.hasSeenOnboarding === true) {
            setIsHarediUser(true);
            setHasSeenOnboarding(true);
          }
        }
      } catch {
        // silently ignore
      }
    };
    recheck();
  }, [pathname, hasSeenOnboarding]);

  // ---- Position dropdown below bell, clamped to viewport ----
  const updateDropdownPosition = useCallback(() => {
    if (!bellRef.current) return;
    const rect = bellRef.current.getBoundingClientRect();

    // Align right edge of dropdown with right edge of bell
    let left = rect.right - DROPDOWN_WIDTH;

    // Clamp: don't overflow left edge
    if (left < 8) left = 8;
    // Clamp: don't overflow right edge
    if (left + DROPDOWN_WIDTH > window.innerWidth - 8) {
      left = window.innerWidth - DROPDOWN_WIDTH - 8;
    }

    setDropdownPos({
      top: rect.bottom + 8,
      left,
    });
  }, []);

  // ---- Toggle dropdown ----
  const toggleDropdown = useCallback(() => {
    if (!isOpen) {
      updateDropdownPosition();
    }
    setIsOpen((prev) => !prev);
  }, [isOpen, updateDropdownPosition]);

  // ---- Close on outside click ----
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        bellRef.current && !bellRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // ---- Close on Escape key ----
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // ---- Reposition on window resize while open ----
  useEffect(() => {
    if (!isOpen) return;
    const handleResize = () => updateDropdownPosition();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen, updateDropdownPosition]);

  // ---- Auto-open on celebration ----
  useEffect(() => {
    if (justCompletedStep) {
      updateDropdownPosition();
      setIsOpen(true);
      const timer = setTimeout(() => setIsOpen(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [justCompletedStep, updateDropdownPosition]);

  // ---- Handle step click ----
  const handleStepClick = useCallback((stepId: number) => {
    setIsOpen(false);
    switch (stepId) {
      case 1:
        if (pathname === '/dashboard') {
          openModal('quick-add');
        } else {
          setPendingQuickAdd(true);
          router.push('/dashboard');
        }
        break;
      case 2:
        router.push('/goals');
        break;
      case 3:
        router.push('/investments/guide');
        break;
    }
  }, [openModal, router, pathname]);

  // ---- Open quick-add modal after navigating to dashboard ----
  useEffect(() => {
    if (pathname === '/dashboard' && pendingQuickAdd) {
      openModal('quick-add');
      setPendingQuickAdd(false);
    }
  }, [pathname, pendingQuickAdd, openModal]);

  // ---- Don't render for non-Haredi users ----
  if (!isHarediUser || !hasSeenOnboarding) {
    return null;
  }

  const isIncomplete = progressPercentage < 100;
  const shouldAnimate = isIncomplete && !isOpen;

  return (
    <>
      {/* Celebration overlay */}
      <ProgressCelebration
        justCompletedStep={justCompletedStep}
        allCompleted={completedStepsCount === totalStepsCount}
        onCelebrationEnd={clearCelebration}
      />

      {/* Bell button */}
      <button
        ref={bellRef}
        type="button"
        onClick={toggleDropdown}
        className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-50"
        aria-label="מסלול התקדמות"
        aria-expanded={isOpen}
      >
        <motion.div
          variants={bellSwingVariants}
          animate={shouldAnimate ? 'swing' : 'idle'}
          style={{ originX: 0.5, originY: 0.15 }}
        >
          <Bell className="w-[18px] h-[18px]" strokeWidth={1.75} />
        </motion.div>
        {/* Pulsing red dot when incomplete */}
        {isIncomplete && (
          <motion.span
            variants={dotPulseVariants}
            animate="pulse"
            className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"
          />
        )}
      </button>

      {/* Dropdown via portal */}
      {typeof window !== 'undefined' && createPortal(
        <AnimatePresence>
          {isOpen && dropdownPos && (
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="fixed z-[100] w-80 bg-white rounded-2xl border border-slate-100 overflow-hidden"
              style={{
                top: dropdownPos.top,
                left: dropdownPos.left,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
              }}
            >
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#F7F7F8]">
                <div className="relative flex-shrink-0">
                  <CircularProgress
                    percentage={progressPercentage}
                    size={40}
                    strokeWidth={4}
                    isPulsing={!!justCompletedStep}
                  />
                </div>
                <div className="flex-1 text-right min-w-0">
                  <p className="text-[13px] font-semibold text-[#303150] truncate">
                    {currentStep
                      ? currentStep.shortDescription
                      : completedStepsCount === totalStepsCount
                        ? 'כל השלבים הושלמו!'
                        : 'מסלול ההתקדמות'}
                  </p>
                  <p className="text-[11px] text-[#7E7F90]">
                    {completedStepsCount} מתוך {totalStepsCount} שלבים
                  </p>
                </div>
              </div>

              {/* Steps list */}
              <div className="px-4 py-3 space-y-1">
                {steps.map((step, index) => (
                  <div key={step.id}>
                    <ProgressTooltip
                      content={step.description}
                      timeEstimate={step.timeEstimate}
                    >
                      <motion.div
                        role="button"
                        tabIndex={0}
                        onClick={() => step.status !== 'locked' && handleStepClick(step.id)}
                        onKeyDown={(e) => {
                          if ((e.key === 'Enter' || e.key === ' ') && step.status !== 'locked') {
                            handleStepClick(step.id);
                          }
                        }}
                        whileHover={step.status !== 'locked' ? { scale: 1.02 } : {}}
                        whileTap={step.status !== 'locked' ? { scale: 0.98 } : {}}
                        transition={{ duration: 0.2 }}
                        className={`flex items-center gap-3 p-2.5 rounded-xl
                          transition-all duration-200 select-none
                          ${step.status === 'locked'
                            ? 'opacity-50 cursor-not-allowed'
                            : 'cursor-pointer hover:bg-[#F7F7F8]/50'}
                          ${step.status === 'current' ? 'bg-[#69ADFF]/5' : ''}`}
                      >
                        <StepIcon step={step} />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-[13px] font-medium truncate
                              ${step.status === 'locked' ? 'text-[#BDBDCB]' : 'text-[#303150]'}`}>
                              {step.title}
                            </p>
                            <StatusBadge status={step.status} />
                          </div>
                          <p className="text-[11px] text-[#7E7F90] mt-0.5">
                            {step.shortDescription} · {step.timeEstimate}
                          </p>
                        </div>

                        {step.status !== 'locked' && (
                          <div className="flex-shrink-0 w-7 h-7 rounded-lg
                            bg-[#69ADFF]/10 flex items-center justify-center">
                            <ArrowLeft className="w-3.5 h-3.5 text-[#69ADFF]" strokeWidth={2} />
                          </div>
                        )}
                      </motion.div>
                    </ProgressTooltip>

                    {/* Connecting line between steps */}
                    {index < steps.length - 1 && (
                      <div className="flex justify-start mr-[1.3rem] pr-px">
                        <div
                          className={`w-[2px] h-2 rounded-full
                            ${steps[index + 1].status === 'locked'
                              ? 'bg-[#E8E8ED]'
                              : 'bg-[#0DBACC]/30'
                            }`}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
