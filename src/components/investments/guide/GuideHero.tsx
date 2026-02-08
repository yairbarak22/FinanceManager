'use client';

import { motion } from 'framer-motion';
import { Clock, ChevronDown } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface GuideHeroProps {
  currentStep: number;
  totalSteps: number;
  onScrollToContent: () => void;
}

// ============================================================================
// Step Labels
// ============================================================================

const stepLabels = [
  'רקע בסיסי',
  'למה זה עובד?',
  'ההלכה',
  'הפרקטיקה',
  'לפעולה',
];

// ============================================================================
// Component
// ============================================================================

export default function GuideHero({ currentStep, totalSteps, onScrollToContent }: GuideHeroProps) {
  return (
    <div className="space-y-8">
      {/* Hero Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-4 pt-4"
      >
        <h1 className="text-2xl lg:text-3xl font-bold text-[#303150] leading-tight">
          המסלול השקט לחתונות הילדים
        </h1>
        <p className="text-sm lg:text-base text-[#7E7F90] max-w-lg mx-auto leading-relaxed">
          מדריך מעשי להשקעה פסיבית ב-20 שנה.
          <br />
          בלי להבין בגרפים, בלי להמר, ובכשרות מלאה.
        </p>
        <div className="flex items-center justify-center gap-2 text-xs text-[#0DBACC] font-medium">
          <Clock className="w-4 h-4" />
          <span>5 דקות קריאה ששוות 300,000 ש״ח</span>
        </div>
      </motion.div>

      {/* Progress Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="bg-white rounded-3xl p-4 lg:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
      >
        {/* Step indicators */}
        <div className="flex items-center gap-2 lg:gap-3">
          {stepLabels.map((label, index) => {
            const stepNum = index + 1;
            const isActive = currentStep >= stepNum;
            const isCurrent = currentStep === stepNum;

            return (
              <div key={stepNum} className="flex-1 space-y-1.5">
                {/* Bar */}
                <div className="h-1.5 rounded-full bg-[#F7F7F8] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: isActive ? '100%' : '0%' }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className={`h-full rounded-full ${
                      isCurrent
                        ? 'bg-[#0DBACC]'
                        : isActive
                          ? 'bg-[#B4F1F1]'
                          : 'bg-[#F7F7F8]'
                    }`}
                  />
                </div>
                {/* Label */}
                <p className={`text-[10px] lg:text-xs text-center font-medium ${
                  isCurrent
                    ? 'text-[#0DBACC]'
                    : isActive
                      ? 'text-[#7E7F90]'
                      : 'text-[#BDBDCB]'
                }`}>
                  {label}
                </p>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Scroll prompt */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        onClick={onScrollToContent}
        className="flex flex-col items-center gap-1 mx-auto text-[#BDBDCB] hover:text-[#7E7F90] transition-colors"
        aria-label="גלול למטה"
      >
        <span className="text-xs">גלול כדי להתחיל</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </motion.button>
    </div>
  );
}

