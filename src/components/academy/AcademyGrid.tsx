'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Home, Shield, X, CheckCircle2, AlertCircle, PiggyBank, Umbrella, Flame, Heart, Target, Calculator, Percent, Brain, CreditCard, TrendingDown, Compass } from 'lucide-react';
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

function EmergencyFundContent() {
  return (
    <div className="space-y-6" dir="rtl">
      <p className="text-lg text-slate-700 leading-relaxed">
        קרן חירום היא הבסיס לכל תכנון פיננסי נכון. לפני שמתחילים להשקיע, לפני שקונים דירה - 
        קודם כל בונים כרית ביטחון נזילה שתגן עליכם במקרה של אירוע לא צפוי.
      </p>

      <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
        <h4 className="font-bold text-blue-900 flex items-center gap-2 mb-4">
          <Umbrella className="w-5 h-5 text-blue-600" />
          כמה כסף צריך בקרן חירום?
        </h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-3xl font-bold text-blue-600 mb-2">3-6</p>
            <p className="text-blue-800 font-medium">חודשי הוצאות</p>
            <p className="text-sm text-blue-700 mt-2">
              אם יש לך משרה יציבה, 3 חודשים מספיקים. פרילנסרים ועצמאים - לפחות 6 חודשים.
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-xl font-bold text-blue-600 mb-2">חישוב מהיר</p>
            <p className="text-sm text-blue-700">
              הוצאות חודשיות (שכירות, אוכל, חשבונות, הלוואות) × מספר החודשים = סכום היעד שלך
            </p>
          </div>
        </div>
      </div>

      <div className="bg-emerald-50 rounded-2xl p-5 space-y-3 border border-emerald-100">
        <h4 className="font-bold text-emerald-900">איפה לשמור את הכסף?</h4>
        <ul className="space-y-2 text-emerald-800">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
            <span><strong>פק״מ (פיקדון קצר מועד):</strong> נזיל, בטוח, ריבית קטנה אבל יציבה</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
            <span><strong>עו״ש עם ריבית:</strong> חלק מהבנקים מציעים ריבית על עו״ש</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
            <span><strong>קרן כספית:</strong> סיכון אפסי, נזילות מלאה, תשואה צמודה לריבית בנק ישראל</span>
          </li>
        </ul>
      </div>

      <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200">
        <h4 className="font-bold text-amber-900 flex items-center gap-2 mb-3">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          מה זה לא קרן חירום
        </h4>
        <ul className="space-y-2 text-amber-800 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-amber-600">✗</span>
            <span>לא מושקע במניות או קרנות - צריך להיות נגיש תוך ימים</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-600">✗</span>
            <span>לא נוגעים בו לחופשות, קניות או הזדמנויות - זה רק לחירום אמיתי</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-600">✗</span>
            <span>לא קרן השתלמות או פנסיה - אלה נעולים ויש עליהם קנסות</span>
          </li>
        </ul>
      </div>

      <div className="bg-slate-100 rounded-2xl p-5 text-center">
        <p className="text-slate-700 font-medium">
          💡 הכלל: קודם קרן חירום, אחר כך השקעות. אל תדלגו על השלב הזה!
        </p>
      </div>
    </div>
  );
}

