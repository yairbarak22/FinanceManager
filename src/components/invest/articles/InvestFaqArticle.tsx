'use client';

import { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  HelpCircle,
  Globe,
  Briefcase,
  ShieldCheck,
  Receipt,
  ArrowRightLeft,
  AlertCircle,
  Plus,
  Minus,
  ChevronsDown,
} from 'lucide-react';
import Card from '@/components/ui/Card';

/* ── FAQ Data ──────────────────────────────────────────────── */

const GENERAL_FAQ = [
  { q: 'מה ההבדל בין חיסכון להשקעה?', a: 'חיסכון = לשים כסף בצד (בבנק, בעו"ש, בפיקדון). ההון שמור אבל כמעט לא גדל. השקעה = להקצות כסף לנכסים (מניות, קרנות, אג"ח) מתוך ציפייה שערכם יעלה לאורך זמן. השקעה כרוכה בסיכון, אבל גם בפוטנציאל לתשואה גבוהה משמעותית.' },
  { q: 'מאיזה סכום אפשר להתחיל להשקיע?', a: 'אפשר להתחיל כבר מ-100₪ בחודש. אין סכום מינימלי קבוע בחוק. מה שחשוב זו העקביות — להפקיד באופן קבוע כל חודש (DCA). סכום של 500-1,000₪ בחודש הוא נקודת התחלה מצוינת עבור רוב המשפחות.' },
  { q: 'האם צריך ידע מוקדם כדי להשקיע?', a: 'לא. השקעה פסיבית במדד (כמו S&P 500) לא דורשת ידע מקצועי. פותחים חשבון, בוחרים קרן מחקה, מגדירים הוראת קבע — וזהו. אין צורך לנתח דוחות כספיים או לעקוב אחרי חדשות.' },
  { q: 'מה זה S&P 500 ולמה כולם מדברים עליו?', a: 'S&P 500 הוא מדד שמייצג את 500 החברות הגדולות ביותר בארה"ב (Apple, Microsoft, Amazon, Google ועוד). תשואה ממוצעת של ~10% בשנה לאורך 30+ שנה. רוב המנהלים האקטיביים לא מצליחים להכות אותו.' },
  { q: 'האם השקעה במדד מתאימה לכולם?', a: 'השקעה במדד מתאימה למי שמוכן להשקיע לטווח ארוך (מינימום 5 שנים, אידיאלי 10+). לטווח הקצר יש תנודות שיכולות להיות משמעותיות. אם אתם צריכים את הכסף בשנה-שנתיים הקרובות, עדיף פיקדון בנקאי.' },
];

const ACCOUNT_FAQ = [
  { q: 'מה זה חשבון מסחר עצמאי?', a: 'חשבון שמאפשר לכם לקנות ולמכור ניירות ערך (מניות, קרנות סל, אג"ח) ישירות בבורסה. ההבדל מקופת גמל או תיק מנוהל: אתם שולטים בבחירות, ודמי הניהול נמוכים בהרבה (או אפס דרכנו).' },
  { q: 'מה ההטבות שמקבלים דרך MyNeto?', a: '0₪ דמי ניהול לכל החיים (ללא הגבלת זמן), 200₪ מתנת הצטרפות ישר לחשבון, מסלולי השקעה הלכתיים בפיקוח מלא, ופתיחה דיגיטלית מהירה ב-3 דקות.' },
  { q: 'האם באמת אין דמי ניהול?', a: 'כן. 0₪ דמי ניהול לכל חיי החשבון, ללא הגבלת זמן. זה חיסכון של אלפי שקלים בשנה לעומת בנק (שגובה 1-1.5%) או קופת גמל (0.7-1%). על תיק של 500,000₪ זה חיסכון של כ-5,000₪ בשנה.' },
  { q: 'איך פותחים חשבון?', a: 'נכנסים ללינק ההצטרפות דרך MyNeto, עוברים זיהוי דיגיטלי (צילום ת"ז + סלפי), בוחרים מסלול (רגיל או הלכתי), ומגדירים הוראת קבע. כל התהליך לוקח כ-3 דקות.' },
];

const KASHRUT_FAQ = [
  { q: 'האם מותר להשקיע על פי ההלכה?', a: 'כן. כל הברוקרים הגדולים בישראל חתומים על "היתר עסקא" — הסכם הלכתי שמגדיר את ההשקעה כשותפות עסקית ולא כהלוואה בריבית. בנוסף, יש קרנות מחקות בהכשר מהדרין.' },
  { q: 'מה זה "היתר עסקא"?', a: 'היתר עסקא הוא מסמך הלכתי שהופך את ההשקעה (שעלולה להיחשב כהלוואה בריבית) לשותפות עסקית — מה שמותר על פי ההלכה. ההיתר נחתם בין המשקיע לבין הגוף הפיננסי, ומאושר על ידי רבנים מוסמכים.' },
  { q: 'אילו קרנות מחקות כשרות יש?', a: 'קרנות מחקות S&P 500 כשרות בישראל: הראל סל S&P 500 (הכשר מהדרין), כסם KTF S&P 500 (פיקוח הלכתי), תכלית סל S&P 500 (הכשר הלכתי), מגדל S&P 500 (פיקוח רבני).' },
];

