'use client';

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { X, TrendingDown, Building2, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useModal } from '@/context/ModalContext';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import TransactionQuickForm from './TransactionQuickForm';
import AssetQuickForm from './AssetQuickForm';
import LiabilityQuickForm from './LiabilityQuickForm';
import { CategoryInfo } from '@/lib/categories';

type TabType = 'transaction' | 'asset' | 'liability';

// Hook to safely check if we're mounted (client-side)
function useIsMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

// Hook to get window width
function useWindowWidth() {
  return useSyncExternalStore(
    (callback) => {
      window.addEventListener('resize', callback);
      return () => window.removeEventListener('resize', callback);
    },
    () => window.innerWidth,
    () => 1024 // Server-side default
  );
}

interface QuickAddModalProps {
  expenseCategories: { default: CategoryInfo[]; custom: CategoryInfo[] };
  incomeCategories: { default: CategoryInfo[]; custom: CategoryInfo[] };
  assetCategories: { default: CategoryInfo[]; custom: CategoryInfo[] };
  liabilityCategories: { default: CategoryInfo[]; custom: CategoryInfo[] };
  onSaveTransaction: (data: {
    type: 'income' | 'expense';
    amount: number;
    category: string;
    description: string;
    date: string;
  }) => Promise<void>;
  onSaveAsset: (data: {
    name: string;
    category: string;
    value: number;
  }) => Promise<void>;
  onSaveLiability: (data: {
    name: string;
    type: 'loan' | 'mortgage';
    totalAmount: number;
    monthlyPayment: number;
    interestRate?: number;
    startDate: string;
  }) => Promise<void>;
  onAddCategory: (name: string, type: 'expense' | 'income' | 'asset' | 'liability') => Promise<CategoryInfo>;
}

const tabs: { id: TabType; label: string; icon: typeof TrendingDown }[] = [
  { id: 'transaction', label: 'עסקה', icon: TrendingDown },
  { id: 'asset', label: 'נכס', icon: Building2 },
  { id: 'liability', label: 'התחייבות', icon: CreditCard },
];

export default function QuickAddModal({
  expenseCategories,
  incomeCategories,
  assetCategories,
  liabilityCategories,
  onSaveTransaction,
  onSaveAsset,
  onSaveLiability,
  onAddCategory,
}: QuickAddModalProps) {
  const { isModalOpen, closeModal } = useModal();
  const isOpen = isModalOpen('quick-add');
  const [activeTab, setActiveTab] = useState<TabType>('transaction');
  
  // Use safe mount check and window width hooks
  const mounted = useIsMounted();
  const windowWidth = useWindowWidth();
  const isMobile = windowWidth < 768;

  // Focus trap for accessibility
  const { containerRef, handleKeyDown } = useFocusTrap<HTMLDivElement>(isOpen, {
    onEscape: closeModal,
  });

  // Track previous isOpen state to reset tab only when opening
  const [prevIsOpen, setPrevIsOpen] = useState(false);
  if (isOpen && !prevIsOpen) {
    // Modal just opened - reset tab synchronously during render
    if (activeTab !== 'transaction') {
      setActiveTab('transaction');
    }
  }
  if (prevIsOpen !== isOpen) {
    setPrevIsOpen(isOpen);
  }

  // Handle keyboard shortcut
  useEffect(() => {
    if (!isOpen) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen, closeModal]);

  const handleClose = useCallback(() => {
    closeModal();
  }, [closeModal]);

  const handleSaveTransaction = async (data: {
    type: 'income' | 'expense';
    amount: number;
    category: string;
    description: string;
    date: string;
  }) => {
    await onSaveTransaction(data);
    handleClose();
  };

  const handleSaveAsset = async (data: {
    name: string;
    category: string;
    value: number;
  }) => {
    await onSaveAsset(data);
    handleClose();
  };

  const handleSaveLiability = async (data: {
    name: string;
    type: 'loan' | 'mortgage';
    totalAmount: number;
    monthlyPayment: number;
    interestRate?: number;
    startDate: string;
  }) => {
    await onSaveLiability(data);
    handleClose();
  };

  if (!mounted || !isOpen) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="modal-overlay"
          onClick={handleClose}
          role="presentation"
        >
          <motion.div
            ref={containerRef}
            initial={isMobile ? { y: '100%' } : { scale: 0.95, opacity: 0 }}
            animate={isMobile ? { y: 0 } : { scale: 1, opacity: 1 }}
            exit={isMobile ? { y: '100%' } : { scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="modal-content w-full md:max-w-md flex flex-col"
            style={{
              height: isMobile ? '90vh' : '600px',
              maxHeight: isMobile ? '90vh' : '85vh',
            }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
            role="dialog"
            aria-modal="true"
            aria-labelledby="quick-add-title"
          >
            {/* Header */}
            <div className="modal-header">
              <h2
                id="quick-add-title"
                className="text-xl font-bold"
                style={{
                  color: '#303150',
                  fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                }}
              >
                הוספה מהירה
              </h2>
              <button
                type="button"
                onClick={handleClose}
                className="btn-icon"
                aria-label="סגור"
              >
                <X className="w-5 h-5" style={{ color: '#7E7F90' }} />
              </button>
            </div>

            {/* Tabs */}
            <div className="px-6 pt-2 pb-4 border-b border-[#F7F7F8]">
              <div
                className="flex gap-1 p-1 rounded-xl"
                style={{ backgroundColor: '#F7F7F8' }}
                role="tablist"
                aria-label="סוג פריט להוספה"
              >
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  const IconComponent = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      aria-controls={`${tab.id}-panel`}
                      onClick={() => setActiveTab(tab.id)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg font-medium text-sm transition-all"
                      style={{
                        backgroundColor: isActive ? '#FFFFFF' : 'transparent',
                        color: isActive ? '#303150' : '#7E7F90',
                        boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                        fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                      }}
                    >
                      <IconComponent className="w-4 h-4" strokeWidth={2} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab Content */}
            <div className="modal-body flex-1 overflow-y-auto">
              {activeTab === 'transaction' && (
                <div id="transaction-panel" role="tabpanel" aria-labelledby="transaction-tab">
                  <TransactionQuickForm
                    expenseCategories={expenseCategories}
                    incomeCategories={incomeCategories}
                    onSave={handleSaveTransaction}
                    onAddCategory={(name, type) => onAddCategory(name, type)}
                  />
                </div>
              )}
              {activeTab === 'asset' && (
                <div id="asset-panel" role="tabpanel" aria-labelledby="asset-tab">
                  <AssetQuickForm
                    assetCategories={assetCategories}
                    onSave={handleSaveAsset}
                    onAddCategory={(name) => onAddCategory(name, 'asset')}
                  />
                </div>
              )}
              {activeTab === 'liability' && (
                <div id="liability-panel" role="tabpanel" aria-labelledby="liability-tab">
                  <LiabilityQuickForm
                    liabilityCategories={liabilityCategories}
                    onSave={handleSaveLiability}
                    onAddCategory={(name) => onAddCategory(name, 'liability')}
                  />
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}

