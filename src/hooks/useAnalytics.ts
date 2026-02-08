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
  const trackOnboardingStep = useCallback((step: string) => {
    trackEvent('onboarding_step', { step_name: step });
  }, []);

  const trackOnboardingComplete = useCallback(() => {
    trackEvent('onboarding_complete');
  }, []);

  return {
    // Page
    trackPageView,
    // Transactions
    trackAddTransaction,
    trackDeleteTransaction,
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
    // AI
    trackAIChat,
    // Onboarding
    trackOnboardingStep,
    trackOnboardingComplete,
  };
}
