'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Wallet,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Wand2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Sparkles,
  Check,
  Bot,
  Upload,
  Play,
} from 'lucide-react';
import { useOnboarding } from '@/context/OnboardingContext';
import { useAutopilot } from '@/hooks/useAutopilot';
import { onboardingSteps, OnboardingStep, StepField } from './stepsConfig';

/**
 * Icon mapping for steps
 */
const stepIcons = {
  user: User,
  wallet: Wallet,
  'credit-card': CreditCard,
  'trending-up': TrendingUp,
  'trending-down': TrendingDown,
};

/**
 * Styled Select Component - matching site design
 */
interface StyledSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}

function StyledSelect({ value, onChange, options, placeholder = 'בחר...' }: StyledSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm
          flex items-center justify-between gap-2
          hover:border-indigo-300 hover:bg-slate-50
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
          transition-all duration-200
          ${!selectedOption ? 'text-slate-400' : 'text-slate-900'}
        `}
      >
        <span className="flex-1 text-right truncate">
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform flex-shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-2 w-full bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden"
          >
            <div className="max-h-48 overflow-y-auto py-1">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`
                    w-full px-4 py-2.5 text-sm flex items-center justify-between gap-2
                    hover:bg-indigo-50 transition-colors text-right
                    ${value === option.value ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700'}
                  `}
                >
                  <span className="flex-1">{option.label}</span>
                  {value === option.value && (
                    <Check className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * OnboardingWizard - Apple-style onboarding modal
 */
export default function OnboardingWizard() {
  const {
    isWizardOpen,
    wizardData,
    currentStepIndex,
    setWizardData,
    setCurrentStepIndex,
    startAutopilot,
    closeWizard,
    endTour,
  } = useOnboarding();

  const { runAutopilotSequence, runFeatureDemo } = useAutopilot();

  const [direction, setDirection] = useState(0);

  // Track last saved profile data to detect changes
  const [lastSavedProfileData, setLastSavedProfileData] = useState<Record<string, string> | null>(null);

  const currentStep = onboardingSteps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === onboardingSteps.length - 1;

  const handleFieldChange = useCallback(
    (key: string, value: string) => {
      setWizardData({ ...wizardData, [key]: value });
    },
    [wizardData, setWizardData]
  );

  const goToNextStep = useCallback(() => {
    if (!isLastStep) {
      setDirection(1);
      setCurrentStepIndex(currentStepIndex + 1);
    }
  }, [currentStepIndex, isLastStep, setCurrentStepIndex]);

  const goToPreviousStep = useCallback(() => {
    if (!isFirstStep) {
      setDirection(-1);
      setCurrentStepIndex(currentStepIndex - 1);
    }
  }, [currentStepIndex, isFirstStep, setCurrentStepIndex]);

  /**
   * Check if profile data has changed from last saved
   */
  const hasProfileDataChanged = useMemo((): boolean => {
    // If never saved, any data is a change
    if (!lastSavedProfileData) return true;

    const profileFields = ['ageRange', 'employmentType', 'militaryStatus'];
    for (const key of profileFields) {
      if (wizardData[key] !== lastSavedProfileData[key]) {
        return true;
      }
    }
    return false;
  }, [wizardData, lastSavedProfileData]);

  /**
   * Check if all required fields for current step are filled
   */
  const areRequiredFieldsFilled = useCallback((): boolean => {
    const step = onboardingSteps[currentStepIndex];
    if (!step) return false;

    // For features step, no validation needed
    if (step.id === 'features') return true;

    // For profile step, also check if data has changed
    if (step.id === 'profile' && !hasProfileDataChanged) {
      return false;
    }

    // Get visible fields based on step logic
    const visibleFields = step.id === 'liabilities'
      ? step.fields.filter((field) => {
          if (field.key === 'liabilityType') return true;
          const hasLiability = wizardData.liabilityType === 'mortgage' || wizardData.liabilityType === 'loan';
          return hasLiability;
        })
      : step.fields;

    // Check all required visible fields
    for (const field of visibleFields) {
      // Skip feature-demos type fields
      if (field.type === 'feature-demos') continue;

      if (field.required) {
        const value = wizardData[field.key];
        if (!value || value.trim() === '') {
          return false;
        }
      }
    }

    // Special case for liabilities - if "none" is selected, that's valid
    if (step.id === 'liabilities' && wizardData.liabilityType === 'none') {
      return true;
    }

    return true;
  }, [currentStepIndex, wizardData, hasProfileDataChanged]);

  const handleShowMe = useCallback(async () => {
    console.log('[Onboarding] Starting autopilot for step:', currentStep.id);
    startAutopilot(currentStep.id, wizardData);
    await new Promise(resolve => setTimeout(resolve, 100));
    const result = await runAutopilotSequence(currentStep.id, wizardData);
    console.log('[Onboarding] Autopilot result:', result);

    // Save profile data after successful autopilot for profile step
    if (currentStep.id === 'profile' && result.success) {
      setLastSavedProfileData({
        ageRange: wizardData.ageRange || '',
        employmentType: wizardData.employmentType || '',
        militaryStatus: wizardData.militaryStatus || '',
      });
    }
  }, [currentStep, wizardData, startAutopilot, runAutopilotSequence]);

  /**
   * Handle direct add - save data via API without simulation
   */
  const handleAddDirectly = useCallback(async () => {
    const stepId = currentStep.id;
    
    try {
      if (stepId === 'profile') {
        await fetch('/api/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ageRange: wizardData.ageRange,
            employmentType: wizardData.employmentType,
            militaryStatus: wizardData.militaryStatus,
          }),
        });
        setLastSavedProfileData({
          ageRange: wizardData.ageRange || '',
          employmentType: wizardData.employmentType || '',
          militaryStatus: wizardData.militaryStatus || '',
        });
      } else if (stepId === 'assets') {
        await fetch('/api/assets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-CSRF-Protection': '1' },
          body: JSON.stringify({
            name: wizardData.assetName,
            category: wizardData.assetCategory,
            value: parseFloat((wizardData.assetValue || '0').replace(/,/g, '')),
          }),
        });
      } else if (stepId === 'liabilities') {
        // Skip if user selected "none"
        if (wizardData.liabilityType !== 'none') {
          await fetch('/api/liabilities', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-Protection': '1' },
            body: JSON.stringify({
              name: wizardData.liabilityType === 'mortgage' ? 'משכנתא' : 'הלוואה',
              type: wizardData.liabilityType,
              totalAmount: parseFloat((wizardData.liabilityAmount || '0').replace(/,/g, '')),
              monthlyPayment: 0, // Will be calculated
              interestRate: parseFloat(wizardData.liabilityInterest || '0'),
              loanTermMonths: parseInt(wizardData.liabilityTerm || '0'),
            }),
          });
        }
      } else if (stepId === 'income') {
        await fetch('/api/recurring', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-CSRF-Protection': '1' },
          body: JSON.stringify({
            type: 'income',
            name: wizardData.incomeName,
            category: wizardData.incomeCategory,
            amount: parseFloat((wizardData.incomeAmount || '0').replace(/,/g, '')),
          }),
        });
      } else if (stepId === 'expenses') {
        await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-CSRF-Protection': '1' },
          body: JSON.stringify({
            type: 'expense',
            description: wizardData.expenseName,
            category: wizardData.expenseCategory,
            amount: parseFloat((wizardData.expenseAmount || '0').replace(/,/g, '')),
            date: new Date().toISOString(),
          }),
        });
      }
      
      console.log('[Onboarding] Direct add successful for step:', stepId);
      goToNextStep();
    } catch (error) {
      console.error('[Onboarding] Direct add failed:', error);
    }
  }, [currentStep, wizardData, goToNextStep, setLastSavedProfileData]);

  /**
   * Handle feature demo button click
   */
  const handleFeatureDemoClick = useCallback(async (demoId: string) => {
    console.log('[Onboarding] Starting feature demo:', demoId);
    // Close the wizard first so user can see the demo
    closeWizard();
    await new Promise(resolve => setTimeout(resolve, 300));
    const result = await runFeatureDemo(demoId);
    console.log('[Onboarding] Feature demo result:', result);
  }, [closeWizard, runFeatureDemo]);

  /**
   * Get icon component for feature demos
   */
  const getFeatureIcon = (iconName: string) => {
    switch (iconName) {
      case 'sparkles': return Sparkles;
      case 'bot': return Bot;
      case 'upload': return Upload;
      default: return Sparkles;
    }
  };

  /**
   * Render a form field
   */
  const renderField = (field: StepField) => {
    const value = wizardData[field.key] || '';

    // Feature demo card
    if (field.type === 'feature-demos') {
      const FeatureIcon = getFeatureIcon(field.featureIcon || 'sparkles');
      return (
        <div
          key={field.key}
          className="bg-slate-50 rounded-xl p-4 border border-slate-100 hover:border-indigo-200 transition-all"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <FeatureIcon className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-slate-900 text-sm">{field.label}</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{field.helperText}</p>
              <button
                onClick={() => field.demoId && handleFeatureDemoClick(field.demoId)}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Play className="w-3.5 h-3.5" />
                הראה לי
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (field.type === 'select') {
      return (
        <div key={field.key} className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            {field.label}
            {field.required && <span className="text-rose-500 mr-1">*</span>}
          </label>
          <StyledSelect
            value={value}
            onChange={(v) => handleFieldChange(field.key, v)}
            options={field.options || []}
            placeholder="בחר..."
          />
        </div>
      );
    }

    if (field.type === 'currency' || field.type === 'number') {
      return (
        <div key={field.key} className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            {field.label}
            {field.required && <span className="text-rose-500 mr-1">*</span>}
          </label>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              value={value}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/[^\d,]/g, '');
                handleFieldChange(field.key, cleaned);
              }}
              placeholder={field.placeholder}
              className={`w-full py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm
                         hover:border-indigo-300 hover:bg-slate-50
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                         transition-all duration-200 text-left
                         ${field.type === 'currency' ? 'pl-10 pr-4' : 'px-4'}`}
              dir="ltr"
            />
            {field.type === 'currency' && (
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium pointer-events-none">
                ₪
              </span>
            )}
          </div>
          {field.helperText && (
            <p className="text-xs text-slate-500">{field.helperText}</p>
          )}
        </div>
      );
    }

    // Default text input
    return (
      <div key={field.key} className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">
          {field.label}
          {field.required && <span className="text-rose-500 mr-1">*</span>}
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => handleFieldChange(field.key, e.target.value)}
          placeholder={field.placeholder}
          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm
                     hover:border-indigo-300 hover:bg-slate-50
                     focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                     transition-all duration-200"
          dir="rtl"
        />
        {field.helperText && (
          <p className="text-xs text-slate-500">{field.helperText}</p>
        )}
      </div>
    );
  };

  /**
   * Filter fields based on conditional logic (for liabilities step)
   */
  const getVisibleFields = (step: OnboardingStep): StepField[] => {
    if (step.id !== 'liabilities') {
      return step.fields;
    }

    // For liabilities, show detail fields only if user selected mortgage or loan
    const hasLiability = wizardData.liabilityType === 'mortgage' || wizardData.liabilityType === 'loan';

    return step.fields.filter((field) => {
      // Always show the type selector
      if (field.key === 'liabilityType') {
        return true;
      }
      // Show amount, interest, and term only if user has a liability
      return hasLiability;
    });
  };

  /**
   * Render step content
   */
  const renderStepContent = (step: OnboardingStep) => {
    const Icon = stepIcons[step.icon];
    const visibleFields = getVisibleFields(step);

    return (
      <motion.div
        key={step.id}
        initial={{ opacity: 0, x: direction * 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: direction * -50 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="space-y-6"
      >
        {/* Step Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-2xl flex items-center justify-center shadow-sm">
            <Icon className="w-8 h-8 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">{step.title}</h2>
          <p className="text-slate-600 text-sm max-w-sm mx-auto leading-relaxed">
            {step.description}
          </p>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">{visibleFields.map(renderField)}</div>
      </motion.div>
    );
  };

  if (!isWizardOpen) return null;

  return (
    <AnimatePresence>
      {isWizardOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm"
            onClick={endTour}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="relative w-full max-w-md h-[600px] bg-white rounded-3xl shadow-2xl border border-slate-100 pointer-events-auto flex flex-col overflow-hidden"
              dir="rtl"
            >
              {/* Close Button */}
              <button
                onClick={endTour}
                className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all z-10"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-8 pt-12">
                <AnimatePresence mode="wait" initial={false}>
                  {renderStepContent(currentStep)}
                </AnimatePresence>
              </div>

              {/* Footer - Fixed at bottom */}
              <div className="flex-shrink-0 px-8 pb-6 pt-4 border-t border-slate-100 space-y-3">
                {/* Two action buttons (hidden on features step) */}
                {currentStep.id !== 'features' && (
                  <div className="space-y-2">
                    {/* Primary: Add directly */}
                    <motion.button
                      onClick={handleAddDirectly}
                      disabled={!areRequiredFieldsFilled()}
                      whileHover={areRequiredFieldsFilled() ? { scale: 1.02 } : {}}
                      whileTap={areRequiredFieldsFilled() ? { scale: 0.98 } : {}}
                      className={`w-full py-4 px-6 font-semibold rounded-2xl
                                 flex items-center justify-center gap-2 transition-all duration-200
                                 ${areRequiredFieldsFilled()
                                   ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 cursor-pointer'
                                   : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                 }`}
                    >
                      <Check className="w-5 h-5" />
                      <span>לחץ כאן כדי להוסיף עכשיו</span>
                    </motion.button>

                    {/* Secondary: AI demo */}
                    <motion.button
                      onClick={handleShowMe}
                      disabled={!areRequiredFieldsFilled()}
                      whileHover={areRequiredFieldsFilled() ? { scale: 1.01 } : {}}
                      whileTap={areRequiredFieldsFilled() ? { scale: 0.99 } : {}}
                      className={`w-full py-3 px-6 font-medium rounded-2xl
                                 flex items-center justify-center gap-2 transition-all duration-200 border
                                 ${areRequiredFieldsFilled()
                                   ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-indigo-300 cursor-pointer'
                                   : 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
                                 }`}
                    >
                      <Bot className="w-4 h-4" />
                      <span>תן ל-AI להראות לך</span>
                    </motion.button>
                  </div>
                )}

                {/* Finish Button - only on features step */}
                {currentStep.id === 'features' && (
                  <motion.button
                    onClick={endTour}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold rounded-2xl
                               shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30
                               flex items-center justify-center gap-2 transition-all duration-200"
                  >
                    <Check className="w-5 h-5" />
                    <span>סיימתי! בואו נתחיל</span>
                    <Sparkles className="w-4 h-4 opacity-70" />
                  </motion.button>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between">
                  {/* Back Button */}
                  <button
                    onClick={goToPreviousStep}
                    disabled={isFirstStep}
                    className={`flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-xl transition-all
                      ${
                        isFirstStep
                          ? 'text-slate-300 cursor-not-allowed'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                  >
                    <ChevronRight className="w-4 h-4" />
                    הקודם
                  </button>

                  {/* Progress Dots */}
                  <div className="flex items-center gap-2">
                    {onboardingSteps.map((_, index) => (
                      <motion.div
                        key={index}
                        initial={false}
                        animate={{
                          scale: index === currentStepIndex ? 1.2 : 1,
                          backgroundColor:
                            index === currentStepIndex
                              ? '#6366f1'
                              : index < currentStepIndex
                              ? '#a5b4fc'
                              : '#e2e8f0',
                        }}
                        className="w-2 h-2 rounded-full"
                      />
                    ))}
                  </div>

                  {/* Next/Skip Button */}
                  <button
                    onClick={isLastStep ? endTour : goToNextStep}
                    className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
                  >
                    {isLastStep ? 'סיום' : 'אוסיף מאוחר יותר'}
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
