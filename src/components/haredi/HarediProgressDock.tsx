'use client';

import { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, Check, Lock, ArrowLeft } from 'lucide-react';
import { useHarediProgress, StepStatus } from '@/hooks/useHarediProgress';
import { useModal } from '@/context/ModalContext';
import ProgressCelebration from './ProgressCelebration';
import ProgressTooltip from './ProgressTooltip';

// ============================================
// Circular Progress SVG
// ============================================

function CircularProgress({
  percentage,
  size = 40,
  strokeWidth = 4,
  isPulsing = false,
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  isPulsing?: boolean;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <motion.div
      animate={isPulsing ? { scale: [1, 1.08, 1] } : { scale: 1 }}
      transition={isPulsing ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : {}}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E8E8ED"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#0DBACC"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 800ms ease-out' }}
        />
      </svg>
      {/* Percentage text */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <span className="text-[11px] font-bold text-[#303150]">
          {percentage}%
        </span>
      </div>
    </motion.div>
  );
}

// ============================================
// Status badge
// ============================================

function StatusBadge({ status }: { status: StepStatus }) {
  const config: Record<StepStatus, { label: string; bg: string; text: string }> = {
    completed: { label: 'הושלם', bg: 'bg-[#0DBACC]/10', text: 'text-[#0DBACC]' },
    current: { label: 'בתהליך', bg: 'bg-[#69ADFF]/10', text: 'text-[#69ADFF]' },
    pending: { label: 'ממתין', bg: 'bg-[#E8E8ED]/40', text: 'text-[#7E7F90]' },
    locked: { label: 'נעול', bg: 'bg-[#E8E8ED]/40', text: 'text-[#BDBDCB]' },
  };

  const { label, bg, text } = config[status];

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${bg} ${text}`}>
      {label}
    </span>
  );
}

// ============================================
// Step icon with colored background
// ============================================

function StepIcon({ step }: { step: { status: StepStatus; icon: React.ComponentType<{ className?: string; strokeWidth?: number }> } }) {
  const Icon = step.icon;

  const bgColors: Record<StepStatus, string> = {
    completed: 'bg-[#0DBACC]/10',
    current: 'bg-[#69ADFF]/10',
    pending: 'bg-[#E8E8ED]/40',
    locked: 'bg-[#E8E8ED]/40',
  };

  const iconColors: Record<StepStatus, string> = {
    completed: 'text-[#0DBACC]',
    current: 'text-[#69ADFF]',
    pending: 'text-[#7E7F90]',
    locked: 'text-[#BDBDCB]',
  };

  return (
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${bgColors[step.status]}`}>
      {step.status === 'completed' ? (
        <Check className="w-4 h-4 text-[#0DBACC]" strokeWidth={2.5} />
      ) : step.status === 'locked' ? (
        <Lock className="w-4 h-4 text-[#BDBDCB]" strokeWidth={1.75} />
      ) : (
        <Icon className={`w-4 h-4 ${iconColors[step.status]}`} strokeWidth={1.75} />
      )}
    </div>
  );
}

// ============================================
// Main HarediProgressDock
// ============================================

