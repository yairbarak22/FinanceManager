'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Send, Loader2, Gift, CheckCircle, Calculator, Users, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { apiFetch } from '@/lib/utils';

interface UnlockOverlayProps {
  onInviteSent: () => void;
  pendingInvites?: number;
}

export default function UnlockOverlay({ onInviteSent, pendingInvites = 0 }: UnlockOverlayProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const validateEmail = (emailValue: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailValue);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('נא להזין כתובת אימייל');
      return;
    }

    if (!validateEmail(email)) {
      setError('כתובת אימייל לא תקינה');
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiFetch('/api/calculators/invite', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() }),
      });

      let data;
      try {
        data = await response.json();
      } catch {
        setError('שגיאה בתקשורת עם השרת');
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        setError(data.error || 'שגיאה בשליחת ההזמנה');
        setIsLoading(false);
        return;
      }

      // Fire confetti celebration
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#0DBACC', '#69ADFF', '#9F7FE0'],
      });

      setSuccess(true);
      setEmail('');
      onInviteSent();
    } catch (err) {
      console.error('Invite error:', err);
      setError('שגיאה בשליחת ההזמנה. נסה שוב.');
    } finally {
      setIsLoading(false);
    }
  };

  // Features list for the unlock card
  const features = [
    { icon: Calculator, text: 'מחשבון משכנתא' },
    { icon: Calculator, text: 'מחשבון שכר נטו/ברוטו' },
    { icon: Calculator, text: 'מחשבון FIRE' },
    { icon: Calculator, text: 'ועוד 3 מחשבונים נוספים...' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="absolute top-6 inset-x-0 flex justify-center z-20 px-4"
    >
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] p-6 max-w-lg w-full border border-[#E8E8ED]">
        {success ? (
          // Success state
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-gradient-to-br from-[#B4F1F1] to-[#0DBACC] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-[#303150] mb-2">
              ההזמנה נשלחה בהצלחה! 🎉
            </h3>
            <p className="text-sm text-[#7E7F90] mb-4 max-w-sm mx-auto">
              שלחנו הזמנה לחבר שלך. ברגע שהוא יירשם ל-NETO, כל המחשבונים ייפתחו לך אוטומטית.
            </p>
            <button
              onClick={() => setSuccess(false)}
              className="text-sm text-[#69ADFF] hover:text-[#5A9EE6] font-medium hover:underline transition-colors"
            >
              רוצה להזמין עוד חבר? לחץ כאן
            </button>
          </div>
        ) : (
          <>
            {/* Header with icon */}
            <div className="flex items-start gap-4 mb-5">
              <div className="w-14 h-14 bg-gradient-to-br from-[#69ADFF] via-[#9F7FE0] to-[#F18AB5] rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <Gift className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-[#303150] mb-1">
                  פתח גישה ל-6 מחשבונים פיננסיים
                </h3>
                <p className="text-sm text-[#7E7F90]">
                  הזמן חבר להצטרף ל-NETO וקבל גישה מלאה לכל הכלים שלנו - בחינם!
                </p>
              </div>
            </div>

            {/* Features preview */}
            <div className="bg-gradient-to-br from-[#F7F7F8] to-[#EEEEF2] rounded-xl p-4 mb-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-[#9F7FE0]" />
                <span className="text-xs font-medium text-[#7E7F90]">מה תקבל?</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-[#303150]">
                    <feature.icon className="w-4 h-4 text-[#0DBACC]" />
                    <span>{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pending invites indicator */}
            {pendingInvites > 0 && (
              <div className="bg-[#FFF8E6] border border-[#FFE4A0] rounded-xl px-4 py-3 mb-4 flex items-center gap-3">
                <Users className="w-5 h-5 text-[#E9A800]" />
                <p className="text-sm text-[#7E7F90]">
                  יש לך <span className="font-bold text-[#303150]">{pendingInvites}</span> הזמנות ממתינות לאישור
                </p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#303150] mb-2">
                  כתובת האימייל של החבר
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  placeholder="example@email.com"
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-white border border-[#E8E8ED] rounded-xl 
                             text-base text-[#303150] placeholder-[#BDBDCB]
                             focus:outline-none focus:border-[#69ADFF] focus:ring-2 focus:ring-[#69ADFF]/20
                             disabled:opacity-60 disabled:cursor-not-allowed
                             transition-all duration-200"
                  dir="ltr"
                />
                {error && (
                  <p className="text-[#F18AB5] text-sm mt-2 flex items-center gap-1">
                    <span>⚠️</span> {error}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 
                           bg-gradient-to-r from-[#69ADFF] to-[#9F7FE0] hover:from-[#5A9EE6] hover:to-[#8F6FD0] text-white 
                           text-base font-semibold px-5 py-3.5 rounded-xl
                           shadow-lg hover:shadow-xl
                           disabled:opacity-60 disabled:cursor-not-allowed
                           transition-all duration-200"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>שולח הזמנה...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>שלח הזמנה ופתח גישה</span>
                  </>
                )}
              </button>
            </form>

            {/* FOMO line */}
            <div className="bg-gradient-to-r from-[#0DBACC]/10 to-[#9F7FE0]/10 border border-[#0DBACC]/20 rounded-xl px-4 py-3 mt-4">
              <p className="text-sm text-[#303150] text-center">
                <span className="font-semibold">💡 ידעת?</span> שימוש במחשבונים הפיננסיים שלנו עוזר לקבל החלטות חכמות וחוסך בממוצע <span className="font-bold text-[#0DBACC]">עשרות אלפי שקלים</span>
              </p>
            </div>

            {/* Note */}
            <div className="flex items-center justify-center gap-2 mt-3 text-xs text-[#BDBDCB]">
              <Lock className="w-3.5 h-3.5" />
              <span>הגישה נפתחת אוטומטית ברגע שהחבר נרשם לאתר</span>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
