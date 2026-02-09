'use client';

import { useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { isSmartlookAvailable, trackSmartlookEvent } from '@/lib/smartlook';
import { isMixpanelAvailable, trackMixpanelEvent, resetMixpanel, identifyUser } from '@/lib/mixpanel';

// Check if gtag is available
function isGtagAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
}

// Generic event tracking function - sends to GA, Smartlook, and Mixpanel
function trackEvent(eventName: string, params?: Record<string, unknown>) {
  // Track in Google Analytics
  if (isGtagAvailable()) {
    window.gtag('event', eventName, params);
  }

  // Track in Smartlook
  if (isSmartlookAvailable()) {
    // Convert params to Smartlook-compatible format (string | number | boolean only)
    const smartlookParams: Record<string, string | number | boolean> = {};
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          smartlookParams[key] = value;
        } else if (value !== null && value !== undefined) {
          smartlookParams[key] = String(value);
        }
      }
    }
    trackSmartlookEvent(eventName, smartlookParams);
  }

  // Track in Mixpanel
  if (isMixpanelAvailable()) {
    trackMixpanelEvent(eventName, params);
  }
}

export function useAnalytics() {
  const { data: session } = useSession();

  // Page view tracking
  const trackPageView = useCallback((pageTitle: string) => {
    trackEvent('page_view', { page_title: pageTitle });
  }, []);

  // Transaction events
  const trackAddTransaction = useCallback(
    (type: 'income' | 'expense', category: string, amount: number) => {
      trackEvent('add_transaction', {
        transaction_type: type,
        category,
        value: amount,
      });
    },
    []
  );

  const trackDeleteTransaction = useCallback(() => {
    trackEvent('delete_transaction');
  }, []);

  // Asset events
  const trackAddAsset = useCallback((category: string, value: number) => {
    trackEvent('add_asset', {
      asset_category: category,
      value,
    });
  }, []);

  const trackDeleteAsset = useCallback(() => {
    trackEvent('delete_asset');
  }, []);

  // Liability events
  const trackAddLiability = useCallback((type: string, amount: number) => {
    trackEvent('add_liability', {
      liability_type: type,
      value: amount,
    });
  }, []);

  const trackDeleteLiability = useCallback(() => {
    trackEvent('delete_liability');
  }, []);

  // Recurring transaction events
  const trackAddRecurring = useCallback(
    (type: 'income' | 'expense', category: string, amount: number) => {
      trackEvent('add_recurring', {
        transaction_type: type,
        category,
        value: amount,
      });
    },
    []
  );

  // Import events
  const trackImport = useCallback((rowCount: number, success: boolean) => {
    trackEvent('import_transactions', {
      row_count: rowCount,
      success,
    });
  }, []);

  // Navigation events
  const trackTabChange = useCallback((tab: string) => {
    trackEvent('tab_change', { tab_name: tab });
  }, []);

  // Custom category events
  const trackAddCustomCategory = useCallback((type: string) => {
    trackEvent('add_custom_category', { category_type: type });
  }, []);

  // Document events
  const trackDocumentUpload = useCallback((entityType: 'asset' | 'liability') => {
    trackEvent('document_upload', { entity_type: entityType });
  }, []);

  // Auth events
  const trackLogin = useCallback(() => {
    // Identify user in Mixpanel before sending the Sign In event
    if (session?.user?.id) {
      identifyUser(session.user.id, {
        name: session.user.name,
        email: session.user.email,
      });
    }
    trackEvent('Sign In', { login_method: 'google', success: true });
  }, [session]);

  const trackLogout = useCallback(() => {
    trackEvent('logout');
    // Reset Mixpanel identity on logout
    resetMixpanel();
  }, []);

  // AI events
  const trackAIChat = useCallback((context?: string) => {
    trackEvent('ai_chat', { context: context || 'general' });
  }, []);

  // Onboarding events
  const trackOnboardingStarted = useCallback((userType: 'regular' | 'haredi') => {
    trackEvent('Onboarding Started', { user_type: userType });
  }, []);

  const trackOnboardingStep = useCallback((stepId: string, stepName: string, stepIndex: number) => {
    trackEvent('Onboarding Step Viewed', { step_id: stepId, step_name: stepName, step_index: stepIndex });
  }, []);

  const trackOnboardingStepCompleted = useCallback((stepId: string, stepName: string, stepIndex: number, dataEntered: boolean) => {
    trackEvent('Onboarding Step Completed', { step_id: stepId, step_name: stepName, step_index: stepIndex, data_entered: dataEntered });
  }, []);

  const trackOnboardingComplete = useCallback((totalSteps?: number) => {
    trackEvent('Onboarding Completed', { total_steps: totalSteps });
  }, []);

  // Login page view (for login → signup funnel)
  const trackLoginPageViewed = useCallback((properties?: { has_error?: boolean; callback_url?: string; source?: string; utm_source?: string }) => {
    trackEvent('Login Page Viewed', properties);
  }, []);

  // Sign Up event (for the funnel)
  const trackSignUp = useCallback((method: string = 'google') => {
    trackEvent('Sign Up', { signup_method: method });
  }, []);

  // Goal events
  const trackGoalPageViewed = useCallback(() => {
    trackEvent('Goal Page Viewed');
  }, []);

  const trackGoalFormOpened = useCallback((source: string) => {
    trackEvent('Goal Form Opened', { source });
  }, []);

  const trackGoalSimulatorUsed = useCallback((targetAmount: number, timeInMonths: number, interestRate: number) => {
    trackEvent('Goal Simulator Used', { target_amount: targetAmount, time_in_months: timeInMonths, interest_rate: interestRate });
  }, []);

  const trackGoalCreated = useCallback((goalName: string, category: string, targetAmount: number, currentAmount: number, deadline: string, investInPortfolio: boolean) => {
    trackEvent('Goal Created', { goal_name: goalName, category, target_amount: targetAmount, current_amount: currentAmount, deadline, invest_in_portfolio: investInPortfolio });
  }, []);

  const trackGoalUpdated = useCallback((goalId: string, goalName: string, category: string, targetAmount: number, currentAmount: number, deadline: string) => {
    trackEvent('Goal Updated', { goal_id: goalId, goal_name: goalName, category, target_amount: targetAmount, current_amount: currentAmount, deadline });
  }, []);

  const trackGoalDeleted = useCallback((goalId: string, goalName: string) => {
    trackEvent('Goal Deleted', { goal_id: goalId, goal_name: goalName });
  }, []);

  // Calculator events
  const trackCalculatorOpened = useCallback((calculatorName: string) => {
    trackEvent('Calculator Opened', { calculator_name: calculatorName });
  }, []);

  const trackCalculatorUsed = useCallback((calculatorName: string, parameters?: Record<string, unknown>) => {
    trackEvent('Calculator Used', { calculator_name: calculatorName, ...parameters });
  }, []);

  // Investment events
  const trackInvestmentGuideViewed = useCallback(() => {
    trackEvent('Investment Guide Viewed', { guide_type: 'passive_investing' });
  }, []);

  const trackInvestmentPortfolioViewed = useCallback(() => {
    trackEvent('Investment Portfolio Viewed');
  }, []);

  // IBI Button - CRITICAL for funnel
  const trackIBIButtonClicked = useCallback((goalCount: number) => {
    trackEvent('IBI Button Clicked', { source: 'investment_guide', guide_step: 4, goal_count: goalCount });
  }, []);

  // Transaction edit
  const trackEditTransaction = useCallback(() => {
    trackEvent('Transaction Edited');
  }, []);

  return {
    // Page
    trackPageView,
    // Transactions
    trackAddTransaction,
    trackDeleteTransaction,
    trackEditTransaction,
    // Assets
    trackAddAsset,
    trackDeleteAsset,
    // Liabilities
    trackAddLiability,
    trackDeleteLiability,
    // Recurring
    trackAddRecurring,
    // Import
    trackImport,
    // Navigation
    trackTabChange,
    // Categories
    trackAddCustomCategory,
    // Documents
    trackDocumentUpload,
    // Auth
    trackLogin,
    trackLogout,
    trackLoginPageViewed,
    trackSignUp,
    // AI
    trackAIChat,
    // Onboarding
    trackOnboardingStarted,
    trackOnboardingStep,
    trackOnboardingStepCompleted,
    trackOnboardingComplete,
    // Goals
    trackGoalPageViewed,
    trackGoalFormOpened,
    trackGoalSimulatorUsed,
    trackGoalCreated,
    trackGoalUpdated,
    trackGoalDeleted,
    // Calculators
    trackCalculatorOpened,
    trackCalculatorUsed,
    // Investments
    trackInvestmentGuideViewed,
    trackInvestmentPortfolioViewed,
    trackIBIButtonClicked,
  };
}
