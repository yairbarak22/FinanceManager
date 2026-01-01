'use client';

import { TrendingUp, Home, Shield, Wallet, PiggyBank, BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Accordion, AccordionItem } from '@/components/ui/Accordion';

/**
 * Financial Principles Component
 * 
 * Content based on research from:
 * - Hasolidit (הסולידית) - Passive investing, index funds, low fees, long-term wealth building
 * - Yeda Kesef (ידע שווה כסף) - Financial planning, tax optimization, real estate fundamentals
 * 
 * All content is original, synthesized from these sources' principles.
 */

export default function FinancialPrinciples() {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">עקרונות פיננסיים</h2>
          <p className="text-sm text-slate-500">ידע שישנה את עתידך הכלכלי</p>
        </div>
      </div>

      {/* Accordion */}
      <Accordion defaultOpenIndex={0}>
        {/* Topic 1: S&P 500 and Passive Investing */}
        <AccordionItem
          title="למה מדד S&P 500?"
          icon={<TrendingUp className="w-5 h-5 text-indigo-600" />}
        >
          <div className="space-y-3">
            <p className="text-sm">
              מדד S&P 500 מכיל את 500 החברות הגדולות והמשפיעות ביותר בארה״ב. כשאתה משקיע במדד, 
              אתה למעשה קונה חלק קטן מכל אחת מהחברות האלה.
            </p>

            <div className="bg-slate-50 rounded-xl p-3 space-y-2">
              <h4 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                היתרונות של השקעה במדד
              </h4>
              <ul className="space-y-1.5 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-indigo-500 mt-1">•</span>
                  <span><strong>פיזור אוטומטי:</strong> מפוזר על פני 500 חברות שונות.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-500 mt-1">•</span>
                  <span><strong>עמלות נמוכות:</strong> 0.03%-0.2% בלבד, לעומת 1-2% בקרנות אקטיביות.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-500 mt-1">•</span>
                  <span><strong>ביצועים מוכחים:</strong> כ-7% בשנה אחרי אינפלציה לאורך 30+ שנים.</span>
                </li>
              </ul>
            </div>

            <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
              <p className="text-xs text-amber-800">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 inline ml-1" />
                <strong>חשוב:</strong> מתאים לטווח ארוך (10+ שנים). בטווח הקצר השוק יכול לרדת 30-50%.
              </p>
            </div>
          </div>
        </AccordionItem>

        {/* Topic 2: First Home - The Holy Trinity */}
        <AccordionItem
          title="השילוש הקדוש של קניית דירה"
          icon={<Home className="w-5 h-5 text-indigo-600" />}
        >
          <div className="space-y-3">
            <p className="text-sm">
              שלושה כללים פשוטים לרכישת דירה חכמה:
            </p>

            <div className="grid gap-2">
              <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100">
                <h4 className="font-bold text-indigo-900 text-sm mb-1">1. כלל ה-25%: הון עצמי מינימלי</h4>
                <p className="text-xs text-indigo-700">
                  הבנק מאפשר משכנתא של עד 75%. הון עצמי גבוה = ריבית נמוכה יותר.
                </p>
              </div>

              <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                <h4 className="font-bold text-emerald-900 text-sm mb-1">2. כלל ה-30%: החזר חודשי</h4>
                <p className="text-xs text-emerald-700">
                  ההחזר לא יעלה על 30% מההכנסה נטו. מבטיח שתוכל לעמוד בהחזרים גם בתקופות קשות.
                </p>
              </div>

              <div className="bg-purple-50 rounded-xl p-3 border border-purple-100">
                <h4 className="font-bold text-purple-900 text-sm mb-1">3. קרן חירום נפרדת</h4>
                <p className="text-xs text-purple-700">
                  שמור 3-6 חודשי הוצאות. אל תשתמש בכל החיסכון להון עצמי!
                </p>
              </div>
            </div>
          </div>
        </AccordionItem>

        {/* Topic 3: Education Fund (Keren Hishtalmut) */}
        <AccordionItem
          title="קרן השתלמות - מקלט המס המושלם"
          icon={<Shield className="w-5 h-5 text-indigo-600" />}
        >
          <div className="space-y-3">
            <p className="text-sm">
              קרן השתלמות היא אחד מאפיקי החיסכון הטובים ביותר בישראל בזכות הטבות מס משמעותיות.
            </p>

            <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
              <h4 className="font-semibold text-emerald-900 text-sm flex items-center gap-2 mb-2">
                <PiggyBank className="w-4 h-4 text-emerald-600" />
                הטבות המס
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white rounded-lg p-2">
                  <p className="font-medium text-emerald-800">לשכירים:</p>
                  <p className="text-emerald-700">עובד 2.5% + מעסיק 7.5% = פטור ממס!</p>
                </div>
                <div className="bg-white rounded-lg p-2">
                  <p className="font-medium text-emerald-800">לעצמאים:</p>
                  <p className="text-emerald-700">עד 4.5% מההכנסה = ניכוי מס</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 text-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-slate-500">אחרי 3 שנים:</span>
                <span className="text-slate-700">משיכה עם מס 25%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">אחרי 6 שנים:</span>
                <span className="text-emerald-700 font-medium">משיכה ללא מס כלל!</span>
              </div>
            </div>
          </div>
        </AccordionItem>

        {/* Topic 4: Pension Fund */}
        <AccordionItem
          title="פנסיה - המפתח לביטחון בגיל מבוגר"
          icon={<Wallet className="w-5 h-5 text-indigo-600" />}
        >
          <div className="space-y-3">
            <p className="text-sm">
              הפנסיה היא אחד מכלי החיסכון היעילים ביותר בזכות הטבות מס והפקדות מהמעסיק.
            </p>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
                <p className="text-xl font-bold text-blue-600 mb-0.5">6%</p>
                <p className="text-xs text-blue-700">הפקדת עובד</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100">
                <p className="text-xl font-bold text-emerald-600 mb-0.5">6.5%</p>
                <p className="text-xs text-emerald-700">הפקדת מעסיק</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-3 text-center border border-purple-100">
                <p className="text-xl font-bold text-purple-600 mb-0.5">6%</p>
                <p className="text-xs text-purple-700">פיצויים</p>
              </div>
            </div>

            <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
              <p className="text-xs text-amber-800">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 inline ml-1" />
                <strong>שימו לב לדמי הניהול!</strong> ההבדל בין 0.5% ל-1.5% = מאות אלפי ש״ח לאורך חיי העבודה.
              </p>
            </div>
          </div>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
