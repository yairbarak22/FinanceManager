'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Home, Shield, X, CheckCircle2, AlertCircle, Wallet, Umbrella, Flame, Heart, Target, Calculator, Percent, Brain, CreditCard, TrendingDown, Compass } from 'lucide-react';
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
      <p className="text-lg text-[#303150] leading-relaxed">
        מדד S&P 500 מכיל את 500 החברות הגדולות והמשפיעות ביותר בארה״ב. כשאתה משקיע במדד, 
        אתה למעשה קונה חלק קטן מכל אחת מהחברות האלה - מאפל ומיקרוסופט ועד אמזון וגוגל.
      </p>

      <div className="bg-[#C1DDFF]/30 rounded-3xl p-5 space-y-4">
        <h4 className="font-bold text-indigo-900 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-[#69ADFF]" />
          היתרונות של השקעה במדד
        </h4>
        <ul className="space-y-3 text-[#303150]">
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-[#C1DDFF] text-[#69ADFF] flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
            <div>
              <strong>פיזור אוטומטי:</strong> במקום לבחור מניה אחת ולקוות שהיא תצליח, אתה מפוזר על פני 500 חברות שונות.
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-[#C1DDFF] text-[#69ADFF] flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
            <div>
              <strong>עמלות נמוכות:</strong> קרנות מחקות מדד גובות עמלות של 0.03%-0.2% בלבד, לעומת 1-2% בקרנות אקטיביות.
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-[#C1DDFF] text-[#69ADFF] flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
            <div>
              <strong>ביצועים מוכחים:</strong> לאורך 30+ שנים, המדד הניב תשואה ממוצעת של כ-10% בשנה (7% אחרי אינפלציה).
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-[#C1DDFF] text-[#69ADFF] flex items-center justify-center text-sm font-bold flex-shrink-0">4</span>
            <div>
              <strong>פשטות:</strong> אין צורך לעקוב אחרי חדשות, לנתח דוחות או לתזמן את השוק.
            </div>
          </li>
        </ul>
      </div>

      <div className="bg-[#FFE5B4]/30 rounded-3xl p-5 border border-amber-200">
        <h4 className="font-bold text-amber-900 flex items-center gap-2 mb-3">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          מה חשוב לזכור
        </h4>
        <p className="text-amber-800">
          השקעה במדדים מתאימה לטווח ארוך (10+ שנים). בטווח הקצר השוק יכול לרדת 30-50%, 
          אבל היסטורית הוא תמיד התאושש. הסוד הוא להמשיך להשקיע באופן קבוע ולא למכור בפאניקה.
        </p>
      </div>

      <blockquote className="border-r-4 border-[#69ADFF] pr-4 py-2 text-[#7E7F90] italic">
        ״אל תחפש מחט בערימת שחת. קנה את כל ערימת השחת.״ — ג׳ון בוגל, מייסד Vanguard
      </blockquote>
    </div>
  );
}

function FirstApartmentContent() {
  return (
    <div className="space-y-6" dir="rtl">
      <p className="text-lg text-[#303150] leading-relaxed">
        רכישת דירה היא ההחלטה הפיננסית הגדולה ביותר שרוב האנשים יקבלו בחייהם. 
        שלושה כללים פשוטים יעזרו לך להימנע מטעויות יקרות:
      </p>

      <div className="grid gap-4">
        {/* Rule 1 */}
        <div className="bg-[#C1DDFF]/30 rounded-3xl p-5 border border-[#C1DDFF]">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-10 h-10 rounded-xl bg-[#69ADFF] text-white flex items-center justify-center text-xl font-bold">1</span>
            <h4 className="font-bold text-[#303150] text-lg">כלל ה-25%: הון עצמי מינימלי</h4>
          </div>
          <p className="text-[#303150] mb-3">
            הון עצמי של לפחות 25% ממחיר הדירה הוא הכרחי. למה? 
          </p>
          <ul className="text-[#303150] space-y-1.5">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#69ADFF]" />
              הבנק מאפשר משכנתא של עד 75% לדירה ראשונה
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#69ADFF]" />
              הון עצמי גבוה יותר = ריבית נמוכה יותר על המשכנתא
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#69ADFF]" />
              מגן עליך במקרה של ירידת מחירים בשוק
            </li>
          </ul>
        </div>

        {/* Rule 2 */}
        <div className="bg-[#B4F1F1]/30 rounded-3xl p-5 border border-[#B4F1F1]">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-10 h-10 rounded-xl bg-[#0DBACC] text-white flex items-center justify-center text-xl font-bold">2</span>
            <h4 className="font-bold text-[#303150] text-lg">כלל ה-30%: החזר חודשי</h4>
          </div>
          <p className="text-[#303150] mb-3">
            ההחזר החודשי על המשכנתא לא יעלה על 30% מההכנסה הפנויה נטו של המשפחה.
          </p>
          <ul className="text-[#303150] space-y-1.5">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#0DBACC]" />
              מבטיח שתוכל לעמוד בהחזרים גם בתקופות קשות
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#0DBACC]" />
              משאיר מספיק כסף לחיסכון, בילויים וחירום
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#0DBACC]" />
              הבנקים עצמם לא יאשרו יותר מ-40%, אבל 30% בטוח יותר
            </li>
          </ul>
        </div>

        {/* Rule 3 */}
        <div className="bg-[#E3D6FF]/30 rounded-3xl p-5 border border-[#E3D6FF]">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-10 h-10 rounded-xl bg-[#9F7FE0] text-white flex items-center justify-center text-xl font-bold">3</span>
            <h4 className="font-bold text-[#303150] text-lg">קרן חירום נפרדת</h4>
          </div>
          <p className="text-[#303150] mb-3">
            לפני שקונים דירה, חובה לשמור קרן חירום של 3-6 חודשי הוצאות.
          </p>
          <ul className="text-[#303150] space-y-1.5">
            <li className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#9F7FE0]" />
              אל תשתמש בכל החיסכון להון עצמי!
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#9F7FE0]" />
              דברים לא צפויים קורים: פיטורים, תיקונים, הוצאות רפואיות
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#9F7FE0]" />
              קרן החירום צריכה להיות נזילה ונפרדת מכסף הדירה
            </li>
          </ul>
        </div>
      </div>

      <div className="bg-[#F7F7F8] rounded-3xl p-5 text-center">
        <p className="text-[#303150] font-medium">
          💡 טיפ: אל תזלזל בעלויות הנלוות - מס רכישה, עו״ד, שיפוצים ומעבר יכולים להגיע ל-5-10% נוספים.
        </p>
      </div>
    </div>
  );
}

function PensionTaxesContent() {
  return (
    <div className="space-y-6" dir="rtl">
      <p className="text-lg text-[#303150] leading-relaxed">
        קרן השתלמות היא אחד מאפיקי החיסכון הטובים ביותר בישראל, בזכות הטבות מס משמעותיות 
        שהופכות אותה ל״מקלט מס״ לגיטימי.
      </p>

      <div className="bg-[#B4F1F1]/30 rounded-3xl p-5 border border-[#B4F1F1]">
        <h4 className="font-bold text-[#303150] flex items-center gap-2 mb-4">
          <Wallet className="w-5 h-5 text-[#0DBACC]" />
          הטבות המס בקרן השתלמות
        </h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="font-bold text-[#303150] mb-2">לשכירים:</p>
            <p className="text-[#303150]">הפקדת עובד (עד 2.5%) + מעסיק (עד 7.5%) = פטור ממס הכנסה על ההפקדות!</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="font-bold text-[#303150] mb-2">לעצמאים:</p>
            <p className="text-[#303150]">הפקדה של עד 4.5% מההכנסה (עד תקרה) = ניכוי ממס הכנסה</p>
          </div>
        </div>
      </div>

      <div className="bg-[#F7F7F8] rounded-3xl p-5 space-y-3">
        <h4 className="font-bold text-[#303150]">מתי אפשר למשוך?</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-4 p-3 bg-white rounded-xl">
            <span className="w-16 text-center font-bold text-[#7E7F90]">3 שנים</span>
            <span className="text-[#303150]">משיכה עם תשלום מס רווחי הון (25%)</span>
          </div>
          <div className="flex items-center gap-4 p-3 bg-[#B4F1F1] rounded-xl border-2 border-[#0DBACC]">
            <span className="w-16 text-center font-bold text-[#0DBACC]">6 שנים</span>
            <span className="text-[#303150] font-medium">משיכה ללא מס כלל! (לכל מטרה)</span>
          </div>
        </div>
      </div>

      <div className="bg-[#E3D6FF]/30 rounded-3xl p-5 border border-[#E3D6FF]">
        <h4 className="font-bold text-[#303150] mb-4">הפנסיה - המפתח לביטחון בגיל מבוגר</h4>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-[#69ADFF] mb-1">6%</p>
            <p className="text-xs text-[#7E7F90]">הפקדת עובד</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-[#0DBACC] mb-1">6.5%</p>
            <p className="text-xs text-[#7E7F90]">הפקדת מעסיק</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-[#9F7FE0] mb-1">6%</p>
            <p className="text-xs text-[#7E7F90]">פיצויים</p>
          </div>
        </div>
        <p className="text-[#303150] text-sm">
          הפקדות המעסיק (12.5%) הן כסף שלא היית מקבל אחרת. זיכוי מס של עד 35% על ההפקדות שלך!
        </p>
      </div>

      <div className="bg-[#FFE5B4]/30 rounded-3xl p-5 border border-amber-200">
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
      <p className="text-lg text-[#303150] leading-relaxed">
        קרן חירום היא הבסיס לכל תכנון פיננסי נכון. לפני שמתחילים להשקיע, לפני שקונים דירה - 
        קודם כל בונים כרית ביטחון נזילה שתגן עליכם במקרה של אירוע לא צפוי.
      </p>

      <div className="bg-[#C1DDFF]/30 rounded-3xl p-5 border border-[#C1DDFF]">
        <h4 className="font-bold text-[#303150] flex items-center gap-2 mb-4">
          <Umbrella className="w-5 h-5 text-[#69ADFF]" />
          כמה כסף צריך בקרן חירום?
        </h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-3xl font-bold text-[#69ADFF] mb-2">3-6</p>
            <p className="text-[#303150] font-medium">חודשי הוצאות</p>
            <p className="text-sm text-[#303150] mt-2">
              אם יש לך משרה יציבה, 3 חודשים מספיקים. פרילנסרים ועצמאים - לפחות 6 חודשים.
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-xl font-bold text-[#69ADFF] mb-2">חישוב מהיר</p>
            <p className="text-sm text-[#303150]">
              הוצאות חודשיות (שכירות, אוכל, חשבונות, הלוואות) × מספר החודשים = סכום היעד שלך
            </p>
          </div>
        </div>
      </div>

      <div className="bg-[#B4F1F1]/30 rounded-3xl p-5 space-y-3 border border-[#B4F1F1]">
        <h4 className="font-bold text-[#303150]">איפה לשמור את הכסף?</h4>
        <ul className="space-y-2 text-[#303150]">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#0DBACC] mt-1 flex-shrink-0" />
            <span><strong>פק״מ (פיקדון קצר מועד):</strong> נזיל, בטוח, ריבית קטנה אבל יציבה</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#0DBACC] mt-1 flex-shrink-0" />
            <span><strong>עו״ש עם ריבית:</strong> חלק מהבנקים מציעים ריבית על עו״ש</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#0DBACC] mt-1 flex-shrink-0" />
            <span><strong>קרן כספית:</strong> סיכון אפסי, נזילות מלאה, תשואה צמודה לריבית בנק ישראל</span>
          </li>
        </ul>
      </div>

      <div className="bg-[#FFE5B4]/30 rounded-3xl p-5 border border-amber-200">
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

      <div className="bg-[#F7F7F8] rounded-3xl p-5 text-center">
        <p className="text-[#303150] font-medium">
          💡 הכלל: קודם קרן חירום, אחר כך השקעות. אל תדלגו על השלב הזה!
        </p>
      </div>
    </div>
  );
}

function FIREContent() {
  return (
    <div className="space-y-6" dir="rtl">
      <p className="text-lg text-[#303150] leading-relaxed">
        FIRE (Financial Independence, Retire Early) היא תנועה שמטרתה להגיע לעצמאות כלכלית מוקדמת - 
        הנקודה שבה ההכנסות הפסיביות שלכם מכסות את כל ההוצאות, ואתם יכולים לבחור אם לעבוד או לא.
      </p>

      <div className="bg-[#FFE5B4]/30 rounded-3xl p-5 border border-[#FFB84D]/50">
        <h4 className="font-bold text-[#303150] flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-[#FFB84D]" />
          כלל ה-4% (או: כלל ה-25)
        </h4>
        <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
          <p className="text-center">
            <span className="text-4xl font-bold text-[#FFB84D]">25×</span>
            <span className="text-lg text-[#7E7F90] mr-2">ההוצאות השנתיות</span>
          </p>
          <p className="text-center text-sm text-[#7E7F90] mt-2">= הסכום שצריך כדי לפרוש</p>
        </div>
        <p className="text-[#303150] text-sm">
          אם ההוצאות השנתיות שלכם הן 120,000₪, תצטרכו 3,000,000₪ כדי להגיע לחירות כלכלית.
          הרעיון: משיכה של 4% בשנה מאפשרת לתיק ההשקעות לשרוד לנצח (סטטיסטית).
        </p>
      </div>

      <div className="bg-[#F7F7F8] rounded-3xl p-5 space-y-4">
        <h4 className="font-bold text-[#303150]">שיעור החיסכון - המפתח האמיתי</h4>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <p className="text-xl font-bold text-[#F18AB5]">10%</p>
            <p className="text-xs text-[#7E7F90]">51 שנה לפרישה</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <p className="text-xl font-bold text-[#FFB84D]">30%</p>
            <p className="text-xs text-[#7E7F90]">28 שנה לפרישה</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-sm border-2 border-[#0DBACC]">
            <p className="text-xl font-bold text-[#0DBACC]">50%</p>
            <p className="text-xs text-[#7E7F90]">17 שנה לפרישה</p>
          </div>
        </div>
        <p className="text-sm text-[#7E7F90]">
          שיעור החיסכון חשוב יותר מהמשכורת! מי שחוסך 50% מההכנסה יגיע לחירות כלכלית הרבה לפני מי שמרוויח פי 2 אבל חוסך רק 10%.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-[#B4F1F1]/30 rounded-3xl p-4 border border-[#B4F1F1]">
          <h4 className="font-bold text-[#303150] mb-2">Lean FIRE</h4>
          <p className="text-sm text-[#303150]">
            חיים צנועים עם הוצאות נמוכות. מטרה: 1.5-2 מיליון ₪. מתאים למי שמוכן לחיות בפשטות.
          </p>
        </div>
        <div className="bg-[#E3D6FF]/30 rounded-3xl p-4 border border-[#E3D6FF]">
          <h4 className="font-bold text-[#303150] mb-2">Fat FIRE</h4>
          <p className="text-sm text-[#303150]">
            רמת חיים גבוהה גם בפרישה. מטרה: 5+ מיליון ₪. דורש הכנסה גבוהה או זמן ארוך יותר.
          </p>
        </div>
      </div>

      <blockquote className="border-r-4 border-[#FFB84D] pr-4 py-2 text-[#7E7F90] italic">
        ״חירות כלכלית זה לא להיות עשיר - זה לא להיות תלוי בעבודה כדי לחיות.״
      </blockquote>
    </div>
  );
}

function InsuranceContent() {
  return (
    <div className="space-y-6" dir="rtl">
      <p className="text-lg text-[#303150] leading-relaxed">
        ביטוח הוא כלי להגנה מפני אסונות כלכליים - לא דרך להתעשר. הכלל: מבטחים רק דברים שאי אפשר לשלם עליהם מכיס.
      </p>

      <div className="bg-[#FFC0DB]/30 rounded-3xl p-5 border border-[#FFC0DB]">
        <h4 className="font-bold text-[#303150] flex items-center gap-2 mb-4">
          <Heart className="w-5 h-5 text-[#F18AB5]" />
          ביטוח חיים - ריסק בלבד!
        </h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border-2 border-[#0DBACC]">
            <p className="font-bold text-[#0DBACC] mb-2">✓ ביטוח ריסק</p>
            <ul className="text-sm text-[#303150] space-y-1">
              <li>• זול משמעותית</li>
              <li>• כיסוי גבוה</li>
              <li>• פשוט להבנה</li>
              <li>• ההמלצה של הסולידית</li>
            </ul>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border-2 border-[#F18AB5]">
            <p className="font-bold text-[#F18AB5] mb-2">✗ ביטוח מעורב</p>
            <ul className="text-sm text-[#303150] space-y-1">
              <li>• יקר מאוד</li>
              <li>• עמלות גבוהות</li>
              <li>• מסובך ולא שקוף</li>
              <li>• תשואה נמוכה</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-[#C1DDFF]/30 rounded-3xl p-5 border border-[#C1DDFF]">
        <h4 className="font-bold text-[#303150] mb-3">אובדן כושר עבודה - הביטוח הכי חשוב!</h4>
        <p className="text-[#303150] mb-3">
          מה קורה אם לא תוכל לעבוד בגלל מחלה או תאונה? זה הסיכון הגדול באמת.
        </p>
        <ul className="space-y-2 text-[#303150] text-sm">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#69ADFF] mt-0.5 flex-shrink-0" />
            <span>כיסוי של 75% מההכנסה הוא סטנדרטי</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#69ADFF] mt-0.5 flex-shrink-0" />
            <span>בדוק אם יש לך כבר דרך הפנסיה (לרוב יש, אבל צריך להשלים)</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#69ADFF] mt-0.5 flex-shrink-0" />
            <span>עדיף לקנות בגיל צעיר - הפרמיה נקבעת לפי גיל ההצטרפות</span>
          </li>
        </ul>
      </div>

      <div className="bg-[#FFE5B4]/30 rounded-3xl p-5 border border-amber-200">
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

      <div className="bg-[#F7F7F8] rounded-3xl p-5 text-center">
        <p className="text-[#303150] font-medium">
          💡 הכלל: תבטח מה שאתה לא יכול להרשות לעצמך להפסיד. את השאר - שמור בקרן חירום.
        </p>
      </div>
    </div>
  );
}

function ManagementFeesContent() {
  return (
    <div className="space-y-6" dir="rtl">
      <p className="text-lg text-[#303150] leading-relaxed">
        דמי ניהול הם האויב השקט של המשקיע. הם נראים קטנים - 1%, 1.5% - אבל לאורך זמן הם אוכלים 
        חלק עצום מהכסף שלכם. זה ההפסד היחיד שמובטח לכם בהשקעות.
      </p>

      <div className="bg-[#FFC0DB]/30 rounded-3xl p-5 border border-[#FFC0DB]">
        <h4 className="font-bold text-[#303150] flex items-center gap-2 mb-4">
          <Percent className="w-5 h-5 text-[#F18AB5]" />
          ההבדל בין 0.1% ל-1% דמי ניהול
        </h4>
        <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
          <p className="text-sm text-[#7E7F90] mb-3">השקעה של 500,000₪ במשך 30 שנה בתשואה של 7%:</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-[#B4F1F1]/30 rounded-xl border border-[#B4F1F1]">
              <p className="text-xs text-[#0DBACC] mb-1">דמי ניהול 0.1%</p>
              <p className="text-2xl font-bold text-[#0DBACC]">3,574,000₪</p>
            </div>
            <div className="text-center p-3 bg-[#FFC0DB]/30 rounded-xl border border-[#FFC0DB]">
              <p className="text-xs text-[#F18AB5] mb-1">דמי ניהול 1%</p>
              <p className="text-2xl font-bold text-[#F18AB5]">2,650,000₪</p>
            </div>
          </div>
          <p className="text-center mt-3 text-[#F18AB5] font-bold">
            הפסד של כמעט מיליון ש״ח! 💸
          </p>
        </div>
      </div>

      <div className="bg-[#F7F7F8] rounded-3xl p-5 space-y-3">
        <h4 className="font-bold text-[#303150]">איפה לבדוק ולהוריד דמי ניהול?</h4>
        <ul className="space-y-2 text-[#303150]">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#0DBACC] mt-1 flex-shrink-0" />
            <span><strong>פנסיה:</strong> התקשר לקרן וביקש הנחה. רוב האנשים משלמים יותר מדי!</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#0DBACC] mt-1 flex-shrink-0" />
            <span><strong>קרן השתלמות:</strong> בדוק את דמי הניהול ועבור לקרן זולה יותר אם צריך</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#0DBACC] mt-1 flex-shrink-0" />
            <span><strong>קרנות נאמנות:</strong> העדף קרנות מחקות עם דמי ניהול נמוכים (0.03%-0.3%)</span>
          </li>
        </ul>
      </div>

      <div className="bg-[#FFE5B4]/30 rounded-3xl p-5 border border-amber-200">
        <h4 className="font-bold text-amber-900 flex items-center gap-2 mb-2">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          זכרו: דמי ניהול הם ההפסד היחיד שמובטח
        </h4>
        <p className="text-amber-800">
          השוק יכול לעלות או לרדת, אבל דמי הניהול תמיד ייגבו. כל שקל שחוסכים בדמי ניהול 
          הוא שקל שעובד בשבילכם במקום בשביל מנהל הקרן.
        </p>
      </div>

      <blockquote className="border-r-4 border-[#F18AB5] pr-4 py-2 text-[#7E7F90] italic">
        ״בעולם ההשקעות, אתה מקבל את מה שאתה לא משלם עליו.״ — ג׳ון בוגל
      </blockquote>
    </div>
  );
}

function InvestorBehaviorContent() {
  return (
    <div className="space-y-6" dir="rtl">
      <p className="text-lg text-[#303150] leading-relaxed">
        ההתנהגות שלכם כמשקיעים חשובה יותר מבחירת ההשקעות. רוב המשקיעים מפסידים כסף לא בגלל 
        השקעות רעות, אלא בגלל החלטות רגשיות בזמנים הלא נכונים.
      </p>

      <div className="bg-[#B4F1F1]/30 rounded-3xl p-5 border border-[#B4F1F1]">
        <h4 className="font-bold text-[#303150] flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-[#0DBACC]" />
          מחזור הרגשות של המשקיע
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <p className="text-2xl mb-1">😊</p>
            <p className="text-xs text-[#7E7F90]">אופטימיות</p>
            <p className="text-xs text-[#0DBACC]">השוק עולה</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <p className="text-2xl mb-1">🤑</p>
            <p className="text-xs text-[#7E7F90]">אופוריה</p>
            <p className="text-xs text-[#FFB84D]">קונים בשיא!</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <p className="text-2xl mb-1">😰</p>
            <p className="text-xs text-[#7E7F90]">פאניקה</p>
            <p className="text-xs text-[#F18AB5]">השוק יורד</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <p className="text-2xl mb-1">😱</p>
            <p className="text-xs text-[#7E7F90]">ייאוש</p>
            <p className="text-xs text-[#F18AB5]">מוכרים בתחתית!</p>
          </div>
        </div>
      </div>

      <div className="bg-[#B4F1F1]/30 rounded-3xl p-5 border border-[#B4F1F1]">
        <h4 className="font-bold text-[#303150] mb-3">הכללים של משקיע נבון</h4>
        <ul className="space-y-3 text-[#303150]">
          <li className="flex items-start gap-2">
            <span className="w-6 h-6 rounded-full bg-[#B4F1F1] text-[#0DBACC] flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
            <span><strong>תמשיך להשקיע בכל מצב:</strong> ירידות הן הזדמנות לקנות בזול</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-6 h-6 rounded-full bg-[#B4F1F1] text-[#0DBACC] flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
            <span><strong>אל תנסה לתזמן:</strong> זמן בשוק מנצח תזמון שוק - תמיד</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-6 h-6 rounded-full bg-[#B4F1F1] text-[#0DBACC] flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
            <span><strong>השקעה קבועה:</strong> סכום קבוע כל חודש, בלי לחשוב על מחירים</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-6 h-6 rounded-full bg-[#B4F1F1] text-[#0DBACC] flex items-center justify-center text-sm font-bold flex-shrink-0">4</span>
            <span><strong>אל תסתכל כל יום:</strong> בדוק את התיק פעם ברבעון - מקסימום</span>
          </li>
        </ul>
      </div>

      <div className="bg-[#F7F7F8] rounded-3xl p-5">
        <h4 className="font-bold text-[#303150] mb-3">מה קרה למי שמכר בפאניקה?</h4>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-white rounded-xl p-3 shadow-sm">
            <p className="text-sm text-[#7E7F90]">2008</p>
            <p className="text-[#F18AB5] font-bold">-50%</p>
            <p className="text-xs text-[#0DBACC]">התאושש תוך 4 שנים</p>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm">
            <p className="text-sm text-[#7E7F90]">2020</p>
            <p className="text-[#F18AB5] font-bold">-34%</p>
            <p className="text-xs text-[#0DBACC]">התאושש תוך 6 חודשים</p>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm">
            <p className="text-sm text-[#7E7F90]">2022</p>
            <p className="text-[#F18AB5] font-bold">-25%</p>
            <p className="text-xs text-[#0DBACC]">התאושש תוך שנה</p>
          </div>
        </div>
      </div>

      <blockquote className="border-r-4 border-[#0DBACC] pr-4 py-2 text-[#7E7F90] italic">
        ״שוק ההון הוא מכונה להעברת כסף מהחסרי סבלנות לבעלי סבלנות.״ — וורן באפט
      </blockquote>
    </div>
  );
}

function DebtManagementContent() {
  return (
    <div className="space-y-6" dir="rtl">
      <p className="text-lg text-[#303150] leading-relaxed">
        לא כל החובות שווים. יש חובות שעוזרים לכם לבנות עושר, ויש חובות שהורסים אותו. 
        להבין את ההבדל זה הצעד הראשון לחופש כלכלי.
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-[#B4F1F1]/30 rounded-3xl p-5 border border-[#B4F1F1]">
          <h4 className="font-bold text-[#303150] mb-3">✓ חוב ״טוב״</h4>
          <ul className="space-y-2 text-[#303150] text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#0DBACC] mt-0.5 flex-shrink-0" />
              <span><strong>משכנתא:</strong> ריבית נמוכה, הנכס עולה בערך</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#0DBACC] mt-0.5 flex-shrink-0" />
              <span><strong>השכלה:</strong> מעלה את כושר ההשתכרות</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#0DBACC] mt-0.5 flex-shrink-0" />
              <span><strong>עסק עם תוכנית:</strong> ROI ברור וריאלי</span>
            </li>
          </ul>
        </div>
        <div className="bg-[#FFC0DB]/30 rounded-3xl p-5 border border-[#FFC0DB]">
          <h4 className="font-bold text-[#303150] mb-3">✗ חוב רע</h4>
          <ul className="space-y-2 text-[#303150] text-sm">
            <li className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-[#F18AB5] mt-0.5 flex-shrink-0" />
              <span><strong>כרטיס אשראי:</strong> ריבית 15-25%(!)</span>
            </li>
            <li className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-[#F18AB5] mt-0.5 flex-shrink-0" />
              <span><strong>הלוואות צרכניות:</strong> לרכב, לחופשה, לריהוט</span>
            </li>
            <li className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-[#F18AB5] mt-0.5 flex-shrink-0" />
              <span><strong>מינוס:</strong> משלמים ריבית על שימוש יומיומי</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="bg-[#F7F7F8] rounded-3xl p-5 border border-[#E8E8ED]">
        <h4 className="font-bold text-[#303150] flex items-center gap-2 mb-4">
          <CreditCard className="w-5 h-5 text-[#7E7F90]" />
          סדר עדיפויות לפירעון חובות
        </h4>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-[#FFC0DB]/30 rounded-xl">
            <span className="w-8 h-8 rounded-full bg-[#F18AB5] text-white flex items-center justify-center font-bold">1</span>
            <div>
              <p className="font-medium text-[#303150]">חוב כרטיס אשראי</p>
              <p className="text-xs text-[#F18AB5]">ריבית 15-25% - תמחק קודם!</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-[#FFE5B4]/30 rounded-xl">
            <span className="w-8 h-8 rounded-full bg-[#FFB84D] text-white flex items-center justify-center font-bold">2</span>
            <div>
              <p className="font-medium text-[#303150]">הלוואות צרכניות</p>
              <p className="text-xs text-[#FFB84D]">ריבית 5-12%</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-[#F7F7F8] rounded-xl">
            <span className="w-8 h-8 rounded-full bg-[#7E7F90] text-white flex items-center justify-center font-bold">3</span>
            <div>
              <p className="font-medium text-[#303150]">משכנתא</p>
              <p className="text-xs text-[#7E7F90]">ריבית 3-5% - לא דחוף, יש הטבות מס</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#FFE5B4]/30 rounded-3xl p-5 border border-amber-200">
        <h4 className="font-bold text-amber-900 flex items-center gap-2 mb-3">
          <TrendingDown className="w-5 h-5 text-amber-600" />
          מלכודת האשראי
        </h4>
        <p className="text-amber-800 text-sm mb-3">
          חוב של 10,000₪ בכרטיס אשראי בריבית 20% שמשלמים עליו רק מינימום:
        </p>
        <div className="bg-white rounded-xl p-3 text-center">
          <p className="text-sm text-[#7E7F90]">זמן לפירעון: <strong className="text-[#F18AB5]">9 שנים</strong></p>
          <p className="text-sm text-[#7E7F90]">סה״כ תשלום: <strong className="text-[#F18AB5]">21,000₪</strong></p>
          <p className="text-xs text-[#F18AB5] mt-2">שילמתם פי 2 על מה שקניתם!</p>
        </div>
      </div>

      <div className="bg-[#F7F7F8] rounded-3xl p-5 text-center">
        <p className="text-[#303150] font-medium">
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
    themeColor: 'from-[#69ADFF] to-[#9F7FE0]',
    themeColorLight: 'bg-[#C1DDFF]',
    fullContent: <PassiveInvestingContent />,
  },
  {
    id: 'first-home',
    title: 'הדירה הראשונה',
    subtitle: 'הכללים החשובים ביותר לרכישת דירה חכמה.',
    icon: Home,
    themeColor: 'from-[#0DBACC] to-[#0DBACC]',
    themeColorLight: 'bg-[#B4F1F1]',
    fullContent: <FirstApartmentContent />,
  },
  {
    id: 'pension-taxes',
    title: 'פנסיה ומיסים',
    subtitle: 'איך לנצל את הטבות המס ולחסוך אלפי שקלים בשנה.',
    icon: Shield,
    themeColor: 'from-[#9F7FE0] to-[#F18AB5]',
    themeColorLight: 'bg-[#E3D6FF]',
    fullContent: <PensionTaxesContent />,
  },
  {
    id: 'emergency-fund',
    title: 'קרן חירום',
    subtitle: 'למה כל אחד חייב כרית ביטחון נזילה.',
    icon: Umbrella,
    themeColor: 'from-[#69ADFF] to-[#0DBACC]',
    themeColorLight: 'bg-[#C1DDFF]',
    fullContent: <EmergencyFundContent />,
  },
  {
    id: 'fire',
    title: 'חירות כלכלית - FIRE',
    subtitle: 'הדרך לעצמאות פיננסית מוקדמת.',
    icon: Flame,
    themeColor: 'from-[#FFB84D] to-[#F18AB5]',
    themeColorLight: 'bg-[#FFE5B4]',
    fullContent: <FIREContent />,
  },
  {
    id: 'insurance',
    title: 'ביטוחים חיוניים',
    subtitle: 'הגנה על המשפחה בלי לשלם מיותר.',
    icon: Heart,
    themeColor: 'from-[#F18AB5] to-[#F18AB5]',
    themeColorLight: 'bg-[#FFC0DB]',
    fullContent: <InsuranceContent />,
  },
  {
    id: 'management-fees',
    title: 'דמי ניהול - האויב השקט',
    subtitle: 'איך עמלות קטנות אוכלות הון עצום.',
    icon: Percent,
    themeColor: 'from-[#F18AB5] to-[#F18AB5]',
    themeColorLight: 'bg-[#FFC0DB]',
    fullContent: <ManagementFeesContent />,
  },
  {
    id: 'investor-behavior',
    title: 'התנהגות משקיע נבון',
    subtitle: 'איך להישאר רגוע כשהשוק משתגע.',
    icon: Brain,
    themeColor: 'from-[#0DBACC] to-[#0DBACC]',
    themeColorLight: 'bg-[#B4F1F1]',
    fullContent: <InvestorBehaviorContent />,
  },
  {
    id: 'debt-management',
    title: 'חובות והלוואות',
    subtitle: 'מתי לקחת הלוואה ומתי לברוח.',
    icon: CreditCard,
    themeColor: 'from-[#7E7F90] to-[#303150]',
    themeColorLight: 'bg-[#E8E8ED]',
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
        <div className="w-10 h-10 bg-[#C1DDFF] rounded-xl flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-[#69ADFF]" />
        </div>
        <h2 className="text-lg font-semibold text-[#303150]">למד את הבסיס</h2>
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
              className="relative overflow-hidden rounded-3xl p-5 cursor-pointer bg-[#F7F7F8] border border-[#E8E8ED] hover:border-[#69ADFF] hover:bg-[#C1DDFF]/30 transition-colors min-h-[140px]"
            >
              {/* Icon */}
              <motion.div 
                layoutId={`icon-${item.id}`}
                className={`w-10 h-10 rounded-xl ${item.themeColorLight} flex items-center justify-center mb-3`}
              >
                <Icon className="w-5 h-5 text-[#303150]" />
              </motion.div>

              {/* Content */}
              <motion.h3 
                layoutId={`title-${item.id}`}
                className="text-base font-bold text-[#303150] mb-1.5"
              >
                {item.title}
              </motion.h3>
              <motion.p 
                layoutId={`subtitle-${item.id}`}
                className="text-sm text-[#7E7F90] leading-relaxed"
              >
                {item.subtitle}
              </motion.p>
            </motion.div>
          );
        })}
      </div>

      {/* Expanded Modal - Rendered via Portal to document.body */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {selectedId && selectedItem && (
            <>
              {/* Backdrop with blur */}
              <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-md z-[9998]"
                onClick={() => setSelectedId(null)}
                aria-hidden="true"
              />

              {/* Floating Modal */}
              <motion.div
                key="expanded-card"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={springTransition}
                className="fixed inset-4 sm:inset-6 md:inset-8 lg:inset-y-12 lg:inset-x-[10%] xl:inset-y-16 xl:inset-x-[15%] z-[9999] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] md:max-h-[calc(100vh-4rem)]"
                role="dialog"
                aria-modal="true"
                aria-labelledby="expanded-title"
              >
                {/* Header with gradient */}
                <div className={`bg-gradient-to-br ${selectedItem.themeColor} p-4 sm:p-5 md:p-6 flex-shrink-0 rounded-t-3xl`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 md:gap-4 min-w-0">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                        <selectedItem.icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
                      </div>
                      <div className="min-w-0">
                        <h2 
                          id="expanded-title"
                          className="text-lg sm:text-xl md:text-2xl font-bold text-white truncate"
                        >
                          {selectedItem.title}
                        </h2>
                        <p className="text-white/80 text-xs sm:text-sm md:text-base mt-0.5 md:mt-1 line-clamp-2">
                          {selectedItem.subtitle}
                        </p>
                      </div>
                    </div>

                    {/* Close button */}
                    <button
                      onClick={() => setSelectedId(null)}
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors flex-shrink-0"
                      aria-label="סגור"
                    >
                      <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </button>
                  </div>
                </div>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6 lg:p-8">
                  {selectedItem.fullContent}
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
