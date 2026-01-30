'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, X, Share, MoreVertical, Plus, Check } from 'lucide-react';

interface AddToHomeScreenModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddToHomeScreenModal({
  isOpen,
  onClose,
}: AddToHomeScreenModalProps) {
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Store the previously focused element and set initial focus
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Return focus when dialog closes
  useEffect(() => {
    if (!isOpen && previousFocusRef.current) {
      previousFocusRef.current.focus();
    }
  }, [isOpen]);

  // Handle keyboard events (Escape to close, Tab trapping)
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }

    // Tab trapping
    if (e.key === 'Tab' && dialogRef.current) {
      const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    }
  }, [onClose]);

  if (!mounted) return null;

  const dialogContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="add-to-home-title"
              className="relative w-full max-w-md max-h-[90vh] bg-white rounded-2xl md:rounded-3xl shadow-2xl border border-[#F7F7F8] pointer-events-auto overflow-hidden flex flex-col"
              dir="rtl"
              onKeyDown={handleKeyDown}
            >
              {/* Header with Icon */}
              <div className="relative pt-5 pb-3 px-4 md:pt-8 md:pb-4 md:px-6 text-center bg-gradient-to-b from-[#C1DDFF]/30 to-white flex-shrink-0">
                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="absolute top-3 left-3 md:top-4 md:left-4 p-1.5 md:p-2 text-[#7E7F90] hover:text-[#303150] hover:bg-[#F7F7F8] rounded-xl transition-all"
                  aria-label="סגור"
                >
                  <X className="w-4 h-4 md:w-5 md:h-5" />
                </button>

                {/* Icon */}
                <div className="w-14 h-14 md:w-20 md:h-20 mx-auto bg-gradient-to-br from-[#C1DDFF] to-[#69ADFF] rounded-xl md:rounded-3xl flex items-center justify-center shadow-lg shadow-[#69ADFF]/10 mb-3 md:mb-4">
                  <Smartphone className="w-7 h-7 md:w-10 md:h-10 text-white" />
                </div>

                <h2 id="add-to-home-title" className="text-base md:text-xl font-bold text-[#303150] mb-1 md:mb-2">
                  הוסף למסך הבית לגישה מהירה
                </h2>
                <p className="text-xs md:text-sm text-[#7E7F90] leading-relaxed max-w-xs mx-auto">
                  כדי לחזור בקלות ולנהל את הכסף שלך בצורה נוחה
                </p>
              </div>

              {/* Instructions */}
              <div className="px-4 md:px-6 space-y-3 md:space-y-4 overflow-y-auto flex-1">
                {/* iPhone Instructions */}
                <div className="bg-[#F7F7F8] rounded-xl md:rounded-2xl p-3 md:p-4 border border-[#F7F7F8]">
                  <div className="flex items-center gap-1.5 md:gap-2 mb-2 md:mb-3">
                    <span className="text-sm">🍎</span>
                    <h3 className="font-semibold text-[#303150] text-xs md:text-sm">באייפון (Safari)</h3>
                  </div>
                  <div className="space-y-1.5 md:space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 md:w-6 md:h-6 bg-[#C1DDFF] rounded-full flex items-center justify-center flex-shrink-0 text-[10px] md:text-xs font-bold text-[#69ADFF]">
                        1
                      </div>
                      <div className="text-xs md:text-sm text-[#303150]">
                        לחץ על <span className="inline-flex items-center mx-0.5 px-1 py-0.5 bg-[#C1DDFF] rounded"><Share className="w-3 h-3 text-[#69ADFF]" /></span> בתחתית
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 md:w-6 md:h-6 bg-[#C1DDFF] rounded-full flex items-center justify-center flex-shrink-0 text-[10px] md:text-xs font-bold text-[#69ADFF]">
                        2
                      </div>
                      <div className="text-xs md:text-sm text-[#303150]">
                        בחר <span className="inline-flex items-center gap-0.5 mx-0.5 px-1 py-0.5 bg-[#E8E8ED] rounded text-[10px] md:text-xs font-medium"><Plus className="w-2.5 h-2.5" />הוסף למסך הבית</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 md:w-6 md:h-6 bg-[#C1DDFF] rounded-full flex items-center justify-center flex-shrink-0 text-[10px] md:text-xs font-bold text-[#69ADFF]">
                        3
                      </div>
                      <span className="text-xs md:text-sm text-[#303150]">לחץ &quot;הוסף&quot;</span>
                    </div>
                  </div>
                </div>

                {/* Android Instructions */}
                <div className="bg-[#F7F7F8] rounded-xl md:rounded-2xl p-3 md:p-4 border border-[#F7F7F8]">
                  <div className="flex items-center gap-1.5 md:gap-2 mb-2 md:mb-3">
                    <span className="text-sm">🤖</span>
                    <h3 className="font-semibold text-[#303150] text-xs md:text-sm">באנדרואיד (Chrome)</h3>
                  </div>
                  <div className="space-y-1.5 md:space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 md:w-6 md:h-6 bg-[#C1DDFF] rounded-full flex items-center justify-center flex-shrink-0 text-[10px] md:text-xs font-bold text-[#69ADFF]">
                        1
                      </div>
                      <div className="text-xs md:text-sm text-[#303150]">
                        לחץ על <span className="inline-flex items-center mx-0.5 px-1 py-0.5 bg-[#E8E8ED] rounded"><MoreVertical className="w-3 h-3 text-[#7E7F90]" /></span> בפינה העליונה
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 md:w-6 md:h-6 bg-[#C1DDFF] rounded-full flex items-center justify-center flex-shrink-0 text-[10px] md:text-xs font-bold text-[#69ADFF]">
                        2
                      </div>
                      <div className="text-xs md:text-sm text-[#303150]">
                        בחר <span className="inline-flex items-center mx-0.5 px-1 py-0.5 bg-[#E8E8ED] rounded text-[10px] md:text-xs font-medium">הוסף למסך הבית</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 md:w-6 md:h-6 bg-[#C1DDFF] rounded-full flex items-center justify-center flex-shrink-0 text-[10px] md:text-xs font-bold text-[#69ADFF]">
                        3
                      </div>
                      <span className="text-xs md:text-sm text-[#303150]">לחץ &quot;הוסף&quot; או &quot;התקן&quot;</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* CTA Button - Fixed at bottom */}
              <div className="px-4 pb-4 md:px-6 md:pb-6 flex-shrink-0">
                <motion.button
                  ref={closeButtonRef}
                  onClick={onClose}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 px-4 md:py-4 md:px-6 bg-gradient-to-r from-[#69ADFF] to-[#74ACEF] text-white font-semibold rounded-xl
                             shadow-lg shadow-[#69ADFF]/25 hover:shadow-xl hover:shadow-[#69ADFF]/30
                             flex items-center justify-center gap-2 transition-all duration-200 text-sm md:text-base"
                >
                  <Check className="w-4 h-4 md:w-5 md:h-5" />
                  <span>הבנתי, תודה!</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(dialogContent, document.body);
}