function FIREContent() {
  return (
    <div className="space-y-6" dir="rtl">
      <p className="text-lg text-slate-700 leading-relaxed">
        FIRE (Financial Independence, Retire Early) היא תנועה שמטרתה להגיע לעצמאות כלכלית מוקדמת - 
        הנקודה שבה ההכנסות הפסיביות שלכם מכסות את כל ההוצאות, ואתם יכולים לבחור אם לעבוד או לא.
      </p>

      <div className="bg-orange-50 rounded-2xl p-5 border border-orange-100">
        <h4 className="font-bold text-orange-900 flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-orange-600" />
          כלל ה-4% (או: כלל ה-25)
        </h4>
        <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
          <p className="text-center">
            <span className="text-4xl font-bold text-orange-600">25×</span>
            <span className="text-lg text-slate-600 mr-2">ההוצאות השנתיות</span>
          </p>
          <p className="text-center text-sm text-slate-500 mt-2">= הסכום שצריך כדי לפרוש</p>
        </div>
        <p className="text-orange-800 text-sm">
          אם ההוצאות השנתיות שלכם הן 120,000₪, תצטרכו 3,000,000₪ כדי להגיע לחירות כלכלית.
          הרעיון: משיכה של 4% בשנה מאפשרת לתיק ההשקעות לשרוד לנצח (סטטיסטית).
        </p>
      </div>

      <div className="bg-slate-50 rounded-2xl p-5 space-y-4">
        <h4 className="font-bold text-slate-900">שיעור החיסכון - המפתח האמיתי</h4>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <p className="text-xl font-bold text-red-500">10%</p>
            <p className="text-xs text-slate-600">51 שנה לפרישה</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <p className="text-xl font-bold text-amber-500">30%</p>
            <p className="text-xs text-slate-600">28 שנה לפרישה</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-sm border-2 border-emerald-300">
            <p className="text-xl font-bold text-emerald-600">50%</p>
            <p className="text-xs text-slate-600">17 שנה לפרישה</p>
          </div>
        </div>
        <p className="text-sm text-slate-600">
          שיעור החיסכון חשוב יותר מהמשכורת! מי שחוסך 50% מההכנסה יגיע לחירות כלכלית הרבה לפני מי שמרוויח פי 2 אבל חוסך רק 10%.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
          <h4 className="font-bold text-emerald-900 mb-2">Lean FIRE</h4>
          <p className="text-sm text-emerald-800">
            חיים צנועים עם הוצאות נמוכות. מטרה: 1.5-2 מיליון ₪. מתאים למי שמוכן לחיות בפשטות.
          </p>
        </div>
        <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
          <h4 className="font-bold text-purple-900 mb-2">Fat FIRE</h4>
          <p className="text-sm text-purple-800">
            רמת חיים גבוהה גם בפרישה. מטרה: 5+ מיליון ₪. דורש הכנסה גבוהה או זמן ארוך יותר.
          </p>
        </div>
      </div>

      <blockquote className="border-r-4 border-orange-300 pr-4 py-2 text-slate-600 italic">
        ״חירות כלכלית זה לא להיות עשיר - זה לא להיות תלוי בעבודה כדי לחיות.״
      </blockquote>
    </div>
  );
}

function InsuranceContent() {
  return (
    <div className="space-y-6" dir="rtl">
      <p className="text-lg text-slate-700 leading-relaxed">
        ביטוח הוא כלי להגנה מפני אסונות כלכליים - לא דרך להתעשר. הכלל: מבטחים רק דברים שאי אפשר לשלם עליהם מכיס.
      </p>

      <div className="bg-rose-50 rounded-2xl p-5 border border-rose-100">
        <h4 className="font-bold text-rose-900 flex items-center gap-2 mb-4">
          <Heart className="w-5 h-5 text-rose-600" />
          ביטוח חיים - ריסק בלבד!
        </h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border-2 border-emerald-300">
            <p className="font-bold text-emerald-700 mb-2">✓ ביטוח ריסק</p>
            <ul className="text-sm text-slate-700 space-y-1">
              <li>• זול משמעותית</li>
              <li>• כיסוי גבוה</li>
              <li>• פשוט להבנה</li>
              <li>• ההמלצה של הסולידית</li>
            </ul>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border-2 border-red-200">
            <p className="font-bold text-red-700 mb-2">✗ ביטוח מעורב</p>
            <ul className="text-sm text-slate-700 space-y-1">
              <li>• יקר מאוד</li>
              <li>• עמלות גבוהות</li>
              <li>• מסובך ולא שקוף</li>
              <li>• תשואה נמוכה</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
        <h4 className="font-bold text-blue-900 mb-3">אובדן כושר עבודה - הביטוח הכי חשוב!</h4>
        <p className="text-blue-800 mb-3">
          מה קורה אם לא תוכל לעבוד בגלל מחלה או תאונה? זה הסיכון הגדול באמת.
        </p>
        <ul className="space-y-2 text-blue-800 text-sm">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <span>כיסוי של 75% מההכנסה הוא סטנדרטי</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <span>בדוק אם יש לך כבר דרך הפנסיה (לרוב יש, אבל צריך להשלים)</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <span>עדיף לקנות בגיל צעיר - הפרמיה נקבעת לפי גיל ההצטרפות</span>
          </li>
        </ul>
      </div>

      <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200">
        <h4 className="font-bold text-amber-900 flex items-center gap-2 mb-3">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          מה לא צריך לבטח
        </h4>
        <ul className="space-y-2 text-amber-800 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-amber-600">✗</span>
            <span>מכשירי חשמל זולים - עדיף לשים כסף בצד</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-600">✗</span>
            <span>אחריות מורחבת - רוב הפעמים לא שווה</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-600">✗</span>
            <span>ביטוח נסיעות לטיסות קצרות וזולות</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-600">✗</span>
            <span>ביטוח לחיות מחמד (אלא אם זה כלב יקר מאוד)</span>
          </li>
        </ul>
      </div>

      <div className="bg-slate-100 rounded-2xl p-5 text-center">
        <p className="text-slate-700 font-medium">
          💡 הכלל: תבטח מה שאתה לא יכול להרשות לעצמך להפסיד. את השאר - שמור בקרן חירום.
        </p>
      </div>
    </div>
  );
}

