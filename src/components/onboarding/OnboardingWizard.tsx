'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
  Loader2,
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
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState({ top: 0, left: 0, width: 0 });

  const selectedOption = options.find((opt) => opt.value === value);

  // Track if component is mounted (for Portal)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate dropdown position when opened
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownStyle({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [isOpen]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        buttonRef.current && !buttonRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full px-4 py-3 bg-white border border-[#E8E8ED] rounded-xl text-sm
          flex items-center justify-between gap-2
          hover:border-[#69ADFF] hover:bg-[#F7F7F8]
          focus:outline-none focus:ring-2 focus:ring-[#69ADFF] focus:border-transparent
          transition-all duration-200
          ${!selectedOption ? 'text-[#BDBDCB]' : 'text-[#303150]'}
        `}
      >
        <span className="flex-1 text-right truncate">
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-[#7E7F90] transition-transform flex-shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown - rendered via Portal to escape overflow clipping */}
      {mounted && createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'fixed',
                top: dropdownStyle.top,
                left: dropdownStyle.left,
                width: dropdownStyle.width,
              }}
              className="z-[12000] bg-white rounded-3xl shadow-xl border border-[#F7F7F8] overflow-hidden"
              dir="rtl"
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
                      hover:bg-[#F7F7F8] transition-colors text-right
                      ${value === option.value ? 'bg-[#F7F7F8] text-[#69ADFF]' : 'text-[#303150]'}
                    `}
                  >
                    <span className="flex-1">{option.label}</span>
                    {value === option.value && (
                      <Check className="w-4 h-4 text-[#69ADFF] flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
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

  // Success notification state
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Loading state for save button
  const [isSaving, setIsSaving] = useState(false);

  // Refs for scrolling
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const fieldRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const currentStep = onboardingSteps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === onboardingSteps.length - 1;

  // Scroll to top when step changes and clear field refs
  useEffect(() => {
    if (contentScrollRef.current) {
      contentScrollRef.current.scrollTop = 0;
    }
    // Clear field refs when step changes
    fieldRefs.current.clear();
  }, [currentStepIndex]);

  /**
   * Filter fields based on conditional logic (for liabilities step)
   */
  const getVisibleFields = useCallback((step: OnboardingStep): StepField[] => {
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
  }, [wizardData]);

  const handleFieldChange = useCallback(
    (key: string, value: string) => {
      setWizardData({ ...wizardData, [key]: value });
      
      // Auto-scroll to next field if current field was filled
      if (value && value.trim() !== '') {
        const visibleFields = getVisibleFields(currentStep);
        const currentIndex = visibleFields.findIndex(f => f.key === key);
        
        // Find next visible field that is not a feature-demos type
        if (currentIndex >= 0 && currentIndex < visibleFields.length - 1) {
          const nextField = visibleFields.slice(currentIndex + 1).find(f => f.type !== 'feature-demos');
          
          if (nextField) {
            const nextFieldElement = fieldRefs.current.get(nextField.key);
            if (nextFieldElement && contentScrollRef.current) {
              // Use setTimeout to ensure DOM has updated
              setTimeout(() => {
                nextFieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 100);
            }
          }
        }
      }
    },
    [wizardData, setWizardData, currentStep, getVisibleFields]
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

    const profileFields = ['ageRange', 'employmentType'];
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
      });
    }
  }, [currentStep, wizardData, startAutopilot, runAutopilotSequence]);

  /**
   * Handle direct add - save data via API without simulation
   */
  const handleAddDirectly = useCallback(async () => {
    const stepId = currentStep.id;
    setIsSaving(true);
    
    try {
      let response: Response | null = null;
      
      const showSuccessNotification = (message: string) => {
        setSuccessMessage(message);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
        // Dispatch event to trigger dashboard data refresh
        window.dispatchEvent(new CustomEvent('onboarding-data-added'));
      };

      if (stepId === 'profile') {
        response = await fetch('/api/profile', {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'X-CSRF-Protection': '1',
          },
          body: JSON.stringify({
            ageRange: wizardData.ageRange || '26-35',
            employmentType: wizardData.employmentType || 'employee',
            hasChildren: false,
            childrenCount: 0,
          }),
        });
        
        if (response.ok) {
          setLastSavedProfileData({
            ageRange: wizardData.ageRange || '26-35',
            employmentType: wizardData.employmentType || 'employee',
          });
          showSuccessNotification('הפרופיל עודכן בהצלחה!');
        } else {
          console.error('[Onboarding] Profile update failed:', response.status);
        }
      } else if (stepId === 'assets') {
        response = await fetch('/api/assets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-CSRF-Protection': '1' },
          body: JSON.stringify({
            name: wizardData.assetName || 'נכס חדש',
            category: wizardData.assetCategory || 'savings',
            value: parseFloat((wizardData.assetValue || '10000').replace(/,/g, '')),
          }),
        });
        
        if (response.ok) {
          showSuccessNotification('הנכס נוסף בהצלחה!');
        } else {
          console.error('[Onboarding] Asset add failed:', response.status);
        }
      } else if (stepId === 'liabilities') {
        // Skip if user selected "none"
        if (wizardData.liabilityType !== 'none') {
          response = await fetch('/api/liabilities', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-Protection': '1' },
            body: JSON.stringify({
              name: wizardData.liabilityType === 'mortgage' ? 'משכנתא' : 'הלוואה',
              type: wizardData.liabilityType || 'loan',
              totalAmount: parseFloat((wizardData.liabilityAmount || '100000').replace(/,/g, '')),
              monthlyPayment: 1000,
              interestRate: parseFloat(wizardData.liabilityInterest || '5'),
              loanTermMonths: parseInt(wizardData.liabilityTerm || '120'),
            }),
          });
          
          if (response.ok) {
            showSuccessNotification('ההתחייבות נוספה בהצלחה!');
          } else {
            console.error('[Onboarding] Liability add failed:', response.status);
          }
        } else {
          showSuccessNotification('דילגת על הוספת התחייבויות');
        }
      } else if (stepId === 'income') {
        response = await fetch('/api/recurring', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-CSRF-Protection': '1' },
          body: JSON.stringify({
            type: 'income',
            name: wizardData.incomeName || 'הכנסה חודשית',
            category: wizardData.incomeCategory || 'salary',
            amount: parseFloat((wizardData.incomeAmount || '10000').replace(/,/g, '')),
          }),
        });
        
        if (response.ok) {
          showSuccessNotification('ההכנסה נוספה בהצלחה!');
        } else {
          console.error('[Onboarding] Income add failed:', response.status);
        }
      } else if (stepId === 'expenses') {
        response = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-CSRF-Protection': '1' },
          body: JSON.stringify({
            type: 'expense',
            description: wizardData.expenseName || 'הוצאה',
            category: wizardData.expenseCategory || 'other',
            amount: parseFloat((wizardData.expenseAmount || '100').replace(/,/g, '')),
            date: new Date().toISOString(),
          }),
        });
        
        if (response.ok) {
          showSuccessNotification('ההוצאה נוספה בהצלחה!');
        } else {
          console.error('[Onboarding] Expense add failed:', response.status);
        }
      }
      
      console.log('[Onboarding] Direct add completed for step:', stepId);
    } catch (error) {
      console.error('[Onboarding] Direct add error:', error);
    } finally {
      setIsSaving(false);
    }
    
    // Wait for success notification to show, then continue
    await new Promise(resolve => setTimeout(resolve, 1500));
    goToNextStep();
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
          className="bg-[#F7F7F8] rounded-xl p-4 border border-[#F7F7F8] hover:border-[#69ADFF] transition-all"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-[#C1DDFF] rounded-xl flex items-center justify-center flex-shrink-0">
              <FeatureIcon className="w-5 h-5 text-[#69ADFF]" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-[#303150] text-sm">{field.label}</h4>
              <p className="text-xs text-[#7E7F90] mt-1 leading-relaxed">{field.helperText}</p>
              <button
                onClick={() => field.demoId && handleFeatureDemoClick(field.demoId)}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#69ADFF] text-white text-xs font-medium rounded-lg hover:bg-[#5A9EE6] transition-colors"
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
        <div 
          key={field.key} 
          ref={(el) => { if (el) fieldRefs.current.set(field.key, el); }}
          className="space-y-2"
        >
          <label className="block text-sm font-medium text-[#303150]">
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
        <div 
          key={field.key}
          ref={(el) => { if (el) fieldRefs.current.set(field.key, el); }}
          className="space-y-2"
        >
          <label className="block text-sm font-medium text-[#303150]">
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
              className={`w-full py-3 bg-white border border-[#E8E8ED] rounded-xl text-[#303150] text-sm
                         hover:border-[#69ADFF] hover:bg-[#F7F7F8]
                         focus:outline-none focus:ring-2 focus:ring-[#69ADFF] focus:border-transparent
                         transition-all duration-200 text-left
                         ${field.type === 'currency' ? 'pl-10 pr-4' : 'px-4'}`}
              dir="ltr"
            />
            {field.type === 'currency' && (
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#BDBDCB] text-sm font-medium pointer-events-none">
                ₪
              </span>
            )}
          </div>
          {field.helperText && (
            <p className="text-xs text-[#7E7F90]">{field.helperText}</p>
          )}
        </div>
      );
    }

    // Default text input
    return (
      <div 
        key={field.key}
        ref={(el) => { if (el) fieldRefs.current.set(field.key, el); }}
        className="space-y-2"
      >
        <label className="block text-sm font-medium text-[#303150]">
          {field.label}
          {field.required && <span className="text-rose-500 mr-1">*</span>}
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => handleFieldChange(field.key, e.target.value)}
          placeholder={field.placeholder}
          className="w-full px-4 py-3 bg-white border border-[#E8E8ED] rounded-xl text-[#303150] text-sm
                     hover:border-[#69ADFF] hover:bg-[#F7F7F8]
                     focus:outline-none focus:ring-2 focus:ring-[#69ADFF] focus:border-transparent
                     transition-all duration-200"
          dir="rtl"
        />
        {field.helperText && (
          <p className="text-xs text-[#7E7F90]">{field.helperText}</p>
        )}
      </div>
    );
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
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-[#C1DDFF] to-[#69ADFF] rounded-3xl flex items-center justify-center shadow-sm">
            <Icon className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-[#303150]">{step.title}</h2>
          <p className="text-[#7E7F90] text-sm max-w-sm mx-auto leading-relaxed">
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
    <>
      {/* Success Notification - shows above everything */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] pointer-events-none"
          >
            <div className="bg-emerald-500 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Check className="w-5 h-5" />
              </div>
              <span className="font-medium text-sm">{successMessage}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isWizardOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
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
              className="relative w-full max-w-md h-[600px] bg-white rounded-3xl shadow-2xl border border-[#F7F7F8] pointer-events-auto flex flex-col overflow-hidden"
              dir="rtl"
            >
              {/* Close Button */}
              <button
                onClick={endTour}
                className="absolute top-4 left-4 p-2 text-[#7E7F90] hover:text-[#303150] hover:bg-[#F7F7F8] rounded-xl transition-all z-10"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Content - Scrollable */}
              <div ref={contentScrollRef} className="flex-1 overflow-y-auto p-8 pt-12">
                <AnimatePresence mode="wait" initial={false}>
                  {renderStepContent(currentStep)}
                </AnimatePresence>
              </div>

              {/* Footer - Fixed at bottom */}
              <div className="flex-shrink-0 px-8 pb-6 pt-4 border-t border-[#F7F7F8] space-y-3">
                {/* Add button (hidden on features step) */}
                {currentStep.id !== 'features' && (
                  <motion.button
                    onClick={handleAddDirectly}
                    disabled={!areRequiredFieldsFilled() || isSaving}
                    whileHover={areRequiredFieldsFilled() && !isSaving ? { scale: 1.02 } : {}}
                    whileTap={areRequiredFieldsFilled() && !isSaving ? { scale: 0.98 } : {}}
                    className={`w-full py-4 px-6 font-semibold rounded-xl
                               flex items-center justify-center gap-2 transition-all duration-200
                               ${areRequiredFieldsFilled() && !isSaving
                                 ? 'bg-gradient-to-r from-[#69ADFF] to-[#74ACEF] text-white shadow-lg shadow-[#69ADFF]/25 hover:shadow-xl hover:shadow-[#69ADFF]/30 cursor-pointer'
                                 : 'bg-[#F7F7F8] text-[#BDBDCB] cursor-not-allowed'
                               }`}
                  >
                    <span>לחץ כאן כדי להוסיף עכשיו</span>
                    {isSaving ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Check className="w-5 h-5" />
                    )}
                  </motion.button>
                )}

                {/* Finish Button - only on features step */}
                {currentStep.id === 'features' && (
                  <motion.button
                    onClick={endTour}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 px-6 bg-gradient-to-r from-[#0DBACC] to-[#0DBACC] text-white font-semibold rounded-xl
                               shadow-lg shadow-[#0DBACC]/25 hover:shadow-xl hover:shadow-[#0DBACC]/30
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
                          ? 'text-[#BDBDCB] cursor-not-allowed'
                          : 'text-[#7E7F90] hover:text-[#303150] hover:bg-[#F7F7F8]'
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
                              ? '#69ADFF'
                              : index < currentStepIndex
                              ? '#0DBACC'
                              : '#BDBDCB',
                        }}
                        className="w-2 h-2 rounded-full"
                      />
                    ))}
                  </div>

                  {/* Next/Skip Button */}
                  <button
                    onClick={isLastStep ? endTour : goToNextStep}
                    className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-[#7E7F90] hover:text-[#303150] hover:bg-[#F7F7F8] rounded-xl transition-all"
                  >
                    {isLastStep ? 'סיום' : 'דלג'}
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    </>
  );
}
