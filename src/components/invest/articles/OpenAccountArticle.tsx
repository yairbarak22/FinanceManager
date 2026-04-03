'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  Gift,
  Briefcase,
  BarChart3,
  ListChecks,
  ShieldCheck,
  AlertCircle,
  Check,
  ChevronsDown,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import BrokerComparisonTable from '@/components/invest/BrokerComparisonTable';

/* ── Shared helpers ────────────────────────────────────────── */

function ScrollToNext({ targetRef, label }: { targetRef: React.RefObject<HTMLDivElement | null>; label: string }) {
  return (
    <motion.button
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
      onClick={() => targetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
      className="flex flex-col items-center gap-1.5 mx-auto text-[#BDBDCB] hover:text-[#0DBACC] transition-colors py-4 cursor-pointer"
      aria-label={label}
    >
      <span className="text-xs font-medium">{label}</span>
      <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
        <ChevronsDown className="w-5 h-5" />
      </motion.div>
    </motion.button>
  );
}

function AnimatedSection({ children, onRef }: { children: React.ReactNode; onRef?: (el: HTMLDivElement | null) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });
  return (
    <motion.div
      ref={(el) => { (ref as React.MutableRefObject<HTMLDivElement | null>).current = el; onRef?.(el); }}
      initial={{ opacity: 0, y: 40 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}
      className="space-y-6"
    >{children}</motion.div>
  );
}

/* ── Practice Step ─────────────────────────────────────────── */

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
        <div className="flex-1 pb-8">
          <h4 className="text-sm font-semibold text-[#303150] mb-2">{title}</h4>
          {children}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Main Article ──────────────────────────────────────────── */

export default function OpenAccountArticle() {
  const sec2Ref = useRef<HTMLDivElement>(null);
  const sec3Ref = useRef<HTMLDivElement>(null);
  const sec4Ref = useRef<HTMLDivElement>(null);
  const sec5Ref = useRef<HTMLDivElement>(null);

  return (
    <div className="space-y-8">
      {/* ── S1: Benefits ───────────────────────────── */}
      <AnimatedSection>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#E6F9F9] rounded-xl flex items-center justify-center">
            <Gift className="w-5 h-5 text-[#0DBACC]" />
          </div>
          <div>
            <h2 className="text-lg lg:text-xl font-bold text-[#303150]">פתיחת חשבון מסחר</h2>
            <p className="text-xs text-[#7E7F90]">הטבות בלעדיות דרך MyNeto</p>
          </div>
        </div>

        <Card className="overflow-hidden" padding="none">
          <div className="p-6 space-y-4" dir="rtl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#E6F9F9] rounded-xl flex items-center justify-center flex-shrink-0">
                <Gift className="w-6 h-6 text-[#0DBACC]" />
              </div>
              <div className="space-y-2 flex-1">
                <h3 className="text-sm font-bold text-[#303150]">ההטבות שלנו</h3>
                <p className="text-sm text-[#7E7F90] leading-relaxed">
                  חשבון מסחר עצמאי מאפשר לכם להשקיע ישירות בבורסה — בלי שמישהו אחר
                  יגבה מכם דמי ניהול על זה.
                </p>
              </div>
            </div>

            <BenefitItems />
          </div>
        </Card>
      </AnimatedSection>

      <ScrollToNext targetRef={sec2Ref} label="מה זה חשבון מסחר?" />

      {/* ── S2: What is trading account ────────────── */}
      <AnimatedSection onRef={(el) => { (sec2Ref as React.MutableRefObject<HTMLDivElement | null>).current = el; }}>
        <Card className="overflow-hidden" padding="none">
          <div className="p-6 space-y-4" dir="rtl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#C1DDFF]/30 rounded-xl flex items-center justify-center flex-shrink-0">
                <Briefcase className="w-6 h-6 text-[#69ADFF]" />
              </div>
              <div className="space-y-2 flex-1">
                <h3 className="text-sm font-bold text-[#303150]">מה זה חשבון מסחר עצמאי?</h3>
                <p className="text-sm text-[#7E7F90] leading-relaxed">
                  חשבון שמאפשר לכם לקנות ולמכור ניירות ערך (מניות, קרנות סל, אג&quot;ח)
                  ישירות בבורסה.{' '}
                  <span className="font-medium text-[#303150]">ההבדל העיקרי מקופת גמל או בנק</span>: אתם
                  שולטים בבחירות, ולא משלמים דמי ניהול על הנכסים עצמם.
                </p>
                <div className="bg-[#F7F7F8] rounded-xl p-3 space-y-1.5">
                  <p className="text-xs text-[#7E7F90]">
                    <span className="font-semibold text-[#303150]">בפועל:</span> הכסף רשום על שמכם בטאבו. גם אם בית ההשקעות נסגר מחר — הכסף שלכם נשאר שלכם.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </AnimatedSection>

      <ScrollToNext targetRef={sec3Ref} label="כמה זה עולה?" />

      {/* ── S3: Cost Comparison ─────────────────────── */}
      <AnimatedSection onRef={(el) => { (sec3Ref as React.MutableRefObject<HTMLDivElement | null>).current = el; }}>
        <Card className="overflow-hidden" padding="none">
          <div className="p-6 space-y-5" dir="rtl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#F18AB5]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-6 h-6 text-[#F18AB5]" />
              </div>
              <div className="space-y-2 flex-1">
                <h3 className="text-sm font-bold text-[#303150]">השוואת עלויות</h3>
                <p className="text-sm text-[#7E7F90] leading-relaxed">
                  עלויות שנתיות על תיק של{' '}
                  <span className="font-medium text-[#303150]">₪500,000</span>:
                </p>
              </div>
            </div>

            <CostComparison />

            <div className="bg-[#E6F9F9] rounded-xl p-4 text-center space-y-1">
              <p className="text-sm font-semibold text-[#0DBACC]">חסכון של ~₪5,000 בשנה</p>
              <p className="text-xs text-[#7E7F90]">על תיק של חצי מיליון ₪ — רק על דמי ניהול.</p>
            </div>

            {/* Broker comparison */}
            <div className="pt-4 border-t border-[#F7F7F8]">
              <h3 className="text-sm font-bold text-[#303150] mb-4">השוואת ברוקרים — אלטשולר שחם vs IBI</h3>
              <BrokerComparisonTable source="open_account_article" />
            </div>
          </div>
        </Card>
      </AnimatedSection>

      <ScrollToNext targetRef={sec4Ref} label="איך פותחים?" />

      {/* ── S4: 4-step process ─────────────────────── */}
      <AnimatedSection onRef={(el) => { (sec4Ref as React.MutableRefObject<HTMLDivElement | null>).current = el; }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#C1DDFF]/30 rounded-xl flex items-center justify-center">
            <ListChecks className="w-5 h-5 text-[#69ADFF]" />
          </div>
          <div>
            <h2 className="text-lg lg:text-xl font-bold text-[#303150]">תהליך הפתיחה</h2>
            <p className="text-xs text-[#7E7F90]">4 שלבים ב-3 דקות</p>
          </div>
        </div>

        <Card className="overflow-hidden" padding="none">
          <OpeningSteps />
        </Card>
      </AnimatedSection>

      <ScrollToNext targetRef={sec5Ref} label="מסלולים הלכתיים" />

      {/* ── S5: Kosher + Disclaimer ────────────────── */}
      <AnimatedSection onRef={(el) => { (sec5Ref as React.MutableRefObject<HTMLDivElement | null>).current = el; }}>
        <Card className="overflow-hidden border-2 border-[#E9A800]/30" padding="none">
          <div className="p-6 space-y-4" dir="rtl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#FFF8E1] rounded-xl flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-6 h-6 text-[#E9A800]" />
              </div>
              <div className="space-y-2 flex-1">
                <h3 className="text-sm font-bold text-[#303150]">מסלולים הלכתיים — מה כלול?</h3>
                <div className="space-y-1.5">
                  {['היתר עסקא חתום', 'קרנות מחקות בהכשר מהדרין (הראל, כסם, תכלית, מגדל)', 'פיקוח הלכתי שוטף', 'ללא חשיפה לחברות שעוסקות בתחומים בעייתיים הלכתית'].map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-[#E9A800] mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-[#7E7F90]">{item}</p>
                    </div>
                  ))}
                </div>
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

/* ── Benefit Items (staggered) ─────────────────────────────── */

function BenefitItems() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });

  const items = [
    { title: 'עד 300₪ מתנת הצטרפות', desc: 'לכל פותחי חשבון חדש דרכנו, ישר לחשבון.' },
    { title: 'דמי ניהול מופחתים או אפסיים', desc: 'אלטשולר: 0₪ לכל החיים. IBI: פטור ל-2 שנים.' },
    { title: 'מסלולי השקעה הלכתיים', desc: 'בפיקוח הלכתי מלא, בהכשר מהדרין.' },
    { title: 'פתיחה דיגיטלית', desc: 'באלטשולר: סלפי + ת"ז. ב-IBI: ללא מצלמה — מתאים לכולם!' },
  ];

  return (
    <div ref={ref} className="space-y-2">
      {items.map((item, i) => (
        <motion.div
          key={item.title}
          initial={{ opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.1 + i * 0.1 }}
          className="flex items-start gap-3"
        >
          <div className="w-6 h-6 bg-[#0DBACC]/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <Check className="w-3.5 h-3.5 text-[#0DBACC]" />
          </div>
          <div>
            <p className="text-sm text-[#303150] font-medium">{item.title}</p>
            <p className="text-xs text-[#7E7F90]">{item.desc}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ── Cost Comparison (staggered) ───────────────────────────── */

function CostComparison() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });

  const rows = [
    { label: 'בנק (1-1.5% דמי ניהול)', value: '₪5,000-7,500 בשנה', bg: 'bg-[#F18AB5]/10', border: 'border-[#F18AB5]/20', color: 'text-[#F18AB5]' },
    { label: 'קופת גמל (0.7-1%)', value: '₪3,500-5,000 בשנה', bg: 'bg-[#69ADFF]/10', border: 'border-[#69ADFF]/20', color: 'text-[#69ADFF]' },
    { label: 'מסחר עצמאי דרכנו (0%)', value: '₪0 בשנה', bg: 'bg-[#0DBACC]/10', border: 'border-[#0DBACC]/20', color: 'text-[#0DBACC]' },
  ];

  return (
    <div ref={ref} className="space-y-2">
      {rows.map((row, i) => (
        <motion.div
          key={row.label}
          initial={{ opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.1 + i * 0.1 }}
          className={`${row.bg} rounded-xl p-3 border ${row.border} flex items-center justify-between`}
        >
          <span className="text-xs text-[#7E7F90]">{row.label}</span>
          <span className={`text-sm font-bold ${row.color}`}>{row.value}</span>
        </motion.div>
      ))}
    </div>
  );
}

/* ── Opening Steps ─────────────────────────────────────────── */

function OpeningSteps() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });

  return (
    <div ref={ref} className="p-6 space-y-2" dir="rtl">
      <ProcessStep number={1} icon={<Gift className="w-5 h-5 text-[#69ADFF]" />} iconBg="bg-[#C1DDFF]/30" title="בחירת ברוקר וכניסה ללינק" delay={0.1} isInView={isInView}>
        <p className="text-sm text-[#7E7F90] leading-relaxed">בוחרים בין אלטשולר שחם ל-IBI ונכנסים דרך MyNeto — כדי לקבל את ההטבות.</p>
      </ProcessStep>
      <ProcessStep number={2} icon={<Briefcase className="w-5 h-5 text-[#0DBACC]" />} iconBg="bg-[#E6F9F9]" title="זיהוי דיגיטלי" delay={0.2} isInView={isInView}>
        <p className="text-sm text-[#7E7F90] leading-relaxed">באלטשולר: צילום ת&quot;ז + סלפי. ב-IBI: <span className="font-medium text-[#303150]">ללא מצלמה</span>.</p>
      </ProcessStep>
      <ProcessStep number={3} icon={<ShieldCheck className="w-5 h-5 text-[#E9A800]" />} iconBg="bg-[#FFF8E1]" title="בחירת מסלול" delay={0.3} isInView={isInView}>
        <p className="text-sm text-[#7E7F90] leading-relaxed">מסלול רגיל או מסלול הלכתי (כשר למהדרין). שניהם עם 0₪ דמי ניהול.</p>
      </ProcessStep>
      <ProcessStep number={4} icon={<ListChecks className="w-5 h-5 text-[#9F7FE0]" />} iconBg="bg-[#E3D6FF]" title="הגדרת הוראת קבע" delay={0.4} isInView={isInView} isLast>
        <p className="text-sm text-[#7E7F90] leading-relaxed">קבעו סכום חודשי ובחרו באיזו קרן להשקיע. <span className="font-medium text-[#303150]">פעם אחת ושכוחים</span>.</p>
      </ProcessStep>
    </div>
  );
}
