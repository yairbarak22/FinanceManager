'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { TrendingUp, Plus, Loader2, ArrowLeft, ArrowRight, Target, Sliders, Sparkles, ChevronsDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  calculateMonthlyContribution,
  calculateProjectionWithInterest,
  calculateMonthlyContributionWithInterest,
  yearsToMonths,
} from '@/lib/goalCalculations';
import Card from '@/components/ui/Card';
import GoalCreationInfoModal from './GoalCreationInfoModal';
import GoalSimulatorIdentity from './GoalSimulatorIdentity';
import GoalSimulatorParams from './GoalSimulatorParams';
import GoalSimulatorResults from './GoalSimulatorResults';
import { useAnalytics } from '@/hooks/useAnalytics';

const STEPS = [
  { id: 1, label: 'היעד שלך', icon: Target, subtitle: 'בחר שם וקטגוריה ליעד' },
  { id: 2, label: 'פרטים', icon: Sliders, subtitle: 'הגדר סכומים וטווח זמן' },
  { id: 3, label: 'תוצאה', icon: Sparkles, subtitle: 'צפה בתוצאות וצור את היעד' },
] as const;

interface GoalSimulatorProps {
  onCreateGoal: (goal: {
    name: string;
    targetAmount: number;
    currentAmount: number;
    deadline: string;
    category: string;
    icon: string;
    investInPortfolio?: boolean;
    expectedInterestRate?: number;
  }) => Promise<void> | void;
  isCreating?: boolean;
  onSuccess?: () => void;
}

