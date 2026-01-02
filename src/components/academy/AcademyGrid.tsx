'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Home, Shield, X, CheckCircle2, AlertCircle, PiggyBank } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ============================================
// Data Types
// ============================================

type AcademyItem = {
  id: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  themeColor: string;
  themeColorLight: string;
  fullContent: React.ReactNode;
};

// ============================================
// Rich Content Components
// ============================================

function PassiveInvestingContent() {
  return (
    <div className="space-y-6" dir="rtl">
      <p className="text-lg text-slate-700 leading-relaxed">
        מדד S&P 500 מכיל את 500 החברות הגדולות והמשפיעות ביותר בארה״ב. כשאתה משקיע במדד, 
        אתה למעשה קונה חלק קטן מכל אחת מהחברות האלה - מאפל ומיקרוסופט ועד אמזון וגוגל.
      </p>

      <div className="bg-indigo-50 rounded-2xl p-5 space-y-4">
        <h4 className="font-bold text-indigo-900 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-indigo-600" />
          היתרונות של השקעה במדד
        </h4>
        <ul className="space-y-3 text-slate-700">
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
            <div>
              <strong>פיזור אוטומטי:</strong> במקום לבחור מניה אחת ולקוות שהיא תצליח, אתה מפוזר על פני 500 חברות שונות.
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
            <div>
              <strong>עמלות נמוכות:</strong> קרנות מחקות מדד גובות עמלות של 0.03%-0.2% בלבד, לעומת 1-2% בקרנות אקטיביות.
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
            <div>
              <strong>ביצועים מוכחים:</strong> לאורך 30+ שנים, המדד הניב תשואה ממוצעת של כ-10% בשנה (7% אחרי אינפלציה).
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center text-sm font-bold flex-shrink-0">4</span>
            <div>
              <strong>פשטות:</strong> אין צורך לעקוב אחרי חדשות, לנתח דוחות או לתזמן את השוק.
            </div>
          </li>
        </ul>
      </div>

      <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200">
        <h4 className="font-bold text-amber-900 flex items-center gap-2 mb-3">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          מה חשוב לזכור
        </h4>
        <p className="text-amber-800">
          השקעה במדדים מתאימה לטווח ארוך (10+ שנים). בטווח הקצר השוק יכול לרדת 30-50%, 
          אבל היסטורית הוא תמיד התאושש. הסוד הוא להמשיך להשקיע באופן קבוע ולא למכור בפאניקה.
        </p>
      </div>

      <blockquote className="border-r-4 border-indigo-300 pr-4 py-2 text-slate-600 italic">
        ״אל תחפש מחט בערימת שחת. קנה את כל ערימת השחת.״ — ג׳ון בוגל, מייסד Vanguard
      </blockquote>
    </div>
  );
}

function FirstApartmentContent() {
  return (
    <div className="space-y-6" dir="rtl">
      <p className="text-lg text-slate-700 leading-relaxed">
        רכישת דירה היא ההחלטה הפיננסית הגדולה ביותר שרוב האנשים יקבלו בחייהם. 
        שלושה כללים פשוטים יעזרו לך להימנע מטעויות יקרות:
      </p>

      <div className="grid gap-4">
        {/* Rule 1 */}
        <div className="bg-indigo-50 rounded-2xl p-5 border border-indigo-100">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xl font-bold">1</span>
            <h4 className="font-bold text-indigo-900 text-lg">כלל ה-25%: הון עצמי מינימלי</h4>
          </div>
          <p className="text-indigo-800 mb-3">
            הון עצמי של לפחות 25% ממחיר הדירה הוא הכרחי. למה? 
          </p>
          <ul className="text-indigo-700 space-y-1.5">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-500" />
              הבנק מאפשר משכנתא של עד 75% לדירה ראשונה
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-500" />
              הון עצמי גבוה יותר = ריבית נמוכה יותר על המשכנתא
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-500" />
              מגן עליך במקרה של ירידת מחירים בשוק
            </li>
          </ul>
        </div>

        {/* Rule 2 */}
        <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xl font-bold">2</span>
            <h4 className="font-bold text-emerald-900 text-lg">כלל ה-30%: החזר חודשי</h4>
          </div>
          <p className="text-emerald-800 mb-3">
            ההחזר החודשי על המשכנתא לא יעלה על 30% מההכנסה הפנויה נטו של המשפחה.
          </p>
          <ul className="text-emerald-700 space-y-1.5">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              מבטיח שתוכל לעמוד בהחזרים גם בתקופות קשות
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              משאיר מספיק כסף לחיסכון, בילויים וחירום
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              הבנקים עצמם לא יאשרו יותר מ-40%, אבל 30% בטוח יותר
            </li>
          </ul>
        </div>

        {/* Rule 3 */}
        <div className="bg-purple-50 rounded-2xl p-5 border border-purple-100">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center text-xl font-bold">3</span>
            <h4 className="font-bold text-purple-900 text-lg">קרן חירום נפרדת</h4>
          </div>
          <p className="text-purple-800 mb-3">
            לפני שקונים דירה, חובה לשמור קרן חירום של 3-6 חודשי הוצאות.
          </p>
          <ul className="text-purple-700 space-y-1.5">
            <li className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-purple-500" />
              אל תשתמש בכל החיסכון להון עצמי!
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-500" />
              דברים לא צפויים קורים: פיטורים, תיקונים, הוצאות רפואיות
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-500" />
              קרן החירום צריכה להיות נזילה ונפרדת מכסף הדירה
            </li>
          </ul>
        </div>
      </div>

      <div className="bg-slate-100 rounded-2xl p-5 text-center">
        <p className="text-slate-700 font-medium">
          💡 טיפ: אל תזלזל בעלויות הנלוות - מס רכישה, עו״ד, שיפוצים ומעבר יכולים להגיע ל-5-10% נוספים.
        </p>
      </div>
    </div>
  );
}

