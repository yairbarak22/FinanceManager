'use client';

import { useState, useEffect } from 'react';
import { Cookie } from 'lucide-react';

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('analytics-consent');
    if (consent === null) {
      // No choice made yet, show banner after a short delay
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('analytics-consent', 'true');
    setShowBanner(false);
    // Dispatch event to trigger analytics loading
    window.dispatchEvent(new Event('analytics-consent-change'));
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 animate-slide-up">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-[#F7F7F8] p-5">
        <div className="flex items-start gap-4">
          {/* Cookie Icon */}
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Cookie className="w-6 h-6 text-amber-600" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-[#303150] font-[var(--font-nunito)] mb-1">
              אנחנו משתמשים בעוגיות
            </h3>
            <p className="text-sm text-[#7E7F90] font-[var(--font-nunito)] leading-relaxed">
              אנחנו משתמשים בעוגיות כדי לשפר את חווית השימוש ולנתח את השימוש באתר.
              לא נשלח נתונים פיננסיים אישיים - רק מידע סטטיסטי על השימוש באפליקציה.
            </p>
          </div>
        </div>

        {/* Button */}
        <div className="flex items-center justify-end mt-4">
          <button
            onClick={handleAccept}
            className="px-5 py-2.5 bg-[#69ADFF] hover:bg-[#5A9EE6] text-white text-sm font-medium font-[var(--font-nunito)] rounded-xl transition-all shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
          >
            אישור
          </button>
        </div>
      </div>
    </div>
  );
}