export default function HarediProgressDock() {
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

  const { modalState, openModal } = useModal();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isHarediUser, setIsHarediUser] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(0);
  const [pendingQuickAdd, setPendingQuickAdd] = useState(false);
  const dockRef = useRef<HTMLDivElement>(null);

  // ---- Detect mobile/desktop and read sidebar width ----
  useLayoutEffect(() => {
    const updateLayout = () => {
      setIsMobile(window.innerWidth < 768);
      const sidebar = document.querySelector('aside[aria-label="ניווט ראשי"]');
      if (sidebar && window.innerWidth >= 1024) {
        setSidebarWidth(sidebar.getBoundingClientRect().width);
      } else {
        setSidebarWidth(0);
      }
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);

    // Watch for sidebar collapse/expand animation to re-calc width
    const observer = new MutationObserver(updateLayout);
    const sidebar = document.querySelector('aside[aria-label="ניווט ראשי"]');
    if (sidebar) {
      observer.observe(sidebar, {
        attributes: true,
        attributeFilter: ['style', 'class'],
        childList: false,
        subtree: false,
      });
    }

    return () => {
      window.removeEventListener('resize', updateLayout);
      observer.disconnect();
    };
  }, []);

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

  // ---- Smart scroll visibility (same pattern as QuickAddFab) ----
  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;

    if (currentScrollY > lastScrollY && currentScrollY > 100) {
      setIsVisible(false);
    } else {
      setIsVisible(true);
    }

    setLastScrollY(currentScrollY);
  }, [lastScrollY]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // ---- Hide when modal is open ----
  const isModalCurrentlyOpen = modalState.type !== null;

  // ---- Auto-expand on celebration ----
  useEffect(() => {
    if (justCompletedStep) {
      setIsExpanded(true);
    }
  }, [justCompletedStep]);

  // ---- Handle step click: specific action per step ----
  const handleStepClick = useCallback((stepId: number) => {
    setIsExpanded(false);
    switch (stepId) {
      case 1:
        // Step 1: Navigate to dashboard first if needed, then open quick-add modal
        if (pathname === '/dashboard') {
          openModal('quick-add');
        } else {
          setPendingQuickAdd(true);
          router.push('/dashboard');
        }
        break;
      case 2:
        // Step 2: Navigate to goals page
        router.push('/goals');
        break;
      case 3:
        // Step 3: Navigate to investment guide
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

  // ---- Should we render at all? ----
  if (!isHarediUser || !hasSeenOnboarding) {
    return null;
  }

  const shouldShow = isVisible && !isModalCurrentlyOpen && !isLoading;

  return (
    <>
      {/* Celebration overlay */}
      <ProgressCelebration
        justCompletedStep={justCompletedStep}
        allCompleted={completedStepsCount === totalStepsCount}
        onCelebrationEnd={clearCelebration}
      />

      <AnimatePresence>
        {shouldShow && (
          <div
            className="fixed z-50 left-0 right-0 pointer-events-none px-4"
            style={{
              bottom: isMobile ? 'calc(4rem + env(safe-area-inset-bottom))' : '1.5rem',
              paddingRight: sidebarWidth > 0 ? `calc(${sidebarWidth}px + 1rem)` : undefined,
            }}
          >
            <motion.div
              ref={dockRef}
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="mx-auto max-w-[600px] pointer-events-auto
                rounded-3xl bg-white/95 backdrop-blur-sm overflow-hidden
                border border-[#F7F7F8]"
              style={{
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
              }}
            >
              {/* ======== Collapsed bar (div, not button, to avoid nesting) ======== */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setIsExpanded(!isExpanded)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsExpanded(!isExpanded); }}
                className="w-full flex items-center gap-3 px-4 py-3.5 cursor-pointer
                  hover:bg-[#F7F7F8]/50 transition-colors duration-200 select-none"
              >
                {/* Progress circle */}
                <div className="relative flex-shrink-0">
                  <CircularProgress
                    percentage={progressPercentage}
                    size={40}
                    strokeWidth={4}
                    isPulsing={!!justCompletedStep}
                  />
                </div>

                {/* Current step info */}
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

                {/* Chevron */}
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex-shrink-0"
                >
                  <ChevronUp className="w-4 h-4 text-[#BDBDCB]" />
                </motion.div>
              </div>

              {/* ======== Expanded panel ======== */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{
                      height: { type: 'spring', stiffness: 300, damping: 30 },
                      opacity: { duration: 0.2 },
                    }}
                    className="overflow-hidden"
                  >
                    {/* Divider */}
                    <div className="mx-4 border-t border-[#F7F7F8]" />

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
                              {/* Icon */}
                              <StepIcon step={step} />

                              {/* Content */}
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

                              {/* Action arrow for all non-locked steps */}
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

                    {/* Footer */}
                    <div className="px-4 pb-3">
                      <button
                        type="button"
                        onClick={() => setIsExpanded(false)}
                        className="w-full py-2 text-[12px] text-[#7E7F90]
                          hover:text-[#303150] transition-colors duration-200"
                      >
                        סגור
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
