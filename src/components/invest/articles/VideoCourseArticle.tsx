'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  Lightbulb,
  PlayCircle,
  Check,
  AlertCircle,
  ChevronsDown,
} from 'lucide-react';
import Card from '@/components/ui/Card';

/* ── Data ──────────────────────────────────────────────────── */

const VIDEOS = [
  {
    id: 'eSPdAfQmDRA',
    chapter: 'כדור השלג של הכסף',
    title: 'למה חיסכון בבנק כבר לא מספיק?',
    duration: '03:24',
    points: [
      'איך אינפלציה אוכלת את הכסף שיושב בבנק',
      'מה ההבדל בין חיסכון להשקעה',
      'למה ריבית דריבית היא הכוח שישנה לכם את החיים',
    ],
  },
  {
    id: 'AvmYuJrEF18',
    chapter: 'סוד ה-S&P 500',
    title: 'למה הסטטיסטיקה מנצחת את המומחים?',
    duration: '03:41',
    points: [
      'מה זה מדד S&P 500 ולמה הוא עובד',
      'למה 94% מהמנהלים האקטיביים מפסידים למדד',
      'מה זה השקעה פסיבית ואיך היא חוסכת לכם כסף',
    ],
  },
  {
    id: 'SVZnToUSRMg',
    chapter: 'פתיחת חשבון',
    title: 'פותחים חשבון באלטשולר שחם',
    duration: '04:24',
    points: [
      'תהליך פתיחת חשבון מסחר צעד אחר צעד',
      'איך לבחור מסלול — רגיל או הלכתי',
      'מה ההטבות שמקבלים דרך MyNeto',
    ],
  },
  {
    id: 'TdA1O5MeifQ',
    chapter: 'טייס אוטומטי',
    title: 'בחירת המסלול והוראת הקבע',
    duration: '02:34',
    points: [
      'איך לבחור קרן מחקה S&P 500',
      'הגדרת הוראת קבע חודשית — פעם אחת ושכוחים',
      'למה זה הצעד הכי חשוב שתעשו',
    ],
  },
];

const VIDEO_COLORS = [
  { iconBg: 'bg-[#E6F9F9]', iconColor: 'text-[#0DBACC]' },
  { iconBg: 'bg-[#C1DDFF]/30', iconColor: 'text-[#69ADFF]' },
  { iconBg: 'bg-[#E3D6FF]', iconColor: 'text-[#9F7FE0]' },
  { iconBg: 'bg-[#F18AB5]/10', iconColor: 'text-[#F18AB5]' },
];

function getEmbed(id: string) {
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&iv_load_policy=3`;
}

/* ── Shared helpers ────────────────────────────────────────── */

function ScrollToNext({ targetRef, label }: { targetRef: React.RefObject<HTMLDivElement | null>; label: string }) {
  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
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
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className="space-y-6"
    >
      {children}
    </motion.div>
  );
}

/* ── Learning points with stagger ──────────────────────────── */

function LearningPoints({ points, color }: { points: string[]; color: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });
  return (
    <div ref={ref} className="space-y-2">
      {points.map((pt, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.1 + i * 0.1 }}
          className="flex items-start gap-3"
        >
          <div className={`w-6 h-6 ${color === '#0DBACC' ? 'bg-[#0DBACC]/10' : color === '#69ADFF' ? 'bg-[#69ADFF]/10' : color === '#9F7FE0' ? 'bg-[#9F7FE0]/10' : 'bg-[#F18AB5]/10'} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
            <Check className="w-3.5 h-3.5" style={{ color }} />
          </div>
          <p className="text-sm text-[#7E7F90]">{pt}</p>
        </motion.div>
      ))}
    </div>
  );
}

/* ── Main Article ──────────────────────────────────────────── */