export default function GoalSimulator({ onCreateGoal, isCreating, onSuccess }: GoalSimulatorProps) {
  const analytics = useAnalytics();
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward

  // Identity state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('saving');
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Params state
  const [targetAmount, setTargetAmount] = useState(200000);
  const [currentAmount, setCurrentAmount] = useState(0);
  const [years, setYears] = useState(5);
  const [months, setMonths] = useState(60);
  const [timeUnit, setTimeUnit] = useState<'years' | 'months'>('years');
  const [investInPortfolio, setInvestInPortfolio] = useState(false);
  const [expectedInterestRate, setExpectedInterestRate] = useState(8);

  // Info modal state
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Derived calculations
  const deadline = useMemo(() => {
    const date = new Date();
    if (timeUnit === 'months') {
      date.setMonth(date.getMonth() + months);
    } else {
      date.setFullYear(date.getFullYear() + years);
    }
    return date.toISOString();
  }, [years, months, timeUnit]);

  const effectiveMonths = useMemo(() => {
    return timeUnit === 'months' ? months : yearsToMonths(years);
  }, [timeUnit, months, years]);

  const monthlyContribution = useMemo(() => {
    if (investInPortfolio && expectedInterestRate > 0) {
      return calculateMonthlyContributionWithInterest(
        targetAmount, currentAmount, expectedInterestRate, effectiveMonths
      );
    }
    return calculateMonthlyContribution(targetAmount, currentAmount, deadline);
  }, [targetAmount, currentAmount, deadline, effectiveMonths, investInPortfolio, expectedInterestRate]);

  const monthlyContributionWithoutInterest = useMemo(() => {
    return calculateMonthlyContribution(targetAmount, currentAmount, deadline);
  }, [targetAmount, currentAmount, deadline]);

  const projectionData = useMemo(() => {
    const data = calculateProjectionWithInterest(
      currentAmount, monthlyContribution,
      Math.min(effectiveMonths, 60),
      investInPortfolio ? expectedInterestRate : 0
    );
    const step = Math.max(1, Math.floor(data.length / 12));
    return data.filter((_, i) => i % step === 0 || i === data.length - 1);
  }, [currentAmount, monthlyContribution, effectiveMonths, investInPortfolio, expectedInterestRate]);

  const monthlySavings = useMemo(() => {
    if (!investInPortfolio) return 0;
    return Math.max(0, monthlyContributionWithoutInterest - monthlyContribution);
  }, [monthlyContributionWithoutInterest, monthlyContribution, investInPortfolio]);

  // Step validation
  const isStep1Valid = name.trim() && (category !== 'custom' || customCategory.trim());
  const isStepValid = useCallback((step: number) => {
    if (step === 1) return !!isStep1Valid;
    return true; // Steps 2 & 3 always valid (have defaults)
  }, [isStep1Valid]);

  // Handlers
  const handleCategorySelect = (catId: string) => {
    setCategory(catId);
    if (catId === 'custom') {
      setShowCustomInput(true);
    } else {
      setShowCustomInput(false);
      setCustomCategory('');
    }
  };

  const handleTimeUnitChange = (unit: 'years' | 'months') => {
    if (unit !== timeUnit) {
      setTimeUnit(unit);
      if (unit === 'months') {
        setMonths(years * 12);
      } else {
        setYears(Math.round(months / 12) || 1);
      }
    }
  };

  const goNext = () => {
    if (currentStep < 3 && isStepValid(currentStep)) {
      setDirection(1);
      setCurrentStep(s => s + 1);
    }
  };

  const goBack = () => {
    if (currentStep > 1) {
      setDirection(-1);
      setCurrentStep(s => s - 1);
    }
  };

  const goToStep = (step: number) => {
    // Allow going back freely, forward only if current is valid
    if (step < currentStep) {
      setDirection(-1);
      setCurrentStep(step);
    } else if (step > currentStep && isStepValid(currentStep)) {
      setDirection(1);
      setCurrentStep(step);
    }
  };

  const handleSubmit = () => {
    if (!isStep1Valid) return;
    analytics.trackGoalSimulatorUsed(targetAmount, effectiveMonths, investInPortfolio ? expectedInterestRate : 0);
    analytics.trackGoalFormOpened('simulator');
    setShowInfoModal(true);
  };

  const handleConfirmCreate = async () => {
    const finalCategory = category === 'custom' && customCategory.trim()
      ? customCategory.trim()
      : category;

    try {
      await onCreateGoal({
        name: name.trim(),
        targetAmount,
        currentAmount,
        deadline,
        category: finalCategory,
        icon: category === 'custom' ? 'custom' : category,
        investInPortfolio,
        expectedInterestRate: investInPortfolio ? expectedInterestRate : undefined,
      });

      analytics.trackGoalCreated(
        name.trim(), finalCategory, targetAmount,
        currentAmount, deadline, investInPortfolio,
      );

      // Reset form
      setShowInfoModal(false);
      setCurrentStep(1);
      setName('');
      setTargetAmount(200000);
      setCurrentAmount(0);
      setYears(5);
      setMonths(60);
      setTimeUnit('years');
      setCategory('saving');
      setCustomCategory('');
      setShowCustomInput(false);
      setInvestInPortfolio(false);
      setExpectedInterestRate(8);

      onSuccess?.();
    } catch (error) {
      console.error('Error creating goal:', error);
    }
  };

  // Animation variants for step transitions
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 60 : -60,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -60 : 60,
      opacity: 0,
    }),
  };

  // Scroll indicator logic
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollHint, setShowScrollHint] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) { setShowScrollHint(false); return; }
    const hasMore = el.scrollHeight - el.scrollTop - el.clientHeight > 12;
    setShowScrollHint(hasMore);
  }, []);

  useEffect(() => {
    checkScroll();
  }, [currentStep, checkScroll]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    // Also observe children changes via MutationObserver
    const mo = new MutationObserver(checkScroll);
    mo.observe(el, { childList: true, subtree: true, attributes: true });
    return () => { ro.disconnect(); mo.disconnect(); };
  }, [checkScroll]);

  return (
    <Card className="p-0 overflow-hidden h-full lg:max-h-[600px] flex flex-col">
      {/* Header with gradient top bar */}
      <div
        className="px-6 pt-6 pb-5 lg:px-8 lg:pt-8 flex-shrink-0"
        style={{ borderBottom: '1px solid #F7F7F8' }}
      >
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #C1DDFF 0%, #69ADFF 100%)' }}
          >
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2
              className="text-xl font-bold"
              style={{
                color: '#303150',
                fontFamily: 'var(--font-nunito), system-ui, sans-serif',
              }}
            >
              סימולטור יעדים
            </h2>
            <p style={{ color: '#7E7F90', fontSize: '0.8125rem' }}>
              {STEPS[currentStep - 1].subtitle}
            </p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-0">
          {STEPS.map((step, idx) => {
            const StepIcon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            const isClickable = step.id < currentStep || (step.id > currentStep && isStepValid(currentStep));

            return (
              <div key={step.id} className="flex items-center">
                {/* Step circle */}
                <button
                  type="button"
                  onClick={() => goToStep(step.id)}
                  disabled={!isClickable && !isActive}
                  className="flex flex-col items-center gap-1.5 transition-all duration-200 group"
                  style={{ minWidth: '72px' }}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300"
                    style={{
                      background: isActive
                        ? 'linear-gradient(135deg, #69ADFF 0%, #0DBACC 100%)'
                        : isCompleted
                          ? '#0DBACC'
                          : '#F7F7F8',
                      boxShadow: isActive ? '0 4px 12px rgba(105, 173, 255, 0.35)' : 'none',
                      transform: isActive ? 'scale(1.1)' : 'scale(1)',
                    }}
                  >
                    <StepIcon
                      className="w-4 h-4"
                      style={{ color: isActive || isCompleted ? 'white' : '#BDBDCB' }}
                    />
                  </div>
                  <span
                    className="text-xs font-medium transition-colors duration-200"
                    style={{
                      color: isActive ? '#303150' : isCompleted ? '#0DBACC' : '#BDBDCB',
                    }}
                  >
                    {step.label}
                  </span>
                </button>

                {/* Connector line */}
                {idx < STEPS.length - 1 && (
                  <div
                    className="h-[2px] transition-all duration-500 mx-1"
                    style={{
                      width: '40px',
                      backgroundColor: isCompleted ? '#0DBACC' : '#E8E8ED',
                      marginBottom: '20px',
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content — flex-1 to fill available height */}
      <div className="relative flex-1 min-h-0">
        <div
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="px-6 py-6 lg:px-8 h-full overflow-y-auto"
        >
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {currentStep === 1 && (
                <GoalSimulatorIdentity
                  name={name}
                  onNameChange={setName}
                  category={category}
                  onCategoryChange={handleCategorySelect}
                  customCategory={customCategory}
                  onCustomCategoryChange={setCustomCategory}
                  showCustomInput={showCustomInput}
                />
              )}

              {currentStep === 2 && (
                <GoalSimulatorParams
                  targetAmount={targetAmount}
                  onTargetAmountChange={setTargetAmount}
                  currentAmount={currentAmount}
                  onCurrentAmountChange={setCurrentAmount}
                  years={years}
                  months={months}
                  timeUnit={timeUnit}
                  onYearsChange={setYears}
                  onMonthsChange={setMonths}
                  onTimeUnitChange={handleTimeUnitChange}
                  investInPortfolio={investInPortfolio}
                  onInvestChange={setInvestInPortfolio}
                  expectedInterestRate={expectedInterestRate}
                  onRateChange={setExpectedInterestRate}
                />
              )}

              {currentStep === 3 && (
                <GoalSimulatorResults
                  monthlyContribution={monthlyContribution}
                  effectiveMonths={effectiveMonths}
                  investInPortfolio={investInPortfolio}
                  expectedInterestRate={expectedInterestRate}
                  monthlySavings={monthlySavings}
                  projectionData={projectionData}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Scroll indicator */}
        <AnimatePresence>
          {showScrollHint && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute bottom-0 left-0 right-0 pointer-events-none flex flex-col items-center pb-1"
              style={{
                background: 'linear-gradient(to top, rgba(255,255,255,0.95) 40%, rgba(255,255,255,0) 100%)',
                height: '48px',
              }}
            >
              <motion.div
                animate={{ y: [0, 5, 0] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                className="mt-auto"
              >
                <ChevronsDown className="w-5 h-5" style={{ color: '#BDBDCB' }} strokeWidth={2} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation Footer */}
      <div
        className="px-6 py-4 lg:px-8 flex items-center gap-3 flex-shrink-0"
        style={{ borderTop: '1px solid #F7F7F8' }}
      >
        {/* Back button */}
        {currentStep > 1 ? (
          <button
            type="button"
            onClick={goBack}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 hover:bg-[#F7F7F8] active:scale-[0.97]"
            style={{
              color: '#7E7F90',
              fontFamily: 'var(--font-nunito), system-ui, sans-serif',
            }}
          >
            <ArrowRight className="w-4 h-4" />
            חזרה
          </button>
        ) : (
          <div />
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Forward / Submit */}
        {currentStep < 3 ? (
          <button
            type="button"
            onClick={goNext}
            disabled={!isStepValid(currentStep)}
            className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl font-medium transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
            style={{
              backgroundColor: isStepValid(currentStep) ? '#69ADFF' : '#BDBDCB',
              color: 'white',
              fontFamily: 'var(--font-nunito), system-ui, sans-serif',
            }}
          >
            הבא
            <ArrowLeft className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isStep1Valid || isCreating}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
            style={{
              background: (isStep1Valid && !isCreating) ? 'linear-gradient(135deg, #0DBACC 0%, #69ADFF 100%)' : '#BDBDCB',
              color: 'white',
              fontFamily: 'var(--font-nunito), system-ui, sans-serif',
            }}
          >
            {isCreating ? (
              <>
                יוצר יעד...
                <Loader2 className="w-4 h-4 animate-spin" />
              </>
            ) : (
              <>
                הוסף יעד
                <Plus className="w-4 h-4" />
              </>
            )}
          </button>
        )}
      </div>

      {/* Info Modal */}
      <GoalCreationInfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        onConfirm={handleConfirmCreate}
        goalName={name.trim()}
        monthlyContribution={monthlyContribution}
        isCreating={isCreating}
      />
    </Card>
  );
}