function ManagementFeesContent() {
  return (
    <div className="space-y-6" dir="rtl">
      <p className="text-lg text-slate-700 leading-relaxed">
        דמי ניהול הם האויב השקט של המשקיע. הם נראים קטנים - 1%, 1.5% - אבל לאורך זמן הם אוכלים 
        חלק עצום מהכסף שלכם. זה ההפסד היחיד שמובטח לכם בהשקעות.
      </p>

      <div className="bg-red-50 rounded-2xl p-5 border border-red-100">
        <h4 className="font-bold text-red-900 flex items-center gap-2 mb-4">
          <Percent className="w-5 h-5 text-red-600" />
          ההבדל בין 0.1% ל-1% דמי ניהול
        </h4>
        <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
          <p className="text-sm text-slate-600 mb-3">השקעה של 500,000₪ במשך 30 שנה בתשואה של 7%:</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-emerald-50 rounded-xl border border-emerald-200">
              <p className="text-xs text-emerald-600 mb-1">דמי ניהול 0.1%</p>
              <p className="text-2xl font-bold text-emerald-700">3,574,000₪</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-xl border border-red-200">
              <p className="text-xs text-red-600 mb-1">דמי ניהול 1%</p>
              <p className="text-2xl font-bold text-red-700">2,650,000₪</p>
            </div>
          </div>
          <p className="text-center mt-3 text-red-700 font-bold">
            הפסד של כמעט מיליון ש״ח! 💸
          </p>
        </div>
      </div>

      <div className="bg-slate-50 rounded-2xl p-5 space-y-3">
        <h4 className="font-bold text-slate-900">איפה לבדוק ולהוריד דמי ניהול?</h4>
        <ul className="space-y-2 text-slate-700">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
            <span><strong>פנסיה:</strong> התקשר לקרן וביקש הנחה. רוב האנשים משלמים יותר מדי!</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
            <span><strong>קרן השתלמות:</strong> בדוק את דמי הניהול ועבור לקרן זולה יותר אם צריך</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
            <span><strong>קרנות נאמנות:</strong> העדף קרנות מחקות עם דמי ניהול נמוכים (0.03%-0.3%)</span>
          </li>
        </ul>
      </div>

      <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200">
        <h4 className="font-bold text-amber-900 flex items-center gap-2 mb-2">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          זכרו: דמי ניהול הם ההפסד היחיד שמובטח
        </h4>
        <p className="text-amber-800">
          השוק יכול לעלות או לרדת, אבל דמי הניהול תמיד ייגבו. כל שקל שחוסכים בדמי ניהול 
          הוא שקל שעובד בשבילכם במקום בשביל מנהל הקרן.
        </p>
      </div>

      <blockquote className="border-r-4 border-red-300 pr-4 py-2 text-slate-600 italic">
        ״בעולם ההשקעות, אתה מקבל את מה שאתה לא משלם עליו.״ — ג׳ון בוגל
      </blockquote>
    </div>
  );
}

