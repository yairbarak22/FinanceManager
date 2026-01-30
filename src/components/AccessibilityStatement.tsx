'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Accessibility, Plus, Minus, RotateCcw, Eye, Link2, Pause, Play, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAccessibility } from '@/context/AccessibilityContext';

// Accessibility settings interface
interface AccessibilitySettings {
  fontSize: number; // Percentage (100 = default)
  highContrast: boolean;
  highlightLinks: boolean;
  pauseAnimations: boolean;
}

const DEFAULT_SETTINGS: AccessibilitySettings = {
  fontSize: 100,
  highContrast: false,
  highlightLinks: false,
  pauseAnimations: false,
};

const STORAGE_KEY = 'neto-accessibility-settings';

export function AccessibilityStatement() {
  const { isAccessibilityOpen: isOpen, closeAccessibility } = useAccessibility();
  
  const setIsOpen = (value: boolean) => {
    if (!value) {
      closeAccessibility();
    }
  };
  const [activeTab, setActiveTab] = useState<'settings' | 'statement'>('settings');
  const [settings, setSettings] = useState<AccessibilitySettings>(DEFAULT_SETTINGS);
  const [mounted, setMounted] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch (e) {
      console.error('Error loading accessibility settings:', e);
    }
  }, []);

  // Apply settings to the document
  useEffect(() => {
    if (!mounted) return;

    const html = document.documentElement;
    const body = document.body;

    // Font size
    html.style.fontSize = `${settings.fontSize}%`;

    // High contrast mode
    if (settings.highContrast) {
      body.classList.add('high-contrast');
    } else {
      body.classList.remove('high-contrast');
    }

    // Highlight links
    if (settings.highlightLinks) {
      body.classList.add('highlight-links');
    } else {
      body.classList.remove('highlight-links');
    }

    // Pause animations
    if (settings.pauseAnimations) {
      body.classList.add('pause-animations');
    } else {
      body.classList.remove('pause-animations');
    }

    // Save to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Error saving accessibility settings:', e);
    }
  }, [settings, mounted]);

  const updateSetting = useCallback(<K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const increaseFontSize = useCallback(() => {
    setSettings(prev => ({
      ...prev,
      fontSize: Math.min(prev.fontSize + 10, 150)
    }));
  }, []);

  const decreaseFontSize = useCallback(() => {
    setSettings(prev => ({
      ...prev,
      fontSize: Math.max(prev.fontSize - 10, 80)
    }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  const isModified = JSON.stringify(settings) !== JSON.stringify(DEFAULT_SETTINGS);

  return (
    <>
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
            className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 id="a11y-title" className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Accessibility className="w-5 h-5 text-indigo-600" aria-hidden="true" />
                נגישות
              </h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-full hover:bg-slate-100 transition-colors"
                aria-label="סגור"
              >
                <X className="w-5 h-5 text-slate-500" aria-hidden="true" />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-gray-100" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'settings'}
                onClick={() => setActiveTab('settings')}
                className={cn(
                  'flex-1 py-3 text-sm font-medium transition-colors',
                  activeTab === 'settings'
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                התאמות תצוגה
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'statement'}
                onClick={() => setActiveTab('statement')}
                className={cn(
                  'flex-1 py-3 text-sm font-medium transition-colors',
                  activeTab === 'statement'
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                הצהרת נגישות
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4" dir="rtl">
              {activeTab === 'settings' && (
                <div className="space-y-4">
                  {/* Font Size Control */}
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-slate-900 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-500" aria-hidden="true" />
                        גודל טקסט
                      </span>
                      <span className="text-sm text-slate-500">{settings.fontSize}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={decreaseFontSize}
                        disabled={settings.fontSize <= 80}
                        className="flex-1 py-2 px-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                        aria-label="הקטן טקסט"
                      >
                        <Minus className="w-4 h-4" aria-hidden="true" />
                        <span className="text-sm">הקטן</span>
                      </button>
                      <button
                        type="button"
                        onClick={increaseFontSize}
                        disabled={settings.fontSize >= 150}
                        className="flex-1 py-2 px-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                        aria-label="הגדל טקסט"
                      >
                        <Plus className="w-4 h-4" aria-hidden="true" />
                        <span className="text-sm">הגדל</span>
                      </button>
                    </div>
                  </div>

                  {/* High Contrast Toggle */}
                  <button
                    type="button"
                    onClick={() => updateSetting('highContrast', !settings.highContrast)}
                    className={cn(
                      'w-full flex items-center justify-between p-4 rounded-xl transition-colors',
                      settings.highContrast
                        ? 'bg-indigo-100 border-2 border-indigo-500'
                        : 'bg-slate-50 hover:bg-slate-100'
                    )}
                    aria-pressed={settings.highContrast}
                  >
                    <span className="font-medium text-slate-900 flex items-center gap-2">
                      <Eye className="w-4 h-4 text-slate-500" aria-hidden="true" />
                      ניגודיות גבוהה
                    </span>
                    <span className={cn(
                      'w-10 h-6 rounded-full transition-colors relative',
                      settings.highContrast ? 'bg-indigo-600' : 'bg-slate-300'
                    )}>
                      <span className={cn(
                        'absolute top-1 w-4 h-4 rounded-full bg-white transition-all',
                        settings.highContrast ? 'right-1' : 'left-1'
                      )} />
                    </span>
                  </button>

                  {/* Highlight Links Toggle */}
                  <button
                    type="button"
                    onClick={() => updateSetting('highlightLinks', !settings.highlightLinks)}
                    className={cn(
                      'w-full flex items-center justify-between p-4 rounded-xl transition-colors',
                      settings.highlightLinks
                        ? 'bg-indigo-100 border-2 border-indigo-500'
                        : 'bg-slate-50 hover:bg-slate-100'
                    )}
                    aria-pressed={settings.highlightLinks}
                  >
                    <span className="font-medium text-slate-900 flex items-center gap-2">
                      <Link2 className="w-4 h-4 text-slate-500" aria-hidden="true" />
                      הדגשת קישורים
                    </span>
                    <span className={cn(
                      'w-10 h-6 rounded-full transition-colors relative',
                      settings.highlightLinks ? 'bg-indigo-600' : 'bg-slate-300'
                    )}>
                      <span className={cn(
                        'absolute top-1 w-4 h-4 rounded-full bg-white transition-all',
                        settings.highlightLinks ? 'right-1' : 'left-1'
                      )} />
                    </span>
                  </button>

                  {/* Pause Animations Toggle */}
                  <button
                    type="button"
                    onClick={() => updateSetting('pauseAnimations', !settings.pauseAnimations)}
                    className={cn(
                      'w-full flex items-center justify-between p-4 rounded-xl transition-colors',
                      settings.pauseAnimations
                        ? 'bg-indigo-100 border-2 border-indigo-500'
                        : 'bg-slate-50 hover:bg-slate-100'
                    )}
                    aria-pressed={settings.pauseAnimations}
                  >
                    <span className="font-medium text-slate-900 flex items-center gap-2">
                      {settings.pauseAnimations ? (
                        <Play className="w-4 h-4 text-slate-500" aria-hidden="true" />
                      ) : (
                        <Pause className="w-4 h-4 text-slate-500" aria-hidden="true" />
                      )}
                      עצור אנימציות
                    </span>
                    <span className={cn(
                      'w-10 h-6 rounded-full transition-colors relative',
                      settings.pauseAnimations ? 'bg-indigo-600' : 'bg-slate-300'
                    )}>
                      <span className={cn(
                        'absolute top-1 w-4 h-4 rounded-full bg-white transition-all',
                        settings.pauseAnimations ? 'right-1' : 'left-1'
                      )} />
                    </span>
                  </button>

                  {/* Reset Button */}
                  {isModified && (
                    <button
                      type="button"
                      onClick={resetSettings}
                      className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" aria-hidden="true" />
                      איפוס להגדרות ברירת מחדל
                    </button>
                  )}
                </div>
              )}

              {activeTab === 'statement' && (
                <div className="space-y-4 text-slate-700">
                  <section>
                    <h3 className="font-semibold text-slate-900 mb-2">מחויבות לנגישות</h3>
                    <p className="text-sm leading-relaxed">
                      אנו מחויבים להנגשת האתר והשירותים שלנו לכלל הציבור, כולל אנשים עם מוגבלויות,
                      בהתאם לתקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), התשע"ג-2013
                      ותקן ישראלי 5568.
                    </p>
                  </section>

                  <section>
                    <h3 className="font-semibold text-slate-900 mb-2">רמת הנגישות</h3>
                    <p className="text-sm leading-relaxed">
                      האתר עומד בדרישות תקן WCAG 2.1 ברמת AA, הכולל:
                    </p>
                    <ul className="text-sm list-disc list-inside mt-2 space-y-1">
                      <li>תמיכה בניווט מקלדת</li>
                      <li>ניגודיות צבעים מספקת</li>
                      <li>תאימות לקוראי מסך</li>
                      <li>תמיכה בשינוי גודל טקסט</li>
                      <li>אפשרות לעצירת אנימציות</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="font-semibold text-slate-900 mb-2">דרכי התקשרות לנושא נגישות</h3>
                    <p className="text-sm leading-relaxed">
                      נתקלתם בבעיית נגישות? נשמח לשמוע ולסייע.
                    </p>
                    <div className="mt-2 text-sm space-y-1">
                      <p>
                        <span className="font-medium">דוא"ל: </span>
                        <a
                          href="mailto:accessibility@myneto.co.il"
                          className="text-indigo-600 hover:underline"
                        >
                          accessibility@myneto.co.il
                        </a>
                      </p>
                    </div>
                  </section>

                  <section>
                    <h3 className="font-semibold text-slate-900 mb-2">תאריך עדכון</h3>
                    <p className="text-sm">
                      הצהרה זו עודכנה לאחרונה בתאריך: ינואר 2026
                    </p>
                  </section>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
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