export default function VideoCourseArticle() {
  const videoRefs = [
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
  ];

  return (
    <div className="space-y-8">
      {/* ── Intro Section ──────────────────────────── */}
      <AnimatedSection>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#FFF8E1] rounded-xl flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-[#E9A800]" />
          </div>
          <div>
            <h2 className="text-lg lg:text-xl font-bold text-[#303150]">קורס השקעות בוידאו</h2>
            <p className="text-xs text-[#7E7F90]">4 סרטונים קצרים · ~14 דקות סה&quot;כ</p>
          </div>
        </div>

        <Card className="overflow-hidden" padding="none">
          <div className="p-6 space-y-4" dir="rtl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#FFF8E1] rounded-xl flex items-center justify-center flex-shrink-0">
                <Lightbulb className="w-6 h-6 text-[#E9A800]" />
              </div>
              <div className="space-y-2 flex-1">
                <h3 className="text-sm font-bold text-[#303150]">טיפ: צפו בסדר</h3>
                <p className="text-sm text-[#7E7F90] leading-relaxed">
                  הסרטונים בנויים בסדר לוגי — כל אחד בונה על הקודם. מומלץ לצפות
                  מההתחלה עד הסוף, גם אם חלק מהנושאים מוכרים לכם.
                </p>
              </div>
            </div>
          </div>
        </Card>

        <div className="bg-[#E6F9F9] rounded-xl p-4 text-center space-y-1">
          <p className="text-sm font-semibold text-[#0DBACC]">~14 דקות. זהו.</p>
          <p className="text-xs text-[#7E7F90]">אחרי 4 סרטונים קצרים תדעו בדיוק איך להתחיל להשקיע.</p>
        </div>
      </AnimatedSection>

      {/* ── Video Sections ─────────────────────────── */}
      {VIDEOS.map((video, i) => {
        const colors = VIDEO_COLORS[i];
        const colorHex = colors.iconColor.replace('text-[', '').replace(']', '');
        const isLast = i === VIDEOS.length - 1;

        return (
          <div key={video.id}>
            <ScrollToNext
              targetRef={videoRefs[i]}
              label={`צעד ${i + 1}: ${video.chapter}`}
            />

            <AnimatedSection onRef={(el) => { (videoRefs[i] as React.MutableRefObject<HTMLDivElement | null>).current = el; }}>
              {/* Video Card */}
              <Card className="overflow-hidden" padding="none">
                <div className="p-6 space-y-4" dir="rtl">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 ${colors.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <PlayCircle className={`w-6 h-6 ${colors.iconColor}`} />
                    </div>
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-[#303150]">
                          צעד {i + 1}: {video.title}
                        </h3>
                        <span className="text-[10px] text-[#BDBDCB] ms-auto flex-shrink-0">
                          {video.duration}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-[#7E7F90]">מה תלמדו:</p>
                      <LearningPoints points={video.points} color={colorHex} />
                    </div>
                  </div>
                </div>
              </Card>

              {/* YouTube Embed */}
              <Card className="overflow-hidden" padding="none">
                <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                  <iframe
                    src={getEmbed(video.id)}
                    className="absolute inset-0 w-full h-full border-0"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allow="accelerometer; gyroscope; encrypted-media; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                    title={video.title}
                  />
                </div>
              </Card>

              {/* Disclaimer on last video */}
              {isLast && (
                <Card className="overflow-hidden" padding="none">
                  <div className="p-6 space-y-4" dir="rtl">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-[#F18AB5]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="w-6 h-6 text-[#F18AB5]" />
                      </div>
                      <div className="space-y-2 flex-1">
                        <h3 className="text-sm font-bold text-[#303150]">גילוי נאות</h3>
                        <p className="text-sm text-[#7E7F90] leading-relaxed">
                          האמור אינו מהווה ייעוץ השקעות או שיווק השקעות ואינו
                          תחליף לייעוץ אישי. ההטבות בתוקף לפותחי חשבון דרך
                          MyNeto בלבד.
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </AnimatedSection>
          </div>
        );
      })}
    </div>
  );
}
