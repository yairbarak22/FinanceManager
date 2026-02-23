'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronsDown } from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { useMonth } from '@/context/MonthContext';
import { useModal } from '@/context/ModalContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import ProfileModal from '@/components/ProfileModal';
import AccountSettings from '@/components/AccountSettings';
import {
  GuideHero,
  StepBackground,
  Step1Logic,
  Step2Kashrut,
  Step3Practice,
  Step4Action,
} from '@/components/investments/guide';

// ============================================================================
// Scroll-to-next indicator between steps
// ============================================================================

function ScrollToNext({ targetRef, label }: { targetRef: React.RefObject<HTMLDivElement | null>; label: string }) {
  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      onClick={() => targetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
      className="flex flex-col items-center gap-1.5 mx-auto text-[#BDBDCB] hover:text-[#0DBACC] transition-colors py-4 cursor-pointer"
      aria-label={label}
    >
      <span className="text-xs font-medium">{label}</span>
      <motion.div
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <ChevronsDown className="w-5 h-5" />
      </motion.div>
    </motion.button>
  );
}

export default function InvestmentGuidePage() {
  const router = useRouter();
  const {
    selectedMonth,
    setSelectedMonth,
    allMonths,
    monthsWithData,
    currentMonth,
  } = useMonth();

  const { openModal, isModalOpen, closeModal } = useModal();
  const analytics = useAnalytics();
  const hasTrackedPageView = useRef(false);

  const [isVerifyingUser, setIsVerifyingUser] = useState(true);
  const [isHarediUser, setIsHarediUser] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Refs for scroll targets
  const contentRef = useRef<HTMLDivElement>(null);
  const backgroundRef = useRef<HTMLDivElement>(null);
  const step1Ref = useRef<HTMLDivElement>(null);
  const step2Ref = useRef<HTMLDivElement>(null);
  const step3Ref = useRef<HTMLDivElement>(null);
  const step4Ref = useRef<HTMLDivElement>(null);

  // Verify user is Haredi
  useEffect(() => {
    const verifyUser = async () => {
      try {
        const response = await fetch('/api/user/onboarding');
        if (response.ok) {
          const data = await response.json();
          if (data.signupSource === 'prog') {
            setIsHarediUser(true);
            // Mark guide as visited for the progress dock (Step 3 completion)
            localStorage.setItem('haredi-visited-guide', 'true');
            // Track investment guide viewed
            if (!hasTrackedPageView.current) {
              analytics.trackInvestmentGuideViewed();
              hasTrackedPageView.current = true;
            }
          } else {
            router.replace('/investments');
            return;
          }
        }
      } catch (error) {
        console.error('Failed to verify user:', error);
      } finally {
        setIsVerifyingUser(false);
      }
    };

    verifyUser();
  }, [router]);

  // Scroll to content
  const handleScrollToContent = useCallback(() => {
    contentRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Scroll to a specific step when clicking the progress bar
  const handleStepClick = useCallback((stepNum: number) => {
    const refs = [backgroundRef, step1Ref, step2Ref, step3Ref, step4Ref];
    const target = refs[stepNum - 1];
    target?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // Step in-view handlers (5 steps: background + 4 guide steps)
  const handleBackgroundInView = useCallback(() => setCurrentStep(1), []);
  const handleStep1InView = useCallback(() => setCurrentStep(2), []);
  const handleStep2InView = useCallback(() => setCurrentStep(3), []);
  const handleStep3InView = useCallback(() => setCurrentStep(4), []);
  const handleStep4InView = useCallback(() => setCurrentStep(5), []);

  // Show loading while verifying user
  if (isVerifyingUser || !isHarediUser) {
    return (
      <AppLayout
        pageTitle="מדריך השקעות"
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        allMonths={allMonths}
        monthsWithData={monthsWithData}
        currentMonth={currentMonth}
        onOpenProfile={() => openModal('profile')}
        onOpenAccountSettings={() => openModal('accountSettings')}
        showMonthFilter={false}
      >
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 border-2 border-[#69ADFF] border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      pageTitle="מדריך השקעות"
      pageSubtitle="המסלול השקט לחתונות הילדים"
      selectedMonth={selectedMonth}
      onMonthChange={setSelectedMonth}
      allMonths={allMonths}
      monthsWithData={monthsWithData}
      currentMonth={currentMonth}
      onOpenProfile={() => openModal('profile')}
      onOpenAccountSettings={() => openModal('accountSettings')}
      showMonthFilter={false}
    >
      <div className="max-w-3xl mx-auto space-y-12" dir="rtl">
        {/* Hero Section */}
        <GuideHero
          currentStep={currentStep}
          totalSteps={5}
          onScrollToContent={handleScrollToContent}
          onStepClick={handleStepClick}
        />

        {/* Guide Content */}
        <div ref={contentRef} className="space-y-16">
          {/* Background: What is investing, compound interest, passive investing */}
          <div ref={backgroundRef}>
            <StepBackground onInView={handleBackgroundInView} />
          </div>
          <ScrollToNext targetRef={step1Ref} label="למה זה עובד?" />

          {/* Step 1: Why it works */}
          <div ref={step1Ref}>
            <Step1Logic onInView={handleStep1InView} />
          </div>
          <ScrollToNext targetRef={step2Ref} label="איך זה מסתדר עם ההלכה?" />

          {/* Step 2: Halacha */}
          <div ref={step2Ref}>
            <Step2Kashrut onInView={handleStep2InView} />
          </div>
          <ScrollToNext targetRef={step3Ref} label="איך תכל׳ס עושים את זה?" />

          {/* Step 3: Practice */}
          <div ref={step3Ref}>
            <Step3Practice onInView={handleStep3InView} />
          </div>
          <ScrollToNext targetRef={step4Ref} label="השורה התחתונה" />

          {/* Step 4: Action */}
          <div ref={step4Ref}>
            <Step4Action onInView={handleStep4InView} />
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-[10px] text-[#BDBDCB] text-center leading-relaxed px-4 pb-8">
          המידע הוא לצורכי לימוד בלבד ואינו מהווה ייעוץ פיננסי, ייעוץ מס או המלצת השקעה.
          מומלץ להתייעץ עם מומחה לפני קבלת החלטות.
          תשואות עבר אינן מעידות על תשואות עתידיות.
        </p>
      </div>

      {/* Modals */}
      <ProfileModal
        isOpen={isModalOpen('profile')}
        onClose={closeModal}
      />
      <AccountSettings
        isOpen={isModalOpen('accountSettings')}
        onClose={closeModal}
      />
    </AppLayout>
  );
}

