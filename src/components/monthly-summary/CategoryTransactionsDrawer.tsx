'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getCategoryInfo } from '@/lib/categories';
import { SensitiveData } from '@/components/common/SensitiveData';
import type { Transaction } from '@/lib/types';

interface CategoryTransactionsDrawerProps {
  category: string | null;
  transactions: Transaction[];
  onClose: () => void;
}

export default function CategoryTransactionsDrawer({
  category,
  transactions,
  onClose,
}: CategoryTransactionsDrawerProps) {
  const isOpen = category !== null;

  const filteredTransactions = category
    ? transactions.filter(
        (tx) => tx.category === category && tx.type === 'expense'
      )
    : [];

  const catInfo = category ? getCategoryInfo(category, 'expense') : null;
  const categoryName = catInfo?.nameHe || category || '';
  const total = filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[9998]"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed top-0 end-0 h-full w-full max-w-md bg-white shadow-2xl z-[9999] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#F7F7F8]">
              <div>
                <h3 className="text-[1.125rem] font-semibold text-[#303150]">
                  {categoryName}
                </h3>
                <SensitiveData>
                  <p className="text-[0.8125rem] text-[#7E7F90] mt-0.5">
                    סה&quot;כ {formatCurrency(total)} ·{' '}
                    {filteredTransactions.length} תנועות
                  </p>
                </SensitiveData>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-[#F7F7F8] transition-colors cursor-pointer"
                aria-label="סגירה"
              >
                <X className="w-5 h-5 text-[#7E7F90]" strokeWidth={1.75} />
              </button>
            </div>

            {/* Transaction List */}
            <div className="flex-1 overflow-y-auto p-6">
              {filteredTransactions.length === 0 ? (
                <p className="text-center text-[0.9375rem] text-[#BDBDCB] py-10">
                  אין תנועות בקטגוריה זו
                </p>
              ) : (
                <div className="space-y-3">
                  {filteredTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between py-3 border-b border-[#F7F7F8] last:border-b-0"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-[0.9375rem] text-[#303150] truncate">
                          {tx.description}
                        </p>
                        <p className="text-[0.75rem] text-[#BDBDCB]">
                          {formatDate(tx.date)}
                        </p>
                      </div>
                      <SensitiveData>
                        <span className="text-[0.9375rem] font-semibold text-[#F18AB5] flex-shrink-0 ps-4">
                          {formatCurrency(tx.amount)}
                        </span>
                      </SensitiveData>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
