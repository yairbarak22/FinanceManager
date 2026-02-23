'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Send, Loader2, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '@/lib/utils';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SupportModal({ isOpen, onClose }: SupportModalProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    } else {
      setMessage('');
      setError('');
      setSent(false);
    }
  }, [isOpen]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape' && !isSending) {
        onClose();
      }
    },
    [onClose, isSending]
  );

  const handleSubmit = async () => {
    if (!message.trim()) {
      setError('נא לכתוב את ההודעה שלך');
      return;
    }

    setIsSending(true);
    setError('');

    try {
      const res = await apiFetch('/api/support/contact', {
        method: 'POST',
        body: JSON.stringify({ message: message.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'שגיאה בשליחה');
      }

      setSent(true);
      setTimeout(() => onClose(), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'שגיאה בשליחה. נסו שוב מאוחר יותר.';
      setError(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ backdropFilter: 'blur(4px)', background: 'rgba(0,0,0,0.5)' }}
          onClick={() => !isSending && onClose()}
          role="presentation"
        >
          <motion.div
            ref={dialogRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="support-modal-title"
            className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#F7F7F8]">
              <h2
                id="support-modal-title"
                className="text-lg font-semibold text-[#303150]"
              >
                צריך עזרה? דבר איתנו
              </h2>
              <button
                type="button"
                onClick={onClose}
                disabled={isSending}
                className="p-2 rounded-lg hover:bg-[#F7F7F8] transition-colors text-[#7E7F90]"
                aria-label="סגור"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4" dir="rtl">
              {sent ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8 space-y-3"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                    className="w-16 h-16 bg-[#0DBACC]/10 rounded-full flex items-center justify-center mx-auto"
                  >
                    <CheckCircle className="w-8 h-8 text-[#0DBACC]" />
                  </motion.div>
                  <p className="text-base font-semibold text-[#303150]">
                    הפנייה נשלחה בהצלחה!
                  </p>
                  <p className="text-sm text-[#7E7F90]">
                    נחזור אליך בהקדם האפשרי.
                  </p>
                </motion.div>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[#7E7F90]">
                      נושא: פנייה לתמיכה
                    </label>
                    <textarea
                      ref={textareaRef}
                      value={message}
                      onChange={(e) => {
                        setMessage(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder="ספר לנו במה נוכל לעזור..."
                      rows={4}
                      disabled={isSending}
                      className="w-full px-4 py-3 bg-white border border-[#E8E8ED] rounded-xl text-[#303150] text-sm
                                 placeholder:text-[#BDBDCB] resize-none focus:outline-none focus:border-[#69ADFF]
                                 focus:ring-2 focus:ring-[#69ADFF]/20 transition-all disabled:opacity-50"
                    />
                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-[#F18AB5]"
                      >
                        {error}
                      </motion.p>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            {!sent && (
              <div className="flex items-center justify-end gap-3 p-6 border-t border-[#F7F7F8]" dir="rtl">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSending}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-[#303150] bg-white border border-[#F7F7F8]
                             hover:bg-[#F7F7F8] transition-all disabled:opacity-50"
                >
                  ביטול
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSending || !message.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-[#69ADFF]
                             hover:bg-[#5A9EE6] transition-all shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>שלח</span>
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
