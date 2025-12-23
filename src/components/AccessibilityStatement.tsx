'use client';

import { useState } from 'react';
import { X, Accessibility } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AccessibilityStatement() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Accessibility Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-4 left-4 z-40',
          'w-10 h-10 rounded-full',
          'bg-gray-600 hover:bg-gray-700 text-white',
          'flex items-center justify-center',
          'shadow-lg transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500'
        )}
        aria-label="הצהרת נגישות"
        title="הצהרת נגישות"
      >
        <Accessibility className="w-5 h-5" />
      </button>

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setIsOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="a11y-title"
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 id="a11y-title" className="text-lg font-bold text-gray-900">
                הצהרת נגישות
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="סגור"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 text-gray-700 text-right" dir="rtl">
              <section>
                <h3 className="font-semibold text-gray-900 mb-2">מחויבות לנגישות</h3>
                <p className="text-sm leading-relaxed">
                  אנו מחויבים להנגשת האתר והשירותים שלנו לכלל הציבור, כולל אנשים עם מוגבלויות,
                  בהתאם לתקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), התשע"ג-2013
                  ותקן ישראלי 5568.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-gray-900 mb-2">רמת הנגישות</h3>
                <p className="text-sm leading-relaxed">
                  האתר עומד בדרישות תקן WCAG 2.1 ברמת AA, הכולל:
                </p>
                <ul className="text-sm list-disc list-inside mt-2 space-y-1">
                  <li>תמיכה בניווט מקלדת</li>
                  <li>ניגודיות צבעים מספקת</li>
                  <li>תאימות לקוראי מסך</li>
                  <li>תמיכה בשינוי גודל טקסט</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-gray-900 mb-2">דרכי התקשרות לנושא נגישות</h3>
                <p className="text-sm leading-relaxed">
                  נתקלתם בבעיית נגישות? נשמח לשמוע ולסייע.
                </p>
                <div className="mt-2 text-sm space-y-1">
                  <p>
                    <span className="font-medium">דוא"ל: </span>
                    <a
                      href="mailto:accessibility@financemanager.co.il"
                      className="text-violet-600 hover:underline"
                    >
                      accessibility@financemanager.co.il
                    </a>
                  </p>
                </div>
              </section>

              <section>
                <h3 className="font-semibold text-gray-900 mb-2">תאריך עדכון</h3>
                <p className="text-sm">
                  הצהרה זו עודכנה לאחרונה בתאריך: דצמבר 2024
                </p>
              </section>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
              >
                סגור
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

