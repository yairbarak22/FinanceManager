'use client';

import { useState, useRef } from 'react';
import { Send, CheckCircle2, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { apiFetch } from '@/lib/utils';

export default function GuideRequestButton() {
  const { status } = useSession();
  const [message, setMessage] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const honeypotRef = useRef<HTMLInputElement>(null);

  if (status !== 'authenticated') return null;

  const handleSubmit = async () => {
    if (!message.trim() || message.trim().length < 5) return;

    setState('sending');
    try {
      const res = await apiFetch('/api/knowledge/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message.trim(),
          honeypot: honeypotRef.current?.value || '',
        }),
      });

      if (res.ok) {
        setState('sent');
        setMessage('');
      } else {
        setState('error');
      }
    } catch {
      setState('error');
    }
  };

  return (
    <div className="mt-10 pt-8 border-t border-[#F0F0F3]">
      <div className="rounded-3xl p-6" style={{ background: '#F8F9FC' }}>
        <AnimatePresence mode="wait">
          {state === 'sent' ? (
            <motion.div
              key="sent"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 justify-center py-2"
            >
              <CheckCircle2 className="w-5 h-5" style={{ color: '#0DBACC' }} />
              <p className="text-[14px] font-medium" style={{ color: '#303150' }}>
                הבקשה נשלחה! נבדוק ונוסיף מדריכים חדשים.
              </p>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5" style={{ color: '#69ADFF' }} />
                <p className="text-[14px] font-bold" style={{ color: '#303150' }}>
                  לא מצאתם את מה שחיפשתם?
                </p>
              </div>

              <div className="flex gap-3">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    if (state === 'error') setState('idle');
                  }}
                  placeholder="ספרו לנו על איזה נושא תרצו מדריך..."
                  className="flex-1 px-4 py-3 rounded-xl text-[14px] outline-none"
                  style={{
                    background: '#FFFFFF',
                    color: '#303150',
                    border: '1.5px solid #F0F0F3',
                  }}
                  maxLength={500}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSubmit();
                  }}
                />
                {/* Honeypot */}
                <input
                  ref={honeypotRef}
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  className="sr-only"
                  aria-hidden="true"
                />
                <button
                  onClick={handleSubmit}
                  disabled={state === 'sending' || message.trim().length < 5}
                  className="px-5 py-3 rounded-xl text-[14px] font-bold text-white flex items-center gap-2 cursor-pointer transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: '#69ADFF' }}
                >
                  {state === 'sending' ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  שליחה
                </button>
              </div>

              {state === 'error' && (
                <p className="text-[12px] mt-2" style={{ color: '#F18AB5' }}>
                  אירעה שגיאה. נסו שוב מאוחר יותר.
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