function PensionTaxesContent() {
  return (
    <div className="space-y-6" dir="rtl">
      <p className="text-lg text-slate-700 leading-relaxed">
        קרן השתלמות היא אחד מאפיקי החיסכון הטובים ביותר בישראל, בזכות הטבות מס משמעותיות 
        שהופכות אותה ל״מקלט מס״ לגיטימי.
      </p>

      <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100">
        <h4 className="font-bold text-emerald-900 flex items-center gap-2 mb-4">
          <PiggyBank className="w-5 h-5 text-emerald-600" />
          הטבות המס בקרן השתלמות
        </h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="font-bold text-emerald-800 mb-2">לשכירים:</p>
            <p className="text-emerald-700">הפקדת עובד (עד 2.5%) + מעסיק (עד 7.5%) = פטור ממס הכנסה על ההפקדות!</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="font-bold text-emerald-800 mb-2">לעצמאים:</p>
            <p className="text-emerald-700">הפקדה של עד 4.5% מההכנסה (עד תקרה) = ניכוי ממס הכנסה</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 rounded-2xl p-5 space-y-3">
        <h4 className="font-bold text-slate-900">מתי אפשר למשוך?</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-4 p-3 bg-white rounded-xl">
            <span className="w-16 text-center font-bold text-slate-500">3 שנים</span>
            <span className="text-slate-700">משיכה עם תשלום מס רווחי הון (25%)</span>
          </div>
          <div className="flex items-center gap-4 p-3 bg-emerald-100 rounded-xl border-2 border-emerald-300">
            <span className="w-16 text-center font-bold text-emerald-600">6 שנים</span>
            <span className="text-emerald-800 font-medium">משיכה ללא מס כלל! (לכל מטרה)</span>
          </div>
        </div>
      </div>

      <div className="bg-purple-50 rounded-2xl p-5 border border-purple-100">
        <h4 className="font-bold text-purple-900 mb-4">הפנסיה - המפתח לביטחון בגיל מבוגר</h4>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-blue-600 mb-1">6%</p>
            <p className="text-xs text-slate-600">הפקדת עובד</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-emerald-600 mb-1">6.5%</p>
            <p className="text-xs text-slate-600">הפקדת מעסיק</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-purple-600 mb-1">6%</p>
            <p className="text-xs text-slate-600">פיצויים</p>
          </div>
        </div>
        <p className="text-purple-800 text-sm">
          הפקדות המעסיק (12.5%) הן כסף שלא היית מקבל אחרת. זיכוי מס של עד 35% על ההפקדות שלך!
        </p>
      </div>

      <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200">
        <h4 className="font-bold text-amber-900 flex items-center gap-2 mb-2">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          שימו לב לדמי הניהול
        </h4>
        <p className="text-amber-800">
          ההבדל בין 0.5% ל-1.5% דמי ניהול יכול להסתכם ב<strong>מאות אלפי שקלים</strong> לאורך חיי העבודה. 
          בדוק את דמי הניהול שלך ואל תתבייש להתמקח או לעבור קרן.
        </p>
      </div>
    </div>
  );
}

