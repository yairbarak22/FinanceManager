'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bug,
  Lightbulb,
  MessageSquare,
  Send,
  Loader2,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { CONTACT_FORM_LIMITS, ContactCategory, VALID_CATEGORIES } from '@/lib/contactValidation';

// ============================================================================
// TYPES
// ============================================================================

interface FormState {
  category: ContactCategory | '';
  subject: string;
  message: string;
  website: string; // Honeypot
}

type FormStatus = 'idle' | 'loading' | 'success' | 'error';

// ============================================================================
// CATEGORY CARDS
// ============================================================================

const categoryConfig: Record<ContactCategory, {
  icon: typeof Bug;
  label: string;
  description: string;
  gradient: string;
  borderColor: string;
}> = {
  bug: {
    icon: Bug,
    label: 'דיווח על באג',
    description: 'משהו לא עובד כמו שצריך?',
    gradient: 'from-rose-50 to-rose-100',
    borderColor: 'border-rose-200',
  },
  feature: {
    icon: Lightbulb,
    label: 'בקשת תכונה',
    description: 'יש לך רעיון לשיפור?',
    gradient: 'from-amber-50 to-amber-100',
    borderColor: 'border-amber-200',
  },
  general: {
    icon: MessageSquare,
    label: 'פנייה כללית',
    description: 'כל דבר אחר',
    gradient: 'from-blue-50 to-blue-100',
    borderColor: 'border-blue-200',
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function ContactPage() {
  // Form state
  const [form, setForm] = useState<FormState>({
    category: '',
    subject: '',
    message: '',
    website: '', // Honeypot - should remain empty
  });

  const [status, setStatus] = useState<FormStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Validation state
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Derived validation
  const errors = {
    category: form.category === '' ? 'יש לבחור קטגוריה' : '',
    subject: form.subject.length < CONTACT_FORM_LIMITS.subject.min
      ? `לפחות ${CONTACT_FORM_LIMITS.subject.min} תווים`
      : form.subject.length > CONTACT_FORM_LIMITS.subject.max
        ? `עד ${CONTACT_FORM_LIMITS.subject.max} תווים`
        : '',
    message: form.message.length < CONTACT_FORM_LIMITS.message.min
      ? `לפחות ${CONTACT_FORM_LIMITS.message.min} תווים`
      : form.message.length > CONTACT_FORM_LIMITS.message.max
        ? `עד ${CONTACT_FORM_LIMITS.message.max} תווים`
        : '',
  };

  const isValid = !errors.category && !errors.subject && !errors.message && form.category !== '';

  // Handlers
  const handleCategorySelect = useCallback((category: ContactCategory) => {
    setForm(prev => ({ ...prev, category }));
    setTouched(prev => ({ ...prev, category: true }));
  }, []);

  const handleInputChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleBlur = useCallback((field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({ category: true, subject: true, message: true });

    if (!isValid) return;

    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Protection': '1',
        },
        body: JSON.stringify({
          category: form.category,
          subject: form.subject,
          message: form.message,
          website: form.website, // Honeypot
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'שגיאה בשליחת ההודעה');
      }

      setStatus('success');
    } catch (error) {
      setStatus('error');
      setErrorMessage(
        error instanceof Error ? error.message : 'שגיאה בשליחת ההודעה'
      );
    }
  }, [form, isValid]);

  const handleReset = useCallback(() => {
    setForm({ category: '', subject: '', message: '', website: '' });
    setTouched({});
    setStatus('idle');
    setErrorMessage('');
  }, []);

  // =========================================================================
  // RENDER: Success State
  // =========================================================================
  if (status === 'success') {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="text-center"
          >
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 12 }}
              className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/25"
            >
              <CheckCircle2 className="w-12 h-12 text-white" strokeWidth={2.5} />
            </motion.div>

            {/* Success Message */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl md:text-4xl font-bold text-slate-900 mb-4"
            >
              ההודעה נשלחה בהצלחה
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg text-slate-600 mb-8"
            >
              תודה שפנית אלינו! נחזור אליך בהקדם האפשרי.
            </motion.p>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors"
              >
                שלח הודעה נוספת
              </button>

              <a
                href="/"
                className="px-6 py-3 bg-gradient-to-r from-[#2B4699] to-[#3556AB] text-white font-medium rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <ArrowRight className="w-4 h-4" />
                חזרה לדשבורד
              </a>
            </motion.div>
          </motion.div>
        </div>
      </main>
    );
  }

  // =========================================================================
  // RENDER: Form
  // =========================================================================
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
            צור קשר
          </h1>
          <p className="text-lg text-slate-600">
            נשמח לשמוע ממך. בחר קטגוריה ושלח לנו הודעה.
          </p>
        </motion.div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="space-y-8"
        >
          {/* Category Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700">
              מה תרצה לעשות?
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {VALID_CATEGORIES.map((category) => {
                const config = categoryConfig[category];
                const Icon = config.icon;
                const isSelected = form.category === category;

                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => handleCategorySelect(category)}
                    className={`
                      relative p-4 rounded-2xl border-2 transition-all duration-200
                      ${isSelected
                        ? `bg-gradient-to-br ${config.gradient} ${config.borderColor} shadow-lg`
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md'
                      }
                    `}
                  >
                    {/* Selected indicator */}
                    {isSelected && (
                      <motion.div
                        layoutId="selected-category"
                        className="absolute inset-0 rounded-2xl ring-2 ring-[#2B4699] ring-offset-2"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}

                    <div className="relative flex flex-col items-center text-center gap-2">
                      <Icon
                        className={`w-8 h-8 ${isSelected ? 'text-[#2B4699]' : 'text-slate-400'}`}
                        strokeWidth={1.5}
                      />
                      <span className={`font-semibold ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>
                        {config.label}
                      </span>
                      <span className="text-xs text-slate-500">
                        {config.description}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {touched.category && errors.category && (
              <p className="text-sm text-rose-500 mt-1">{errors.category}</p>
            )}
          </div>

          {/* Subject Input */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="subject" className="block text-sm font-medium text-slate-700">
                נושא
              </label>
              <span className={`text-xs ${form.subject.length > CONTACT_FORM_LIMITS.subject.max ? 'text-rose-500' : 'text-slate-400'}`}>
                {form.subject.length}/{CONTACT_FORM_LIMITS.subject.max}
              </span>
            </div>

            <input
              id="subject"
              name="subject"
              type="text"
              value={form.subject}
              onChange={handleInputChange}
              onBlur={() => handleBlur('subject')}
              placeholder="תאר בקצרה את הנושא..."
              className={`
                w-full px-4 py-3 rounded-xl border-2 transition-colors
                focus:outline-none focus:ring-0
                ${touched.subject && errors.subject
                  ? 'border-rose-300 focus:border-rose-400'
                  : 'border-slate-200 focus:border-[#2B4699]'
                }
              `}
              maxLength={CONTACT_FORM_LIMITS.subject.max + 10}
            />

            {touched.subject && errors.subject && (
              <p className="text-sm text-rose-500">{errors.subject}</p>
            )}
          </div>

          {/* Message Textarea */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="message" className="block text-sm font-medium text-slate-700">
                הודעה
              </label>
              <span className={`text-xs ${form.message.length > CONTACT_FORM_LIMITS.message.max ? 'text-rose-500' : 'text-slate-400'}`}>
                {form.message.length}/{CONTACT_FORM_LIMITS.message.max}
              </span>
            </div>

            <textarea
              id="message"
              name="message"
              value={form.message}
              onChange={handleInputChange}
              onBlur={() => handleBlur('message')}
              placeholder="ספר לנו יותר..."
              rows={6}
              className={`
                w-full px-4 py-3 rounded-xl border-2 transition-colors resize-none
                focus:outline-none focus:ring-0
                ${touched.message && errors.message
                  ? 'border-rose-300 focus:border-rose-400'
                  : 'border-slate-200 focus:border-[#2B4699]'
                }
              `}
              maxLength={CONTACT_FORM_LIMITS.message.max + 100}
            />

            {touched.message && errors.message && (
              <p className="text-sm text-rose-500">{errors.message}</p>
            )}
          </div>

          {/* Honeypot - Hidden from users, bots will fill it */}
          <input
            type="text"
            name="website"
            value={form.website}
            onChange={handleInputChange}
            className="hidden"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />

          {/* Error Message */}
          <AnimatePresence>
            {status === 'error' && errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl"
              >
                <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                <p className="text-sm text-rose-700">{errorMessage}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={status === 'loading'}
            className={`
              w-full py-4 rounded-xl font-semibold text-white text-lg
              transition-all duration-200 flex items-center justify-center gap-3
              ${status === 'loading'
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-[#2B4699] to-[#3556AB] hover:opacity-90 shadow-lg shadow-blue-500/25'
              }
            `}
          >
            {status === 'loading' ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                שולח...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                שלח הודעה
              </>
            )}
          </button>
        </motion.form>

        {/* Back Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center"
        >
          <a
            href="/"
            className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            חזרה לדשבורד
          </a>
        </motion.div>
      </div>
    </main>
  );
}

