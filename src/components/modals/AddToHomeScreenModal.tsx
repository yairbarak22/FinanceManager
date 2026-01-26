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
            className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm"
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
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 pointer-events-auto overflow-hidden"
              dir="rtl"
              onKeyDown={handleKeyDown}
            >
              {/* Header with Icon */}
              <div className="relative pt-8 pb-4 px-6 text-center bg-gradient-to-b from-indigo-50 to-white">
                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                  aria-label="סגור"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Icon */}
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/10 mb-4">
                  <Smartphone className="w-10 h-10 text-indigo-600" />
                </div>

                <h2 id="add-to-home-title" className="text-xl font-bold text-slate-900 mb-2">
                  הוסף למסך הבית לגישה מהירה
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed max-w-xs mx-auto">
                  כדי לחזור בקלות לאתר פעם נוספת ולנהל את הכסף שלך בצורה נוחה, הוסף את NETO למסך הבית
                </p>
              </div>

              {/* Instructions */}
              <div className="px-6 pb-6 space-y-4">
                {/* iPhone Instructions */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-slate-200 rounded-lg flex items-center justify-center">
                      <span className="text-xs">🍎</span>
                    </div>
                    <h3 className="font-semibold text-slate-900 text-sm">באייפון (Safari)</h3>
                  </div>
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-indigo-600">
                        1
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <span>לחץ על כפתור השיתוף</span>
                        <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                          <Share className="w-3.5 h-3.5 text-blue-600" />
                        </div>
                        <span>בתחתית המסך</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-indigo-600">
                        2
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <span>גלול ולחץ על</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-200 rounded text-xs font-medium">
                          <Plus className="w-3 h-3" />
                          הוסף למסך הבית
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-indigo-600">
                        3
                      </div>
                      <span className="text-sm text-slate-700">לחץ &quot;הוסף&quot; כדי לאשר</span>
                    </div>
                  </div>
                </div>

                {/* Android Instructions */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-slate-200 rounded-lg flex items-center justify-center">
                      <span className="text-xs">🤖</span>
                    </div>
                    <h3 className="font-semibold text-slate-900 text-sm">באנדרואיד (Chrome)</h3>
                  </div>
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-indigo-600">
                        1
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <span>לחץ על תפריט הדפדפן</span>
                        <div className="w-6 h-6 bg-slate-200 rounded flex items-center justify-center">
                          <MoreVertical className="w-3.5 h-3.5 text-slate-600" />
                        </div>
                        <span>בפינה העליונה</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-indigo-600">
                        2
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <span>בחר</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-200 rounded text-xs font-medium">
                          הוסף למסך הבית
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-indigo-600">
                        3
                      </div>
                      <span className="text-sm text-slate-700">לחץ &quot;הוסף&quot; או &quot;התקן&quot; כדי לאשר</span>
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <motion.button
                  ref={closeButtonRef}
                  onClick={onClose}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-semibold rounded-2xl
                             shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30
                             flex items-center justify-center gap-2 transition-all duration-200"
                >
                  <Check className="w-5 h-5" />
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

