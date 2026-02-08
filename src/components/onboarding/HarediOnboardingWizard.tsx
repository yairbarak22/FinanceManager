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
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Sparkles,
  Check,
  Target,
  Loader2,
  CircleCheck,
  Wand2,
  Play,
} from 'lucide-react';
import { useOnboarding } from '@/context/OnboardingContext';
import { useCategories } from '@/hooks/useCategories';
import {
  assetCategories as defaultAssetCategories,
  incomeCategories as defaultIncomeCategories,
  expenseCategories as defaultExpenseCategories,
  liabilityTypes as defaultLiabilityTypes,
  CategoryInfo,
} from '@/lib/categories';
import { OnboardingStep, StepField } from './stepsConfig';
import { harediOnboardingSteps } from './harediStepsConfig';
import { trackMixpanelEvent } from '@/lib/mixpanel';

/**
 * Convert CategoryInfo array to options format for select dropdowns
 */
function categoriesToOptions(categories: CategoryInfo[]): { value: string; label: string }[] {
  return categories.map(cat => ({
    value: cat.id,
    label: cat.nameHe,
  }));
}

/**
 * Icon mapping for steps
 */
const stepIcons = {
  user: User,
  wallet: Wallet,
  'credit-card': CreditCard,
  'trending-up': TrendingUp,
  'trending-down': TrendingDown,
  'sparkles': Sparkles,
  'target': Target,
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
 * HarediOnboardingWizard - Apple-style onboarding modal for Haredi users
 * Supports step types: info (non-closable), form, tasks
 */
export default function HarediOnboardingWizard() {
  const {
    isWizardOpen,
    wizardData,
    currentStepIndex,
    setWizardData,
    setCurrentStepIndex,
    endTour,
  } = useOnboarding();

  // Get custom categories from hook
  const { getCustomByType } = useCategories();

  // Memoized category options for dropdowns - synchronized with regular modals
  const assetCategoryOptions = useMemo(() => {
    const defaultOptions = categoriesToOptions(defaultAssetCategories);
    const customOptions = categoriesToOptions(getCustomByType('asset'));
    return [...defaultOptions, ...customOptions];
  }, [getCustomByType]);

  const incomeCategoryOptions = useMemo(() => {
    const defaultOptions = categoriesToOptions(defaultIncomeCategories);
    const customOptions = categoriesToOptions(getCustomByType('income'));
    return [...defaultOptions, ...customOptions];
  }, [getCustomByType]);

  const expenseCategoryOptions = useMemo(() => {
    const defaultOptions = categoriesToOptions(defaultExpenseCategories);
    const customOptions = categoriesToOptions(getCustomByType('expense'));
    return [...defaultOptions, ...customOptions];
  }, [getCustomByType]);

  const liabilityTypeOptions = useMemo(() => {
    const defaultOptions = categoriesToOptions(defaultLiabilityTypes);
    const customOptions = categoriesToOptions(getCustomByType('liability'));
    return [...defaultOptions, ...customOptions];
  }, [getCustomByType]);

  /**
   * Get dynamic options for category fields
   */
  const getDynamicOptions = useCallback((fieldKey: string): { value: string; label: string }[] | null => {
    switch (fieldKey) {
      case 'assetCategory':
        return assetCategoryOptions;
      case 'incomeCategory':
        return incomeCategoryOptions;
      case 'expenseCategory':
        return expenseCategoryOptions;
      case 'liabilityType':
        return liabilityTypeOptions;
      default:
        return null;
    }
  }, [assetCategoryOptions, incomeCategoryOptions, expenseCategoryOptions, liabilityTypeOptions]);

  const [direction, setDirection] = useState(0);

  // Success notification state
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Loading state for save button
  const [isSaving, setIsSaving] = useState(false);

  // Loading state for demo data
  const [isLoadingDemoData, setIsLoadingDemoData] = useState(false);

  // Refs for scrolling
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const fieldRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const currentStep = harediOnboardingSteps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === harediOnboardingSteps.length - 1;

  // Whether current step can be closed
  const isClosable = currentStep?.isClosable !== false;

  // Scroll to top when step changes and clear field refs
  useEffect(() => {
    if (contentScrollRef.current) {
      contentScrollRef.current.scrollTop = 0;
    }
    // Clear field refs when step changes
    fieldRefs.current.clear();
    
    // Track step viewed event
    const step = harediOnboardingSteps[currentStepIndex];
    if (step) {
      trackMixpanelEvent('Onboarding Step Viewed', {
        step_id: step.id,
        step_name: step.title,
        step_index: currentStepIndex,
      });
    }
  }, [currentStepIndex]);

  /**
   * Filter fields based on conditional logic
   */
  const getVisibleFields = useCallback((step: OnboardingStep): StepField[] => {
    return step.fields;
  }, []);

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
   * Check if all required fields for current step are filled
   */
  const areRequiredFieldsFilled = useCallback((): boolean => {
    const step = harediOnboardingSteps[currentStepIndex];
    if (!step) return false;

    // Info, choice, and tasks steps have no fields to validate
    if (step.stepType === 'info' || step.stepType === 'choice' || step.stepType === 'tasks') {
      return true;
    }

    // Get visible fields
    const visibleFields = step.fields;

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

    return true;
  }, [currentStepIndex, wizardData]);

  /**
   * Handle direct add - save data via API without simulation
   */
  const handleAddDirectly = useCallback(async () => {
    const stepId = currentStep.id;
    setIsSaving(true);
    
    try {
      const showSuccessNotification = (message: string) => {
        setSuccessMessage(message);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
        // Dispatch event to trigger dashboard data refresh
        window.dispatchEvent(new CustomEvent('onboarding-data-added'));
      };

      if (stepId === 'haredi-asset') {
        const response = await fetch('/api/assets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-CSRF-Protection': '1' },
          body: JSON.stringify({
            name: wizardData.assetName || 'נכס חדש',
            category: wizardData.assetCategory || 'savings_account',
            value: parseFloat((wizardData.assetValue || '10000').replace(/,/g, '')),
          }),
        });
        
        if (response.ok) {
          showSuccessNotification('הנכס נוסף בהצלחה!');
        } else {
          console.error('[HarediOnboarding] Asset add failed:', response.status);
        }
      } else if (stepId === 'haredi-liability') {
        // Get liability name from selected type
        const liabilityType = wizardData.liabilityType || 'loan';
        const liabilityCategory = defaultLiabilityTypes.find(c => c.id === liabilityType);
        const liabilityName = liabilityCategory?.nameHe || 'הלוואה';

        const response = await fetch('/api/liabilities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-CSRF-Protection': '1' },
          body: JSON.stringify({
            name: liabilityName,
            type: liabilityType,
            totalAmount: parseFloat((wizardData.liabilityAmount || '100000').replace(/,/g, '')),
            monthlyPayment: 1000,
            interestRate: parseFloat(wizardData.liabilityInterest || '5'),
            loanTermMonths: parseInt(wizardData.liabilityTerm || '120'),
          }),
        });

        if (response.ok) {
          showSuccessNotification('ההלוואה נוספה בהצלחה!');
        } else {
          console.error('[HarediOnboarding] Liability add failed:', response.status);
        }
      } else if (stepId === 'haredi-income-expense') {
        // Two API calls: income (recurring) + expense (transaction)
        const incomeResponse = await fetch('/api/recurring', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-CSRF-Protection': '1' },
          body: JSON.stringify({
            type: 'income',
            name: wizardData.incomeName || 'הכנסה חודשית',
            category: wizardData.incomeCategory || 'salary',
            amount: parseFloat((wizardData.incomeAmount || '10000').replace(/,/g, '')),
          }),
        });

        const expenseResponse = await fetch('/api/transactions', {
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

        if (incomeResponse.ok && expenseResponse.ok) {
          showSuccessNotification('ההכנסה וההוצאה נוספו בהצלחה!');
        } else {
          if (!incomeResponse.ok) console.error('[HarediOnboarding] Income add failed:', incomeResponse.status);
          if (!expenseResponse.ok) console.error('[HarediOnboarding] Expense add failed:', expenseResponse.status);
          // Show partial success if at least one succeeded
          if (incomeResponse.ok || expenseResponse.ok) {
            showSuccessNotification(incomeResponse.ok ? 'ההכנסה נוספה בהצלחה!' : 'ההוצאה נוספה בהצלחה!');
          }
        }
      } else if (stepId === 'haredi-goal') {
        const response = await fetch('/api/goals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-CSRF-Protection': '1' },
          body: JSON.stringify({
            name: wizardData.goalName || 'יעד חדש',
            targetAmount: parseFloat((wizardData.goalTargetAmount || '100000').replace(/,/g, '')),
            deadline: wizardData.goalDeadline || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            currentAmount: parseFloat((wizardData.goalCurrentAmount || '0').replace(/,/g, '')) || 0,
          }),
        });

        if (response.ok) {
          showSuccessNotification('היעד נוסף בהצלחה!');
        } else {
          console.error('[HarediOnboarding] Goal add failed:', response.status);
        }
      }
      
      console.log('[HarediOnboarding] Direct add completed for step:', stepId);
      
      // Track step completed event
      trackMixpanelEvent('Onboarding Step Completed', {
        step_id: stepId,
        step_name: currentStep.title,
        step_index: currentStepIndex,
        data_entered: true,
      });
    } catch (error) {
      console.error('[HarediOnboarding] Direct add error:', error);
    } finally {
      setIsSaving(false);
    }
    
    // Wait for success notification to show, then continue
    await new Promise(resolve => setTimeout(resolve, 1500));
    goToNextStep();
  }, [currentStep, wizardData, goToNextStep]);

  /**
   * Handle demo data button click - creates sample data for the user
   */
  const handleLoadDemoData = useCallback(async () => {
    setIsLoadingDemoData(true);
    
    try {
      const response = await fetch('/api/onboarding/demo-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Protection': '1',
        },
      });

      if (response.ok) {
        setSuccessMessage('נתוני הדמה נוספו בהצלחה!');
        setShowSuccess(true);
        
        // Dispatch event to trigger dashboard data refresh
        window.dispatchEvent(new CustomEvent('onboarding-data-added'));
        
        // Wait for notification to show, then close wizard
        await new Promise(resolve => setTimeout(resolve, 1500));
        endTour();
      } else {
        console.error('[HarediOnboarding] Failed to load demo data:', response.status);
        setSuccessMessage('שגיאה בטעינת נתוני הדמה');
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
      }
    } catch (error) {
      console.error('[HarediOnboarding] Error loading demo data:', error);
      setSuccessMessage('שגיאה בטעינת נתוני הדמה');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } finally {
      setIsLoadingDemoData(false);
    }
  }, [endTour]);

  /**
   * Render a form field
   */
  const renderField = (field: StepField) => {
    const value = wizardData[field.key] || '';

    if (field.type === 'select') {
      // Use dynamic options for category fields, fallback to field.options for other selects
      const dynamicOptions = getDynamicOptions(field.key);
      const options = dynamicOptions || field.options || [];
      
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
            options={options}
            placeholder="בחר..."
          />
        </div>
      );
    }

    if (field.type === 'date') {
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
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            className="w-full px-4 py-3 bg-white border border-[#E8E8ED] rounded-xl text-[#303150] text-sm
                       hover:border-[#69ADFF] hover:bg-[#F7F7F8]
                       focus:outline-none focus:ring-2 focus:ring-[#69ADFF] focus:border-transparent
                       transition-all duration-200"
          />
          {field.helperText && (
            <p className="text-xs text-[#7E7F90]">{field.helperText}</p>
          )}
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
                const cleaned = e.target.value.replace(/[^\d,.]/g, '');
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
   * Render the INFO step content (non-closable intro)
   */
  const renderInfoStep = (step: OnboardingStep) => {
    const Icon = stepIcons[step.icon as keyof typeof stepIcons] || Sparkles;

    return (
      <motion.div
        key={step.id}
        initial={{ opacity: 0, x: direction * 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: direction * -50 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="space-y-5"
      >
        {/* Step Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-[#C1DDFF] to-[#69ADFF] rounded-3xl flex items-center justify-center shadow-sm">
            <Icon className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-[#303150]">{step.title}</h2>
          <p className="text-[#7E7F90] text-sm max-w-sm mx-auto leading-relaxed">
            {step.description}
          </p>
        </div>

        {/* Info Sections */}
        {step.infoSections && (
          <div className="space-y-4">
            {step.infoSections.map((section, index) => (
              <div
                key={index}
                className="bg-[#F7F7F8] rounded-xl p-4 border border-[#F7F7F8]"
              >
                <h3 className="font-semibold text-[#303150] text-sm mb-2">
                  {section.title}
                </h3>
                <p className="text-xs text-[#7E7F90] leading-relaxed">
                  {section.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    );
  };

  /**
   * Render the CHOICE step content (intro with demo data option)
   * Designed to be clean, focused and visually appealing
   */
  const renderChoiceStep = (step: OnboardingStep) => {
    const Icon = stepIcons[step.icon as keyof typeof stepIcons] || Sparkles;

    return (
      <motion.div
        key={step.id}
        initial={{ opacity: 0, x: direction * 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: direction * -50 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="flex flex-col h-full"
      >
        {/* Header — large icon + title + description */}
        <div className="text-center space-y-4 mb-6">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[#C1DDFF] to-[#69ADFF] rounded-3xl flex items-center justify-center shadow-lg">
            <Icon className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-[#303150]">{step.title}</h2>
          <p className="text-[#7E7F90] text-sm max-w-xs mx-auto leading-relaxed">
            {step.description}
          </p>
        </div>

        {/* Info Sections — compact cards */}
        {step.infoSections && (
          <div className="space-y-2 mb-6">
            {step.infoSections.map((section, index) => (
              <div
                key={index}
                className="flex items-start gap-3 px-4 py-3 bg-[#F7F7F8] rounded-xl"
              >
                <div className="w-6 h-6 bg-[#69ADFF]/15 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 text-[#69ADFF]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#303150] text-[13px]">
                    {section.title}
                  </h3>
                  <p className="text-xs text-[#7E7F90] leading-relaxed mt-0.5">
                    {section.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Spacer to push buttons to bottom */}
        <div className="flex-1" />

        {/* Choice Buttons */}
        <div className="space-y-3 pb-4">
          {/* Manual Data Entry Button — primary */}
          <motion.button
            onClick={goToNextStep}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-[#69ADFF] to-[#74ACEF] text-white font-semibold rounded-xl
                       shadow-md shadow-[#69ADFF]/20 hover:shadow-lg hover:shadow-[#69ADFF]/25
                       flex flex-col items-center gap-1 transition-all duration-200"
          >
            <div className="flex flex-row-reverse items-center gap-2">
              <Wand2 className="w-4 h-4" />
              <span className="text-sm">התחל להזין נתונים</span>
            </div>
            <span className="text-xs opacity-80">תהליך מהיר ופשוט (כ-3 דקות)</span>
          </motion.button>

          {/* Demo Data Button — secondary */}
          <motion.button
            onClick={handleLoadDemoData}
            disabled={isLoadingDemoData}
            whileHover={!isLoadingDemoData ? { scale: 1.01 } : {}}
            whileTap={!isLoadingDemoData ? { scale: 0.99 } : {}}
            className="w-full py-3 px-4 bg-white border border-[#E8E8ED] text-[#303150] font-medium rounded-xl
                       hover:border-[#69ADFF] hover:bg-[#F7F7F8]
                       flex flex-col items-center gap-1 transition-all duration-200"
          >
            <div className="flex flex-row-reverse items-center gap-2">
              {isLoadingDemoData ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              <span className="text-sm">{isLoadingDemoData ? 'טוען נתוני דמה...' : 'התחל עכשיו עם נתוני דמה'}</span>
            </div>
            <span className="text-xs text-[#7E7F90]">ניתן לערוך בהמשך</span>
          </motion.button>
        </div>
      </motion.div>
    );
  };

  /**
   * Render the TASKS step content (checklist)
   */
  const renderTasksStep = (step: OnboardingStep) => {
    const Icon = stepIcons[step.icon as keyof typeof stepIcons] || Sparkles;

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

        {/* Task Checklist */}
        {step.tasks && (
          <div className="space-y-3">
            {step.tasks.map((task, index) => (
              <div
                key={index}
                className="flex items-center gap-3 bg-[#F7F7F8] rounded-xl px-4 py-3 border border-[#F7F7F8]"
              >
                <CircleCheck className="w-5 h-5 text-[#0DBACC] flex-shrink-0" />
                <span className="text-sm text-[#303150]">{task}</span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    );
  };

  /**
   * Render the dual INCOME + EXPENSE form step
   */
  const renderDualFormStep = (step: OnboardingStep) => {
    const Icon = stepIcons[step.icon as keyof typeof stepIcons] || Wallet;
    const fields = step.fields;

    // Split fields into income (first 3) and expense (last 3) groups
    const incomeFields = fields.filter(f => f.key.startsWith('income'));
    const expenseFields = fields.filter(f => f.key.startsWith('expense'));

    return (
      <motion.div
        key={step.id}
        initial={{ opacity: 0, x: direction * 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: direction * -50 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="space-y-5"
      >
        {/* Step Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-[#C1DDFF] to-[#69ADFF] rounded-3xl flex items-center justify-center shadow-sm">
            <Icon className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-[#303150]">{step.title}</h2>
          <p className="text-[#7E7F90] text-sm max-w-sm mx-auto leading-relaxed">
            {step.description}
          </p>
        </div>

        {/* Income Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#0DBACC]/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-[#0DBACC]" />
            </div>
            <h3 className="font-semibold text-[#303150] text-sm">הכנסה קבועה</h3>
          </div>
          <div className="space-y-3">
            {incomeFields.map(renderField)}
          </div>
        </div>

        {/* Visual Separator */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[#E8E8ED]" />
          <span className="text-xs text-[#BDBDCB] font-medium">+</span>
          <div className="flex-1 h-px bg-[#E8E8ED]" />
        </div>

        {/* Expense Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-rose-50 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <h3 className="font-semibold text-[#303150] text-sm">הוצאה לדוגמה</h3>
          </div>
          <div className="space-y-3">
            {expenseFields.map(renderField)}
          </div>
        </div>
      </motion.div>
    );
  };

  /**
   * Render regular FORM step content
   */
  const renderFormStep = (step: OnboardingStep) => {
    const Icon = stepIcons[step.icon as keyof typeof stepIcons] || Sparkles;
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

  /**
   * Render step content - dispatches to the correct renderer based on step type
   */
  const renderStepContent = (step: OnboardingStep) => {
    if (step.stepType === 'choice') {
      return renderChoiceStep(step);
    }

    if (step.stepType === 'info') {
      return renderInfoStep(step);
    }

    if (step.stepType === 'tasks') {
      return renderTasksStep(step);
    }

    // Dual form for income+expense step
    if (step.id === 'haredi-income-expense') {
      return renderDualFormStep(step);
    }

    // Default form step
    return renderFormStep(step);
  };

  /**
   * Render the footer based on step type
   */
  const renderFooter = () => {
    const stepType = currentStep.stepType;

    // CHOICE step: buttons are rendered inside the step content — no footer needed
    if (stepType === 'choice') {
      return null;
    }

    // INFO step: single "הבנתי, בואו נתחיל" button
    if (stepType === 'info') {
      return (
        <div className="flex-shrink-0 px-8 pb-6 pt-4 border-t border-[#F7F7F8] space-y-3">
          <motion.button
            onClick={goToNextStep}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 px-6 bg-gradient-to-r from-[#69ADFF] to-[#74ACEF] text-white font-semibold rounded-xl
                       shadow-lg shadow-[#69ADFF]/25 hover:shadow-xl hover:shadow-[#69ADFF]/30
                       flex items-center justify-center gap-2 transition-all duration-200"
          >
            <span>הבנתי, בואו נתחיל</span>
            <ChevronLeft className="w-5 h-5" />
          </motion.button>
        </div>
      );
    }

    // TASKS step: "סיימתי! בואו נתחיל" button
    if (stepType === 'tasks') {
      return (
        <div className="flex-shrink-0 px-8 pb-6 pt-4 border-t border-[#F7F7F8] space-y-3">
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

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={goToPreviousStep}
              className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-[#7E7F90] hover:text-[#303150] hover:bg-[#F7F7F8] rounded-xl transition-all"
            >
              <ChevronRight className="w-4 h-4" />
              הקודם
            </button>

            {/* Progress Dots */}
            <div className="flex items-center gap-2">
              {harediOnboardingSteps.map((_, index) => (
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

            <div className="w-[72px]" /> {/* Spacer for alignment */}
          </div>
        </div>
      );
    }

    // Regular FORM steps: save button + navigation
    return (
      <div className="flex-shrink-0 px-8 pb-6 pt-4 border-t border-[#F7F7F8] space-y-3">
        {/* Add button */}
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
            {harediOnboardingSteps.map((_, index) => (
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

          {/* Skip Button */}
          <button
            onClick={isLastStep ? endTour : goToNextStep}
            className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-[#7E7F90] hover:text-[#303150] hover:bg-[#F7F7F8] rounded-xl transition-all"
          >
            {isLastStep ? 'סיום' : 'דלג'}
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>
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
            {/* Backdrop - only closable if step allows it */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              onClick={isClosable ? endTour : undefined}
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
                {/* Close Button - hidden on non-closable steps */}
                {isClosable && (
                  <button
                    onClick={endTour}
                    className="absolute top-4 left-4 p-2 text-[#7E7F90] hover:text-[#303150] hover:bg-[#F7F7F8] rounded-xl transition-all z-10"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}

                {/* Content - Scrollable */}
                <div ref={contentScrollRef} className="flex-1 overflow-y-auto p-8 pt-12">
                  <AnimatePresence mode="wait" initial={false}>
                    {renderStepContent(currentStep)}
                  </AnimatePresence>
                </div>

                {/* Footer */}
                {renderFooter()}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
