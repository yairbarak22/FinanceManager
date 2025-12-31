'use client';

import { useCallback } from 'react';

// Check if gtag is available
function isGtagAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
}

// Generic event tracking function
function trackEvent(eventName: string, params?: Record<string, unknown>) {
  if (isGtagAvailable()) {
    window.gtag('event', eventName, params);
  }
}

export function useAnalytics() {
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
    trackEvent('login', { method: 'google' });
  }, []);

  const trackLogout = useCallback(() => {
    trackEvent('logout');
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
  };
}

