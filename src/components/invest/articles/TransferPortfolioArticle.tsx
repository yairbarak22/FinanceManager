'use client';

import { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  ArrowRightLeft,
  BarChart3,
  ListChecks,
  Lightbulb,
  HelpCircle,
  Phone,
  AlertCircle,
  Check,
  Plus,
  Minus,
  ChevronsDown,
} from 'lucide-react';
import Card from '@/components/ui/Card';

/* ── Data ──────────────────────────────────────────────────── */

const TRANSFER_FAQ = [
  { q: 'מה קורה לניירות הערך שלי בזמן ההעברה?', a: 'ניירות הערך שלכם עוברים כמו שהם לחשבון החדש. אין מכירה, אין קנייה מחדש. אתם ממשיכים להחזיק בדיוק את אותם ניירות ערך.' },
  { q: 'איך מתחילים את תהליך ההעברה?', a: 'קודם פותחים חשבון באלטשולר שחם טרייד (דרכנו, כדי לקבל את ההטבות). אחרי ההצטרפות יוצרים קשר עם אלטשולר לקבלת מספר חשבון ואישור ניהול חשבון, שולחים דו"ח אחזקות לתיאום, ואז פונים לבנק/ברוקר הנוכחי עם טופס ההעברה.' },
  { q: 'יש עלות להעברת התיק?', a: 'אלטשולר שחם טרייד לא גובים על קבלת ניירות הערך. ייתכן שהבנק או הברוקר הנוכחי ייגבו עמלת העברה, כדאי לבדוק מולם מראש. בכל מקרה, החיסכון בדמי ניהול מכסה את זה תוך זמן קצר.' },
  { q: 'האם ההעברה יוצרת אירוע מס?', a: 'לא. העברת ניירות ערך בין חשבונות אינה אירוע מס כי אתם לא מוכרים את ניירות הערך. מחיר הרכישה המקורי נשמר.' },
  { q: 'אילו ניירות ערך אפשר להעביר?', a: 'ניתן להעביר ניירות ערך הנסחרים בישראל ובארה"ב. העברת ני"ע הנסחרים בארה"ב כפופה לאישור מראש של אלטשולר שחם טרייד. שלחו את דו"ח האחזקות שלכם לתיאום מראש.' },
  { q: 'איך יוצרים קשר עם אלטשולר שחם טרייד?', a: 'במייל: alt-trade@altshul.co.il או בוואטסאפ: 052-7781070. שירות לקוחות זמין בימים ב׳ עד ה׳ 09:00 עד 17:00, יום ו׳ 09:00 עד 14:00.' },
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

function ProcessStep({ number, icon, iconBg, title, children, delay = 0, isInView, isLast = false }: {
  number: number; icon: React.ReactNode; iconBg: string; title: string; children: React.ReactNode; delay?: number; isInView: boolean; isLast?: boolean;
}) {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={isInView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.5, delay }} className="relative">
      {!isLast && <div className="absolute right-5 top-16 bottom-0 w-px bg-[#E8E8ED]" />}
      <div className="flex items-start gap-4">
        <div className="flex flex-col items-center gap-2 flex-shrink-0">
          <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center relative z-10`}>{icon}</div>
          <span className="text-[10px] font-bold text-[#BDBDCB]">שלב {number}</span>
        </div>
        <div className="flex-1 pb-8"><h4 className="text-sm font-semibold text-[#303150] mb-2">{title}</h4>{children}</div>
      </div>
    </motion.div>
  );
}

/* ── Main Article ──────────────────────────────────────────── */

export default function TransferPortfolioArticle() {
  const sec2Ref = useRef<HTMLDivElement>(null);
  const sec3Ref = useRef<HTMLDivElement>(null);
  const sec4Ref = useRef<HTMLDivElement>(null);
  const sec5Ref = useRef<HTMLDivElement>(null);
  const sec6Ref = useRef<HTMLDivElement>(null);

  return (
    <div className="space-y-8">
      {/* ── S1: Why Transfer ───────────────────────── */}
      <AnimatedSection>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#E6F9F9] rounded-xl flex items-center justify-center">
            <ArrowRightLeft className="w-5 h-5 text-[#0DBACC]" />
          </div>
          <div>
            <h2 className="text-lg lg:text-xl font-bold text-[#303150]">העברת תיק השקעות קיים</h2>
            <p className="text-xs text-[#7E7F90]">למה כדאי ואיך עושים את זה</p>
          </div>
        </div>

        <Card className="overflow-hidden" padding="none">
          <div className="p-6 space-y-4" dir="rtl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#E6F9F9] rounded-xl flex items-center justify-center flex-shrink-0">
                <ArrowRightLeft className="w-6 h-6 text-[#0DBACC]" />
              </div>
              <div className="space-y-2 flex-1">
                <h3 className="text-sm font-bold text-[#303150]">3 סיבות להעביר את התיק</h3>
                <p className="text-sm text-[#7E7F90] leading-relaxed">
                  יש לכם תיק בבנק או בברוקר אחר? סביר שאתם משלמים אלפי שקלים בשנה על דמי ניהול — בלי לשים לב.
                </p>
              </div>
            </div>
            <ReasonsToTransfer />
          </div>
        </Card>
      </AnimatedSection>

      <ScrollToNext targetRef={sec2Ref} label="כמה תחסכו?" />

      {/* ── S2: Savings ────────────────────────────── */}
      <AnimatedSection onRef={(el) => { (sec2Ref as React.MutableRefObject<HTMLDivElement | null>).current = el; }}>
        <Card className="overflow-hidden" padding="none">
          <div className="p-6 space-y-5" dir="rtl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#F18AB5]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-6 h-6 text-[#F18AB5]" />
              </div>
              <div className="space-y-2 flex-1">
                <h3 className="text-sm font-bold text-[#303150]">כמה תחסכו? דוגמה מספרית</h3>
                <p className="text-sm text-[#7E7F90] leading-relaxed">
                  תיק בשווי <span className="font-medium text-[#303150]">₪500,000</span> עם דמי ניהול של <span className="font-medium text-[#303150]">1%</span> בבנק:
                </p>
              </div>
            </div>
            <div className="bg-[#F7F7F8] rounded-xl p-3 space-y-2">
              <div className="flex justify-between text-xs text-[#7E7F90]">
                <span>עלות שנתית</span><span className="font-semibold text-[#F18AB5]">₪5,000</span>
              </div>
              <div className="flex justify-between text-xs text-[#7E7F90]">
                <span>עלות ב-10 שנים</span><span className="font-semibold text-[#F18AB5]">~₪65,000</span>
              </div>
              <div className="flex justify-between text-xs text-[#7E7F90]">
                <span>עלות ב-20 שנים</span><span className="font-semibold text-[#F18AB5]">~₪200,000</span>
              </div>
              <div className="flex justify-between text-xs border-t border-[#E8E8ED] pt-2">
                <span className="font-semibold text-[#303150]">דמי ניהול דרכנו</span><span className="font-black text-[#0DBACC]">₪0</span>
              </div>
            </div>
            <div className="bg-[#E6F9F9] rounded-xl p-4 text-center space-y-1">
              <p className="text-sm font-semibold text-[#0DBACC]">חסכון של ~₪200,000 ב-20 שנה</p>
              <p className="text-xs text-[#7E7F90]">רק על דמי ניהול — בלי לשנות את אסטרטגיית ההשקעה.</p>
            </div>
          </div>
        </Card>
      </AnimatedSection>

      <ScrollToNext targetRef={sec3Ref} label="איך מעבירים?" />

      {/* ── S3: 5-step process ─────────────────────── */}
      <AnimatedSection onRef={(el) => { (sec3Ref as React.MutableRefObject<HTMLDivElement | null>).current = el; }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#C1DDFF]/30 rounded-xl flex items-center justify-center">
            <ListChecks className="w-5 h-5 text-[#69ADFF]" />
          </div>
          <div>
            <h2 className="text-lg lg:text-xl font-bold text-[#303150]">תהליך ההעברה</h2>
            <p className="text-xs text-[#7E7F90]">5 צעדים פשוטים</p>
          </div>
        </div>
        <Card className="overflow-hidden" padding="none">
          <TransferSteps />
        </Card>
      </AnimatedSection>

      <ScrollToNext targetRef={sec4Ref} label="מה חשוב לדעת?" />

      {/* ── S4: Important notes ────────────────────── */}
      <AnimatedSection onRef={(el) => { (sec4Ref as React.MutableRefObject<HTMLDivElement | null>).current = el; }}>
        <Card className="overflow-hidden" padding="none">
          <div className="p-6 space-y-4" dir="rtl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#FFF8E1] rounded-xl flex items-center justify-center flex-shrink-0">
                <Lightbulb className="w-6 h-6 text-[#E9A800]" />
              </div>
              <div className="space-y-2 flex-1">
                <h3 className="text-sm font-bold text-[#303150]">מה חשוב לדעת</h3>
                <div className="space-y-1.5">
                  {[
                    { bold: 'ניירות הערך לא נמכרים', text: '— הם פשוט עוברים חשבון' },
                    { bold: 'מחיר הרכישה המקורי נשמר', text: '' },
                    { bold: 'אין אירוע מס', text: '— לא נוצר רווח הון' },
                    { bold: 'אפשר להעביר', text: ' ני"ע הנסחרים בישראל ובארה"ב' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-[#E9A800] mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-[#7E7F90]"><span className="font-medium text-[#303150]">{item.bold}</span>{item.text}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-[#FFF8E1] rounded-xl p-3 mt-2">
                  <p className="text-xs text-[#7E7F90]">
                    <span className="font-medium text-[#E9A800]">טיפ:</span> שלחו דו&quot;ח אחזקות לאלטשולר לפני שמתחילים — כדי לוודא שכל ניירות הערך ניתנים להעברה.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </AnimatedSection>

      <ScrollToNext targetRef={sec5Ref} label="שאלות נפוצות" />

      {/* ── S5: FAQ ────────────────────────────────── */}
      <AnimatedSection onRef={(el) => { (sec5Ref as React.MutableRefObject<HTMLDivElement | null>).current = el; }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#C1DDFF]/30 rounded-xl flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-[#69ADFF]" />
          </div>
          <div>
            <h2 className="text-lg lg:text-xl font-bold text-[#303150]">שאלות נפוצות</h2>
            <p className="text-xs text-[#7E7F90]">על העברת תיק</p>
          </div>
        </div>
        <Card className="overflow-hidden" padding="none">
          <div className="p-6 space-y-3" dir="rtl">
            <TransferFaqGroup />
          </div>
        </Card>
      </AnimatedSection>

      <ScrollToNext targetRef={sec6Ref} label="יצירת קשר" />

      {/* ── S6: Contact + Disclaimer ───────────────── */}
      <AnimatedSection onRef={(el) => { (sec6Ref as React.MutableRefObject<HTMLDivElement | null>).current = el; }}>
        <Card className="overflow-hidden" padding="none">
          <div className="p-6 space-y-4" dir="rtl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#E6F9F9] rounded-xl flex items-center justify-center flex-shrink-0">
                <Phone className="w-6 h-6 text-[#0DBACC]" />
              </div>
              <div className="space-y-2 flex-1">
                <h3 className="text-sm font-bold text-[#303150]">יצירת קשר עם אלטשולר שחם טרייד</h3>
                <p className="text-sm text-[#7E7F90] leading-relaxed">
                  מייל: <span className="font-medium text-[#303150]">alt-trade@altshul.co.il</span><br />
                  וואטסאפ: <span className="font-medium text-[#303150]">052-7781070</span><br />
                  שירות לקוחות: ב&apos;-ה&apos; 09:00-17:00, ו&apos; 09:00-14:00
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden" padding="none">
          <div className="p-6 space-y-4" dir="rtl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#F18AB5]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-[#F18AB5]" />
              </div>
              <div className="space-y-2 flex-1">
                <h3 className="text-sm font-bold text-[#303150]">גילוי נאות</h3>
                <p className="text-sm text-[#7E7F90] leading-relaxed">
                  האמור אינו מהווה ייעוץ השקעות או שיווק השקעות. ההטבות בתוקף לפותחי חשבון דרך MyNeto בלבד.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </AnimatedSection>
    </div>
  );
}

/* ── Reasons to Transfer (staggered) ───────────────────────── */

function ReasonsToTransfer() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });
  const reasons = [
    { n: '1', text: '0₪ דמי ניהול לכל החיים', desc: 'חסכון של אלפי ₪ בשנה, עשרות אלפים לאורך השנים.' },
    { n: '2', text: '200₪ מתנת הצטרפות', desc: 'ישר לחשבון המסחר.' },
    { n: '3', text: 'פלטפורמה מודרנית', desc: 'ממשק נוח, אפליקציה, ומעקב מלא ב-MyNeto.' },
  ];
  return (
    <div ref={ref} className="space-y-2">
      {reasons.map((r, i) => (
        <motion.div key={r.n} initial={{ opacity: 0, y: 10 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.4, delay: 0.1 + i * 0.1 }}
          className="bg-[#0DBACC]/10 rounded-xl p-3 border border-[#0DBACC]/20 flex items-start gap-3">
          <span className="w-6 h-6 bg-[#0DBACC]/20 rounded-full flex items-center justify-center text-xs font-bold text-[#0DBACC] flex-shrink-0">{r.n}</span>
          <div>
            <p className="text-xs font-medium text-[#0DBACC]">{r.text}</p>
            <p className="text-[10px] text-[#7E7F90]">{r.desc}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ── Transfer Steps ────────────────────────────────────────── */

function TransferSteps() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });
  const steps = [
    { title: 'פתחו חשבון באלטשולר שחם טרייד', desc: 'דרך הקישור שלנו כדי לקבל את ההטבות.', icon: <ArrowRightLeft className="w-5 h-5 text-[#69ADFF]" />, bg: 'bg-[#C1DDFF]/30' },
    { title: 'צרו קשר עם אלטשולר', desc: 'קבלו מספר חשבון ואישור ניהול חשבון.', icon: <Phone className="w-5 h-5 text-[#0DBACC]" />, bg: 'bg-[#E6F9F9]' },
    { title: 'שלחו דו"ח אחזקות', desc: 'מהבנק או הברוקר הנוכחי, לתיאום מראש.', icon: <BarChart3 className="w-5 h-5 text-[#E9A800]" />, bg: 'bg-[#FFF8E1]' },
    { title: 'פנו לבנק/ברוקר הנוכחי', desc: 'עם טופס העברה שתקבלו מאלטשולר. בקשו להעביר את ניירות הערך.', icon: <ListChecks className="w-5 h-5 text-[#9F7FE0]" />, bg: 'bg-[#E3D6FF]' },
    { title: 'ההעברה מתבצעת', desc: 'בדרך כלל תוך 2-4 שבועות. ניירות הערך עוברים כמו שהם.', icon: <Check className="w-5 h-5 text-[#0DBACC]" />, bg: 'bg-[#E6F9F9]' },
  ];
  return (
    <div ref={ref} className="p-6 space-y-2" dir="rtl">
      {steps.map((step, i) => (
        <ProcessStep key={i} number={i + 1} icon={step.icon} iconBg={step.bg} title={step.title} delay={0.1 + i * 0.1} isInView={isInView} isLast={i === steps.length - 1}>
          <p className="text-sm text-[#7E7F90] leading-relaxed">{step.desc}</p>
        </ProcessStep>
      ))}
    </div>
  );
}

/* ── FAQ Group (single-open) ───────────────────────────────── */

function TransferFaqGroup() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  return (
    <>
      {TRANSFER_FAQ.map((item, i) => (
        <Accordion key={i} title={item.q} isOpen={openIndex === i} onToggle={() => setOpenIndex(openIndex === i ? null : i)}>
          <p>{item.a}</p>
        </Accordion>
      ))}
    </>
  );
}
