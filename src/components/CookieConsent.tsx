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
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 p-5">
        <div className="flex items-start gap-4">
          {/* Cookie Icon */}
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Cookie className="w-6 h-6 text-amber-600" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 mb-1">
              אנחנו משתמשים בעוגיות
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              אנחנו משתמשים בעוגיות כדי לשפר את חווית השימוש ולנתח את השימוש באתר.
              לא נשלח נתונים פיננסיים אישיים - רק מידע סטטיסטי על השימוש באפליקציה.
            </p>
          </div>
        </div>

        {/* Button */}
        <div className="flex items-center justify-center mt-4">
          <button
            onClick={handleAccept}
            className="w-full px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
          >
            אישור
          </button>
        </div>
      </div>
    </div>
  );
}
