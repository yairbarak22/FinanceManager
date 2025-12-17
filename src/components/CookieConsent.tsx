'use client';

import { useState, useEffect } from 'react';
import { Cookie, X } from 'lucide-react';

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

  const handleDecline = () => {
    localStorage.setItem('analytics-consent', 'false');
    setShowBanner(false);
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
            <h3 className="font-semibold text-gray-900 mb-1">
              אנחנו משתמשים בעוגיות
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              אנחנו משתמשים בעוגיות כדי לשפר את חווית השימוש ולנתח את השימוש באתר.
              לא נשלח נתונים פיננסיים אישיים - רק מידע סטטיסטי על השימוש באפליקציה.
            </p>
          </div>

          {/* Close button for mobile */}
          <button
            onClick={handleDecline}
            className="md:hidden p-1 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="סגור"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 mt-4">
          <button
            onClick={handleDecline}
            className="hidden md:block px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            לא תודה
          </button>
          <button
            onClick={handleAccept}
            className="px-6 py-2.5 bg-pink-500 hover:bg-pink-600 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
          >
            אישור
          </button>
        </div>
      </div>
    </div>
  );
}