function InvestorBehaviorContent() {
  return (
    <div className="space-y-6" dir="rtl">
      <p className="text-lg text-slate-700 leading-relaxed">
        ההתנהגות שלכם כמשקיעים חשובה יותר מבחירת ההשקעות. רוב המשקיעים מפסידים כסף לא בגלל 
        השקעות רעות, אלא בגלל החלטות רגשיות בזמנים הלא נכונים.
      </p>

      <div className="bg-teal-50 rounded-2xl p-5 border border-teal-100">
        <h4 className="font-bold text-teal-900 flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-teal-600" />
          מחזור הרגשות של המשקיע
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <p className="text-2xl mb-1">😊</p>
            <p className="text-xs text-slate-600">אופטימיות</p>
            <p className="text-xs text-emerald-600">השוק עולה</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <p className="text-2xl mb-1">🤑</p>
            <p className="text-xs text-slate-600">אופוריה</p>
            <p className="text-xs text-amber-600">קונים בשיא!</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <p className="text-2xl mb-1">😰</p>
            <p className="text-xs text-slate-600">פאניקה</p>
            <p className="text-xs text-red-600">השוק יורד</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <p className="text-2xl mb-1">😱</p>
            <p className="text-xs text-slate-600">ייאוש</p>
            <p className="text-xs text-red-600">מוכרים בתחתית!</p>
          </div>
        </div>
      </div>

      <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100">
        <h4 className="font-bold text-emerald-900 mb-3">הכללים של משקיע נבון</h4>
        <ul className="space-y-3 text-emerald-800">
          <li className="flex items-start gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-200 text-emerald-700 flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
            <span><strong>תמשיך להשקיע בכל מצב:</strong> ירידות הן הזדמנות לקנות בזול</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-200 text-emerald-700 flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
            <span><strong>אל תנסה לתזמן:</strong> זמן בשוק מנצח תזמון שוק - תמיד</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-200 text-emerald-700 flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
            <span><strong>השקעה קבועה:</strong> סכום קבוע כל חודש, בלי לחשוב על מחירים</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-200 text-emerald-700 flex items-center justify-center text-sm font-bold flex-shrink-0">4</span>
            <span><strong>אל תסתכל כל יום:</strong> בדוק את התיק פעם ברבעון - מקסימום</span>
          </li>
        </ul>
      </div>

      <div className="bg-slate-100 rounded-2xl p-5">
        <h4 className="font-bold text-slate-900 mb-3">מה קרה למי שמכר בפאניקה?</h4>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-white rounded-xl p-3 shadow-sm">
            <p className="text-sm text-slate-500">2008</p>
            <p className="text-red-600 font-bold">-50%</p>
            <p className="text-xs text-emerald-600">התאושש תוך 4 שנים</p>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm">
            <p className="text-sm text-slate-500">2020</p>
            <p className="text-red-600 font-bold">-34%</p>
            <p className="text-xs text-emerald-600">התאושש תוך 6 חודשים</p>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm">
            <p className="text-sm text-slate-500">2022</p>
            <p className="text-red-600 font-bold">-25%</p>
            <p className="text-xs text-emerald-600">התאושש תוך שנה</p>
          </div>
        </div>
      </div>

      <blockquote className="border-r-4 border-teal-300 pr-4 py-2 text-slate-600 italic">
        ״שוק ההון הוא מכונה להעברת כסף מהחסרי סבלנות לבעלי סבלנות.״ — וורן באפט
      </blockquote>
    </div>
  );
}