// ============================================
// Academy Items Data
// ============================================

const academyItems: AcademyItem[] = [
  {
    id: 'passive-investing',
    title: 'מסלול ההשקעה הפסיבי',
    subtitle: 'למה השקעה במדד S&P 500 היא אחת הדרכים הטובות ביותר לבנות הון לטווח ארוך.',
    icon: TrendingUp,
    themeColor: 'from-indigo-500 to-purple-600',
    themeColorLight: 'bg-indigo-100',
    fullContent: <PassiveInvestingContent />,
  },
  {
    id: 'first-home',
    title: 'הדירה הראשונה',
    subtitle: 'הכללים החשובים ביותר לרכישת דירה חכמה.',
    icon: Home,
    themeColor: 'from-emerald-500 to-teal-600',
    themeColorLight: 'bg-emerald-100',
    fullContent: <FirstApartmentContent />,
  },
  {
    id: 'pension-taxes',
    title: 'פנסיה ומיסים',
    subtitle: 'איך לנצל את הטבות המס ולחסוך אלפי שקלים בשנה.',
    icon: Shield,
    themeColor: 'from-purple-500 to-pink-600',
    themeColorLight: 'bg-purple-100',
    fullContent: <PensionTaxesContent />,
  },
];

// ============================================
// Spring Animation Config
// ============================================

const springTransition = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
};

// ============================================
// Main Component
// ============================================

export default function AcademyGrid() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedItem = academyItems.find(item => item.id === selectedId);

  // Close on ESC key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setSelectedId(null);
    }
  }, []);

  useEffect(() => {
    if (selectedId) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [selectedId, handleKeyDown]);

  const handleCardClick = (item: AcademyItem) => {
    setSelectedId(item.id);
  };

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-indigo-600" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900">למד את הבסיס</h2>
      </div>

      {/* Grid - 3 equal cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {academyItems.map((item) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.id}
              layoutId={item.id}
              onClick={() => handleCardClick(item)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={springTransition}
              className="relative overflow-hidden rounded-2xl p-5 cursor-pointer bg-slate-50 border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/30 transition-colors min-h-[140px]"
            >
              {/* Icon */}
              <motion.div 
                layoutId={`icon-${item.id}`}
                className={`w-10 h-10 rounded-xl ${item.themeColorLight} flex items-center justify-center mb-3`}
              >
                <Icon className="w-5 h-5 text-slate-700" />
              </motion.div>

              {/* Content */}
              <motion.h3 
                layoutId={`title-${item.id}`}
                className="text-base font-bold text-slate-900 mb-1.5"
              >
                {item.title}
              </motion.h3>
              <motion.p 
                layoutId={`subtitle-${item.id}`}
                className="text-sm text-slate-600 leading-relaxed"
              >
                {item.subtitle}
              </motion.p>
            </motion.div>
          );
        })}
      </div>

      {/* Expanded Overlay - Rendered via Portal to document.body */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {selectedId && selectedItem && (
            <>
              {/* Backdrop */}
              <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
                onClick={() => setSelectedId(null)}
                aria-hidden="true"
              />

              {/* Expanded Card - Full Page */}
              <motion.div
                key="expanded-card"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={springTransition}
                className="fixed inset-0 z-[9999] bg-white overflow-hidden flex flex-col"
                role="dialog"
                aria-modal="true"
                aria-labelledby="expanded-title"
              >
                {/* Header with gradient */}
                <div className={`bg-gradient-to-br ${selectedItem.themeColor} p-6 md:p-8 flex-shrink-0`}>
                  <div className="flex items-start justify-between max-w-4xl mx-auto">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <selectedItem.icon className="w-7 h-7 md:w-8 md:h-8 text-white" />
                      </div>
                      <div>
                        <h2 
                          id="expanded-title"
                          className="text-xl md:text-2xl font-bold text-white"
                        >
                          {selectedItem.title}
                        </h2>
                        <p className="text-white/80 text-sm md:text-base mt-1">
                          {selectedItem.subtitle}
                        </p>
                      </div>
                    </div>

                    {/* Close button */}
                    <button
                      onClick={() => setSelectedId(null)}
                      className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
                      aria-label="סגור"
                    >
                      <X className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8">
                  <div className="max-w-4xl mx-auto">
                    {selectedItem.fullContent}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
