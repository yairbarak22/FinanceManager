'use client';

import { motion } from 'framer-motion';
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
    <section className="py-16 md:py-24">
      <div className="max-w-3xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 mb-6">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-medium text-indigo-700">עקרונות פיננסיים</span>
          </div>
          
          <h2 className="text-2xl md:text-4xl font-bold text-slate-900 mb-4">
            הידע שישנה את עתידך הכלכלי
          </h2>
          <p className="text-slate-600 max-w-lg mx-auto">
            עקרונות פשוטים אבל חזקים שיעזרו לך לקבל החלטות פיננסיות חכמות יותר
          </p>
        </motion.div>

        {/* Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 md:p-6"
        >
          <Accordion defaultOpenIndex={0}>
            {/* Topic 1: S&P 500 and Passive Investing */}
            <AccordionItem
              title="למה מדד S&P 500?"
              icon={<TrendingUp className="w-5 h-5 text-indigo-600" />}
            >
              <div className="space-y-4">
                <p>
                  מדד S&P 500 מכיל את 500 החברות הגדולות והמשפיעות ביותר בארה״ב. כשאתה משקיע במדד, 
                  אתה למעשה קונה חלק קטן מכל אחת מהחברות האלה - מאפל ומיקרוסופט ועד אמזון וגוגל.
                </p>

                <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                  <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    היתרונות של השקעה במדד
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-500 mt-1">•</span>
                      <span><strong>פיזור אוטומטי:</strong> במקום לבחור מניה אחת ולקוות שהיא תצליח, אתה מפוזר על פני 500 חברות שונות.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-500 mt-1">•</span>
                      <span><strong>עמלות נמוכות:</strong> קרנות מחקות מדד גובות עמלות של 0.03%-0.2% בלבד, לעומת 1-2% בקרנות אקטיביות.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-500 mt-1">•</span>
                      <span><strong>ביצועים מוכחים:</strong> לאורך 30+ שנים, המדד הניב תשואה ממוצעת של כ-10% בשנה (7% אחרי אינפלציה).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-500 mt-1">•</span>
                      <span><strong>פשטות:</strong> אין צורך לעקוב אחרי חדשות, לנתח דוחות או לתזמן את השוק.</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                  <h4 className="font-semibold text-amber-900 flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    מה חשוב לזכור
                  </h4>
                  <p className="text-sm text-amber-800">
                    השקעה במדדים מתאימה לטווח ארוך (10+ שנים). בטווח הקצר השוק יכול לרדת 30-50%, 
                    אבל היסטורית הוא תמיד התאושש. הסוד הוא להמשיך להשקיע באופן קבוע ולא למכור בפאניקה.
                  </p>
                </div>

                <p className="text-sm text-slate-500 italic">
                  ״אל תחפש מחט בערימת שחת. קנה את כל ערימת השחת.״ — ג׳ון בוגל, מייסד Vanguard
                </p>
              </div>
            </AccordionItem>

            {/* Topic 2: First Home - The Holy Trinity */}
            <AccordionItem
              title="השילוש הקדוש של קניית דירה"
              icon={<Home className="w-5 h-5 text-indigo-600" />}
            >
              <div className="space-y-4">
                <p>
                  רכישת דירה היא ההחלטה הפיננסית הגדולה ביותר שרוב האנשים יקבלו בחייהם. 
                  שלושה כללים פשוטים יעזרו לך להימנע מטעויות יקרות:
                </p>

                <div className="grid gap-4">
                  {/* Rule 1 */}
                  <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                    <h4 className="font-bold text-indigo-900 mb-2">1. כלל ה-25%: הון עצמי מינימלי</h4>
                    <p className="text-sm text-indigo-800 mb-2">
                      הון עצמי של לפחות 25% ממחיר הדירה הוא הכרחי. למה? 
                    </p>
                    <ul className="text-sm text-indigo-700 space-y-1">
                      <li>• הבנק מאפשר משכנתא של עד 75% לדירה ראשונה</li>
                      <li>• הון עצמי גבוה יותר = ריבית נמוכה יותר על המשכנתא</li>
                      <li>• מגן עליך במקרה של ירידת מחירים בשוק</li>
                    </ul>
                  </div>

                  {/* Rule 2 */}
                  <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                    <h4 className="font-bold text-emerald-900 mb-2">2. כלל ה-30%: החזר חודשי</h4>
                    <p className="text-sm text-emerald-800 mb-2">
                      ההחזר החודשי על המשכנתא לא יעלה על 30% מההכנסה הפנויה נטו של המשפחה.
                    </p>
                    <ul className="text-sm text-emerald-700 space-y-1">
                      <li>• זה מבטיח שתוכל לעמוד בהחזרים גם בתקופות קשות</li>
                      <li>• משאיר מספיק כסף לחיסכון, בילויים וחירום</li>
                      <li>• הבנקים עצמם לא יאשרו יותר מ-40%, אבל 30% בטוח יותר</li>
                    </ul>
                  </div>

                  {/* Rule 3 */}
                  <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                    <h4 className="font-bold text-purple-900 mb-2">3. קרן חירום נפרדת</h4>
                    <p className="text-sm text-purple-800 mb-2">
                      לפני שקונים דירה, חובה לשמור קרן חירום של 3-6 חודשי הוצאות.
                    </p>
                    <ul className="text-sm text-purple-700 space-y-1">
                      <li>• אל תשתמש בכל החיסכון להון עצמי!</li>
                      <li>• דברים לא צפויים קורים: פיטורים, תיקונים, הוצאות רפואיות</li>
                      <li>• קרן החירום צריכה להיות נזילה ונפרדת מכסף הדירה</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-slate-100 rounded-xl p-4 text-center">
                  <p className="text-sm text-slate-700 font-medium">
                    💡 טיפ: אל תזלזל בעלויות הנלוות - מס רכישה, עו״ד, שיפוצים ומעבר יכולים להגיע ל-5-10% נוספים.
                  </p>
                </div>
              </div>
            </AccordionItem>

            {/* Topic 3: Education Fund (Keren Hishtalmut) */}
            <AccordionItem
              title="קרן השתלמות - מקלט המס המושלם"
              icon={<Shield className="w-5 h-5 text-indigo-600" />}
            >
              <div className="space-y-4">
                <p>
                  קרן השתלמות היא אחד מאפיקי החיסכון הטובים ביותר בישראל, בזכות הטבות מס משמעותיות 
                  שהופכות אותה ל״מקלט מס״ לגיטימי.
                </p>

                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                  <h4 className="font-semibold text-emerald-900 flex items-center gap-2 mb-3">
                    <PiggyBank className="w-4 h-4 text-emerald-600" />
                    הטבות המס
                  </h4>
                  <div className="grid md:grid-cols-2 gap-3 text-sm">
                    <div className="bg-white rounded-lg p-3">
                      <p className="font-medium text-emerald-800">לשכירים:</p>
                      <p className="text-emerald-700">הפקדת עובד (עד 2.5%) + מעסיק (עד 7.5%) = פטור ממס הכנסה על ההפקדות!</p>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <p className="font-medium text-emerald-800">לעצמאים:</p>
                      <p className="text-emerald-700">הפקדה של עד 4.5% מההכנסה (עד תקרה) = ניכוי ממס הכנסה</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-slate-900">מתי אפשר למשוך?</h4>
                  <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
                    <div className="flex items-center gap-3">
                      <span className="w-20 text-slate-500">אחרי 3 שנים:</span>
                      <span className="text-slate-700">משיכה עם תשלום מס רווחי הון (25%)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-20 text-slate-500">אחרי 6 שנים:</span>
                      <span className="text-slate-700 font-medium">משיכה ללא מס כלל! (לכל מטרה)</span>
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                  <h4 className="font-semibold text-indigo-900 mb-2">💡 טיפים למקסום</h4>
                  <ul className="text-sm text-indigo-800 space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                      <span>בחר מסלול מנייתי (S&P 500) אם יש לך לפחות 6 שנים עד המשיכה</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                      <span>ודא שהמעסיק מפקיד את המקסימום (7.5%) - זה כסף שלך!</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                      <span>בדוק את דמי הניהול - ההבדל בין 0.3% ל-1% הוא עשרות אלפי שקלים לאורך זמן</span>
                    </li>
                  </ul>
                </div>

                <p className="text-sm text-slate-500">
                  לאחר 6 שנים, הכסף שלך - כולל כל הרווחים - פטור לחלוטין ממס. 
                  זה כמעט בלתי אפשרי למצוא אפיק השקעה עם יתרון מס כזה.
                </p>
              </div>
            </AccordionItem>

            {/* Topic 4: Pension Fund */}
            <AccordionItem
              title="פנסיה - המפתח לביטחון בגיל מבוגר"
              icon={<Wallet className="w-5 h-5 text-indigo-600" />}
            >
              <div className="space-y-4">
                <p>
                  הפנסיה היא לא רק חובה חוקית - היא גם אחד מכלי החיסכון היעילים ביותר בזכות הטבות מס משמעותיות
                  והפקדות מהמעסיק.
                </p>

                <div className="grid md:grid-cols-3 gap-3">
                  <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
                    <p className="text-2xl font-bold text-blue-600 mb-1">6%</p>
                    <p className="text-xs text-blue-700">הפקדת עובד</p>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-4 text-center border border-emerald-100">
                    <p className="text-2xl font-bold text-emerald-600 mb-1">6.5%</p>
                    <p className="text-xs text-emerald-700">הפקדת מעסיק לפנסיה</p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4 text-center border border-purple-100">
                    <p className="text-2xl font-bold text-purple-600 mb-1">6%</p>
                    <p className="text-xs text-purple-700">פיצויי פיטורים</p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4">
                  <h4 className="font-semibold text-slate-900 mb-2">למה זה כל כך חשוב?</h4>
                  <ul className="text-sm text-slate-700 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-500 mt-1">•</span>
                      <span>הפקדות המעסיק (12.5%) הן כסף שלא היית מקבל אחרת</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-500 mt-1">•</span>
                      <span>זיכוי מס של עד 35% על ההפקדות שלך (מס שחוזר אליך!)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-500 mt-1">•</span>
                      <span>הרווחים בקרן צוברים ללא מס עד הפרישה</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-500 mt-1">•</span>
                      <span>כולל ביטוח חיים ואובדן כושר עבודה</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                  <h4 className="font-semibold text-amber-900 flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    שימו לב לדמי הניהול
                  </h4>
                  <p className="text-sm text-amber-800">
                    ההבדל בין 0.5% ל-1.5% דמי ניהול יכול להסתכם ב<strong>מאות אלפי שקלים</strong> לאורך חיי העבודה. 
                    בדוק את דמי הניהול שלך ואל תתבייש להתמקח או לעבור קרן.
                  </p>
                </div>
              </div>
            </AccordionItem>
          </Accordion>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center mt-8"
        >
          <p className="text-sm text-slate-500">
            המידע הוא לצורכי לימוד בלבד ואינו מהווה ייעוץ פיננסי. 
            מומלץ להתייעץ עם מומחה לפני קבלת החלטות פיננסיות משמעותיות.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