function DebtManagementContent() {
  return (
    <div className="space-y-6" dir="rtl">
      <p className="text-lg text-slate-700 leading-relaxed">
        לא כל החובות שווים. יש חובות שעוזרים לכם לבנות עושר, ויש חובות שהורסים אותו. 
        להבין את ההבדל זה הצעד הראשון לחופש כלכלי.
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100">
          <h4 className="font-bold text-emerald-900 mb-3">✓ חוב ״טוב״</h4>
          <ul className="space-y-2 text-emerald-800 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <span><strong>משכנתא:</strong> ריבית נמוכה, הנכס עולה בערך</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <span><strong>השכלה:</strong> מעלה את כושר ההשתכרות</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <span><strong>עסק עם תוכנית:</strong> ROI ברור וריאלי</span>
            </li>
          </ul>
        </div>
        <div className="bg-red-50 rounded-2xl p-5 border border-red-100">
          <h4 className="font-bold text-red-900 mb-3">✗ חוב רע</h4>
          <ul className="space-y-2 text-red-800 text-sm">
            <li className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <span><strong>כרטיס אשראי:</strong> ריבית 15-25%(!)</span>
            </li>
            <li className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <span><strong>הלוואות צרכניות:</strong> לרכב, לחופשה, לריהוט</span>
            </li>
            <li className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <span><strong>מינוס:</strong> משלמים ריבית על שימוש יומיומי</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
        <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
          <CreditCard className="w-5 h-5 text-slate-600" />
          סדר עדיפויות לפירעון חובות
        </h4>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-red-100 rounded-xl">
            <span className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center font-bold">1</span>
            <div>
              <p className="font-medium text-red-900">חוב כרטיס אשראי</p>
              <p className="text-xs text-red-700">ריבית 15-25% - תמחק קודם!</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-orange-100 rounded-xl">
            <span className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold">2</span>
            <div>
              <p className="font-medium text-orange-900">הלוואות צרכניות</p>
              <p className="text-xs text-orange-700">ריבית 5-12%</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-100 rounded-xl">
            <span className="w-8 h-8 rounded-full bg-slate-500 text-white flex items-center justify-center font-bold">3</span>
            <div>
              <p className="font-medium text-slate-900">משכנתא</p>
              <p className="text-xs text-slate-700">ריבית 3-5% - לא דחוף, יש הטבות מס</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200">
        <h4 className="font-bold text-amber-900 flex items-center gap-2 mb-3">
          <TrendingDown className="w-5 h-5 text-amber-600" />
          מלכודת האשראי
        </h4>
        <p className="text-amber-800 text-sm mb-3">
          חוב של 10,000₪ בכרטיס אשראי בריבית 20% שמשלמים עליו רק מינימום:
        </p>
        <div className="bg-white rounded-xl p-3 text-center">
          <p className="text-sm text-slate-600">זמן לפירעון: <strong className="text-red-600">9 שנים</strong></p>
          <p className="text-sm text-slate-600">סה״כ תשלום: <strong className="text-red-600">21,000₪</strong></p>
          <p className="text-xs text-red-600 mt-2">שילמתם פי 2 על מה שקניתם!</p>
        </div>
      </div>

      <div className="bg-slate-100 rounded-2xl p-5 text-center">
        <p className="text-slate-700 font-medium">
          💡 הכלל: אם אתה לא יכול לשלם במזומן - כנראה שאתה לא יכול להרשות את זה.
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
  {
    id: 'emergency-fund',
    title: 'קרן חירום',
    subtitle: 'למה כל אחד חייב כרית ביטחון נזילה.',
    icon: Umbrella,
    themeColor: 'from-blue-500 to-cyan-600',
    themeColorLight: 'bg-blue-100',
    fullContent: <EmergencyFundContent />,
  },
  {
    id: 'fire',
    title: 'חירות כלכלית - FIRE',
    subtitle: 'הדרך לעצמאות פיננסית מוקדמת.',
    icon: Flame,
    themeColor: 'from-orange-500 to-red-500',
    themeColorLight: 'bg-orange-100',
    fullContent: <FIREContent />,
  },
  {
    id: 'insurance',
    title: 'ביטוחים חיוניים',
    subtitle: 'הגנה על המשפחה בלי לשלם מיותר.',
    icon: Heart,
    themeColor: 'from-rose-500 to-pink-600',
    themeColorLight: 'bg-rose-100',
    fullContent: <InsuranceContent />,
  },
  {
    id: 'management-fees',
    title: 'דמי ניהול - האויב השקט',
    subtitle: 'איך עמלות קטנות אוכלות הון עצום.',
    icon: Percent,
    themeColor: 'from-red-500 to-rose-600',
    themeColorLight: 'bg-red-100',
    fullContent: <ManagementFeesContent />,
  },
  {
    id: 'investor-behavior',
    title: 'התנהגות משקיע נבון',
    subtitle: 'איך להישאר רגוע כשהשוק משתגע.',
    icon: Brain,
    themeColor: 'from-teal-500 to-cyan-600',
    themeColorLight: 'bg-teal-100',
    fullContent: <InvestorBehaviorContent />,
  },
  {
    id: 'debt-management',
    title: 'חובות והלוואות',
    subtitle: 'מתי לקחת הלוואה ומתי לברוח.',
    icon: CreditCard,
    themeColor: 'from-slate-600 to-gray-700',
    themeColorLight: 'bg-slate-200',
    fullContent: <DebtManagementContent />,
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
