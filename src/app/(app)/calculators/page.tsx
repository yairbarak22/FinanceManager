'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout';
import { CompoundInterestCalc, LockedCalculatorsGrid } from '@/components/calculators';
import { useMonth } from '@/context/MonthContext';
import { useModal } from '@/context/ModalContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import ProfileModal from '@/components/ProfileModal';
import AccountSettings from '@/components/AccountSettings';
import { motion } from 'framer-motion';

interface AccessStatus {
  hasAccess: boolean;
  pendingInvites: number;
  acceptedInvites: number;
}

export default function CalculatorsPage() {
  const {
    selectedMonth,
    setSelectedMonth,
    allMonths,
    monthsWithData,
    currentMonth,
  } = useMonth();
  
  const { openModal, isModalOpen, closeModal } = useModal();
  const router = useRouter();
  const analytics = useAnalytics();
  const hasTrackedPageView = useRef(false);
  
  // Track page view on mount
  useEffect(() => {
    if (!hasTrackedPageView.current) {
      analytics.trackCalculatorOpened('calculators-page');
      hasTrackedPageView.current = true;
    }
  }, [analytics]);
  
  // Access state
  const [accessStatus, setAccessStatus] = useState<AccessStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Redirect Haredi users to their dedicated calculators page
  useEffect(() => {
    const checkSignupSource = async () => {
      try {
        const res = await fetch('/api/user/onboarding');
        if (res.ok) {
          const data = await res.json();
          if (data.signupSource === 'prog') {
            router.replace('/calculators-haredi');
            return;
          }
        }
      } catch {
        // silently ignore
      }
    };
    checkSignupSource();
  }, [router]);

  // Fetch access status from API
  const fetchAccessStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/calculators/access');
      if (response.ok) {
        const data = await response.json();
        setAccessStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch access status:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check access on mount
  useEffect(() => {
    setMounted(true);
    fetchAccessStatus();
  }, [fetchAccessStatus]);

  // Handler for when an invite is sent
  const handleInviteSent = () => {
    // Refresh access status to update pending count
    fetchAccessStatus();
  };

  const isUnlocked = accessStatus?.hasAccess ?? false;
  const pendingInvites = accessStatus?.pendingInvites ?? 0;

  return (
    <AppLayout
      pageTitle="מחשבונים פיננסיים"
      pageSubtitle="כלים חכמים לתכנון העתיד הפיננסי שלך"
      selectedMonth={selectedMonth}
      onMonthChange={setSelectedMonth}
      allMonths={allMonths}
      monthsWithData={monthsWithData}
      currentMonth={currentMonth}
      onOpenProfile={() => openModal('profile')}
      onOpenAccountSettings={() => openModal('accountSettings')}
      showMonthFilter={false}
    >
      <div className="space-y-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-2xl font-bold text-[#303150] mb-2">מחשבונים פיננסיים</h1>
          <p className="text-[#7E7F90]">כלים חכמים לתכנון העתיד הפיננסי שלך</p>
        </motion.div>

        {/* Always Open: Compound Interest Calculator */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="space-y-6"
        >
          <div>
            <h2 className="text-xl font-bold text-[#303150] mb-1">מחשבון ריבית דריבית</h2>
            <p className="text-sm text-[#7E7F90]">גלה כמה הכסף שלך יכול לצמוח עם הזמן</p>
          </div>
          <CompoundInterestCalc />
        </motion.section>

        {/* Pro Calculators Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="space-y-6"
        >
          <div>
            <h2 className="text-xl font-bold text-[#303150] mb-1">
              מחשבונים נוספים
              {isUnlocked && (
                <span className="inline-flex items-center mr-2 px-2 py-0.5 bg-[#B4F1F1] text-[#0DBACC] text-xs font-medium rounded-full">
                  פתוח
                </span>
              )}
            </h2>
            <p className="text-sm text-[#7E7F90]">
              {isUnlocked 
                ? 'כל הכלים פתוחים עבורך. תהנה!'
                : pendingInvites > 0
                  ? `יש לך ${pendingInvites} הזמנות ממתינות. הגישה תיפתח כשחבר יירשם.`
                  : 'הזמן חבר ל-NETO כדי לפתוח את כל המחשבונים'
              }
            </p>
          </div>

          {/* Only render locked grid after mount and loading complete */}
          {mounted && !isLoading && (
            <LockedCalculatorsGrid 
              isUnlocked={isUnlocked} 
              onInviteSent={handleInviteSent}
              pendingInvites={pendingInvites}
            />
          )}
          
          {/* Loading state */}
          {isLoading && (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-[#69ADFF] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </motion.section>

        {/* Disclaimer */}
        <p className="text-xs text-[#BDBDCB] text-center px-4 pt-4">
          המידע הוא לצורכי לימוד בלבד ואינו מהווה ייעוץ פיננסי. מומלץ להתייעץ עם מומחה לפני קבלת החלטות.
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