const TAX_FAQ = [
  { q: 'מה המס על רווחי הון מהשקעות?', a: 'מס רווחי הון בישראל עומד על 25% מהרווח הריאלי (אחרי ניכוי אינפלציה). המס מחושב רק על הרווח, לא על כל הסכום. חשוב: המס נגבה רק כשמוכרים — כל עוד מחזיקים, אין אירוע מס.' },
  { q: 'האם צריך לדווח למס הכנסה?', a: 'בחשבון מסחר ישראלי, הברוקר מנכה מס במקור אוטומטית כשמוכרים. אם יש לכם רק רווחים מניירות ערך ישראליים — בדרך כלל לא צריך להגיש דוח נפרד.' },
  { q: 'האם העברת תיק יוצרת אירוע מס?', a: 'לא. העברת ניירות ערך בין חשבונות אינה אירוע מס. אתם לא מוכרים ולא קונים — ניירות הערך פשוט עוברים. מחיר הרכישה המקורי נשמר.' },
];

const TRANSFER_FAQ = [
  { q: 'מה קורה לניירות הערך שלי בזמן ההעברה?', a: 'ניירות הערך שלכם עוברים כמו שהם לחשבון החדש. אין מכירה, אין קנייה מחדש. אתם ממשיכים להחזיק בדיוק את אותם ניירות ערך.' },
  { q: 'איך מתחילים את תהליך ההעברה?', a: 'קודם פותחים חשבון באלטשולר שחם טרייד (דרכנו, כדי לקבל את ההטבות). אחרי ההצטרפות יוצרים קשר עם אלטשולר לקבלת מספר חשבון, שולחים דו"ח אחזקות לתיאום, ואז פונים לבנק/ברוקר הנוכחי עם טופס ההעברה.' },
  { q: 'יש עלות להעברת התיק?', a: 'אלטשולר שחם טרייד לא גובים על קבלת ניירות הערך. ייתכן שהבנק או הברוקר הנוכחי ייגבו עמלת העברה. בכל מקרה, החיסכון בדמי ניהול מכסה את זה תוך זמן קצר.' },
  { q: 'אילו ניירות ערך אפשר להעביר?', a: 'ניתן להעביר ניירות ערך הנסחרים בישראל ובארה"ב. העברת ני"ע הנסחרים בארה"ב כפופה לאישור מראש.' },
  { q: 'כמה זמן לוקחת ההעברה?', a: 'בדרך כלל 2-4 שבועות מרגע שהבנק או הברוקר הנוכחי מקבלים את בקשת ההעברה. בזמן הזה ניירות הערך ממשיכים להיסחר כרגיל.' },
  { q: 'איך יוצרים קשר עם אלטשולר שחם טרייד?', a: 'במייל: alt-trade@altshul.co.il או בוואטסאפ: 052-7781070. שירות לקוחות: ב׳-ה׳ 09:00-17:00, ו׳ 09:00-14:00.' },
];

const FAQ_SECTIONS = [
  { id: 'general', title: 'שאלות כלליות על השקעה', icon: Globe, iconBg: 'bg-[#E6F9F9]', iconColor: 'text-[#0DBACC]', items: GENERAL_FAQ },
  { id: 'account', title: 'חשבון מסחר והטבות', icon: Briefcase, iconBg: 'bg-[#C1DDFF]/30', iconColor: 'text-[#69ADFF]', items: ACCOUNT_FAQ },
  { id: 'kashrut', title: 'כשרות הלכתית', icon: ShieldCheck, iconBg: 'bg-[#FFF8E1]', iconColor: 'text-[#E9A800]', items: KASHRUT_FAQ },
  { id: 'tax', title: 'מיסוי ורגולציה', icon: Receipt, iconBg: 'bg-[#F18AB5]/10', iconColor: 'text-[#F18AB5]', items: TAX_FAQ },
  { id: 'transfer', title: 'העברת תיק', icon: ArrowRightLeft, iconBg: 'bg-[#E3D6FF]', iconColor: 'text-[#9F7FE0]', items: TRANSFER_FAQ },
];

/* ── Shared helpers ────────────────────────────────────────── */

function ScrollToNext({ targetRef, label }: { targetRef: React.RefObject<HTMLDivElement | null>; label: string }) {
  return (
    <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
      onClick={() => targetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
      className="flex flex-col items-center gap-1.5 mx-auto text-[#BDBDCB] hover:text-[#0DBACC] transition-colors py-4 cursor-pointer" aria-label={label}>
      <span className="text-xs font-medium">{label}</span>
      <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.5, repeat: Infinity }}><ChevronsDown className="w-5 h-5" /></motion.div>
    </motion.button>
  );
}

function AnimatedSection({ children, onRef }: { children: React.ReactNode; onRef?: (el: HTMLDivElement | null) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });
  return (
    <motion.div ref={(el) => { (ref as React.MutableRefObject<HTMLDivElement | null>).current = el; onRef?.(el); }}
      initial={{ opacity: 0, y: 40 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className="space-y-6">
      {children}
    </motion.div>
  );
}

function Accordion({ title, children, isOpen, onToggle }: { title: string; children: React.ReactNode; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border border-[#E8E8ED] rounded-xl overflow-hidden">
      <button type="button" onClick={onToggle} className="w-full flex items-center justify-between p-4 text-right hover:bg-[#F7F7F8] transition-colors cursor-pointer">
        <span className="text-sm font-medium text-[#303150]">{title}</span>
        <motion.div initial={false} animate={{ scale: isOpen ? 1.1 : 1 }} transition={{ duration: 0.2 }}>
          {isOpen ? <Minus className="w-4 h-4 text-[#0DBACC] flex-shrink-0" /> : <Plus className="w-4 h-4 text-[#7E7F90] flex-shrink-0" />}
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }} className="overflow-hidden">
            <div className="px-4 pb-4 text-sm text-[#7E7F90] leading-relaxed border-t border-[#F7F7F8] pt-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── FAQ Section Group ─────────────────────────────────────── */

function FaqGroup({ items }: { items: { q: string; a: string }[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  return (
    <>
      {items.map((item, i) => (
        <Accordion key={i} title={item.q} isOpen={openIndex === i} onToggle={() => setOpenIndex(openIndex === i ? null : i)}>
          <p>{item.a}</p>
        </Accordion>
      ))}
    </>
  );
}

/* ── Main Article ──────────────────────────────────────────── */

export default function InvestFaqArticle() {
  const sectionRefs = FAQ_SECTIONS.map(() => useRef<HTMLDivElement>(null));

  return (
    <div className="space-y-8">
      {/* ── Intro ──────────────────────────────────── */}
      <AnimatedSection>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#C1DDFF]/30 rounded-xl flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-[#69ADFF]" />
          </div>
          <div>
            <h2 className="text-lg lg:text-xl font-bold text-[#303150]">שאלות נפוצות על השקעות</h2>
            <p className="text-xs text-[#7E7F90]">21 שאלות ב-5 נושאים</p>
          </div>
        </div>

        <Card className="overflow-hidden" padding="none">
          <div className="p-6" dir="rtl">
            <p className="text-sm text-[#7E7F90] leading-relaxed">
              ריכזנו את כל השאלות הנפוצות שקיבלנו על השקעות, חשבון מסחר, כשרות
              הלכתית, מיסוי והעברת תיק. לא מצאתם תשובה? צרו איתנו קשר.
            </p>
          </div>
        </Card>
      </AnimatedSection>

      {/* ── FAQ Sections ───────────────────────────── */}
      {FAQ_SECTIONS.map((section, sIdx) => {
        const Icon = section.icon;
        return (
          <div key={section.id}>
            <ScrollToNext
              targetRef={sectionRefs[sIdx]}
              label={section.title}
            />

            <AnimatedSection onRef={(el) => { (sectionRefs[sIdx] as React.MutableRefObject<HTMLDivElement | null>).current = el; }}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${section.iconBg} rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${section.iconColor}`} />
                </div>
                <div>
                  <h2 className="text-lg lg:text-xl font-bold text-[#303150]">{section.title}</h2>
                  <p className="text-xs text-[#7E7F90]">{section.items.length} שאלות</p>
                </div>
              </div>

              <Card className="overflow-hidden" padding="none">
                <div className="p-6 space-y-3" dir="rtl">
                  <FaqGroup items={section.items} />
                </div>
              </Card>
            </AnimatedSection>
          </div>
        );
      })}

      {/* ── Disclaimer ─────────────────────────────── */}
      <AnimatedSection>
        <Card className="overflow-hidden" padding="none">
          <div className="p-6 space-y-4" dir="rtl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#F18AB5]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-[#F18AB5]" />
              </div>
              <div className="space-y-2 flex-1">
                <h3 className="text-sm font-bold text-[#303150]">גילוי נאות</h3>
                <p className="text-sm text-[#7E7F90] leading-relaxed">
                  האמור אינו מהווה ייעוץ השקעות או שיווק השקעות ואינו תחליף
                  לייעוץ אישי. תשואות עבר אינן מעידות על תשואות עתידיות. כל השקעה
                  כרוכה בסיכון, כולל הפסד קרן. ההטבות בתוקף לפותחי חשבון דרך
                  MyNeto בלבד.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </AnimatedSection>
    </div>
  );
}
