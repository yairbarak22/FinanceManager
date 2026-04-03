'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ExternalLink, CameraOff, Camera } from 'lucide-react';
import Card from '@/components/ui/Card';
import LessonBadge from './LessonBadge';
import type { Lesson } from './coursesData';
import { useAnalytics } from '@/hooks/useAnalytics';
import { trackCtaClickServer } from '@/lib/utils';

const ALTSHULER_URL =
  'https://digitalsolutions.as-invest.co.il/trade_OnBoarding/?utm_source=MyNeto&utm_medium=Link';
const IBI_URL =
  'https://onboarding.ibi.co.il/open-account?step=first_name&source__c=OB&UTM_Campaign_Source__c=OB&keyword__c=smart-feature-ob&Coupon__c=IBIYAIRBA&referrer=myNETO';

type BrokerId = 'altshuler' | 'ibi';

const brokers: Record<BrokerId, {
  name: string;
  url: string;
  color: string;
  videoUrl: string;
  title: string;
  benefits: string[];
  identLabel: string;
  identIcon: typeof Camera;
}> = {
  altshuler: {
    name: 'אלטשולר שחם',
    url: ALTSHULER_URL,
    color: '#0DBACC',
    videoUrl: 'https://www.youtube-nocookie.com/embed/SVZnToUSRMg?rel=0&modestbranding=1&iv_load_policy=3',
    title: 'פותחים חשבון באלטשולר שחם (צעד אחר צעד)',
    benefits: [
      '0₪ דמי ניהול לכל החיים',
      '200₪ מתנת הצטרפות',
      'מינימום הפקדה: 5,000₪',
    ],
    identLabel: 'זיהוי: סלפי + ת"ז',
    identIcon: Camera,
  },
  ibi: {
    name: 'IBI',
    url: IBI_URL,
    color: '#2B4699',
    videoUrl: 'https://www.youtube-nocookie.com/embed/FXt1hJf2IAk?rel=0&modestbranding=1&iv_load_policy=3',
    title: 'פתיחת חשבון ב-IBI — גם ללא מצלמה',
    benefits: [
      'פטור מדמי ניהול ל-2 שנים',
      '300₪ מתנת הצטרפות',
      'מינימום הפקדה: 15,000₪',
    ],
    identLabel: 'ללא מצלמה!',
    identIcon: CameraOff,
  },
};

interface BrokerVideoPlayerProps {
  lesson: Lesson;
  chapterTitle: string;
  lessonNumber: number;
  totalLessons: number;
}

export default function BrokerVideoPlayer({ lesson, chapterTitle, lessonNumber, totalLessons }: BrokerVideoPlayerProps) {
  const [active, setActive] = useState<BrokerId>('altshuler');
  const { trackOpenTradingAccountClicked } = useAnalytics();
  const broker = brokers[active];
  const IdentIcon = broker.identIcon;

  return (
    <Card padding="none" className="overflow-hidden">
      {/* Broker Tabs */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex rounded-xl bg-[#F7F7F8] p-1">
          {(Object.keys(brokers) as BrokerId[]).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setActive(id)}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all duration-200 cursor-pointer ${
                active === id
                  ? 'bg-white text-[#303150] shadow-sm'
                  : 'text-[#BDBDCB] hover:text-[#7E7F90]'
              }`}
            >
              {brokers[id].name}
            </button>
          ))}
        </div>
      </div>

      {/* Video */}
      <motion.div
        key={active}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="relative w-full overflow-hidden"
        style={{ paddingTop: '56.25%' }}
      >
        <iframe
          src={broker.videoUrl}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute inset-0 w-full h-full border-0"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      </motion.div>

      {/* Lesson info */}
      <div className="p-6">
        <div className="flex items-start justify-between gap-3 mb-5">
          <div className="min-w-0">
            <p className="text-[0.8125rem] font-medium text-[#7E7F90] mb-1">{chapterTitle}</p>
            <h2 className="text-[1.125rem] font-bold text-[#303150]">{broker.title}</h2>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 mt-1">
            {lesson.badge && <LessonBadge type={lesson.badge} />}
            <div
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-[#7E7F90]"
              style={{ background: '#F7F7F8' }}
            >
              <span>{lessonNumber}</span>
              <span className="text-[#BDBDCB]">/</span>
              <span className="text-[#BDBDCB]">{totalLessons}</span>
            </div>
          </div>
        </div>

        {/* Benefits + CTA */}
        <div
          className="rounded-2xl p-5 space-y-4 transition-colors duration-200"
          style={{
            background: `${broker.color}08`,
            border: `1px solid ${broker.color}1A`,
          }}
        >
          <p className="text-sm font-bold text-[#303150]">הטבות {broker.name} דרך MyNeto:</p>

          <div className="space-y-2">
            {broker.benefits.map((b, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div
                  className="w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${broker.color}14` }}
                >
                  <Check className="w-3 h-3" style={{ color: broker.color }} strokeWidth={2.5} />
                </div>
                <span className="text-[0.8125rem] text-[#303150]">{b}</span>
              </div>
            ))}
            {/* Identification */}
            <div className="flex items-center gap-2.5">
              <div
                className="w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${broker.color}14` }}
              >
                <IdentIcon className="w-3 h-3" style={{ color: broker.color }} strokeWidth={2.5} />
              </div>
              <span
                className={`text-[0.8125rem] ${active === 'ibi' ? 'font-bold' : ''}`}
                style={{ color: active === 'ibi' ? broker.color : '#303150' }}
              >
                {broker.identLabel}
              </span>
            </div>
          </div>

          <a
            href={broker.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => { trackOpenTradingAccountClicked('course_broker_tab', active); trackCtaClickServer(`course_broker_tab_${active}`); }}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-bold text-sm text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: broker.color }}
          >
            <span>לפתיחת חשבון ב{broker.name}</span>
            <ExternalLink className="w-3.5 h-3.5" strokeWidth={2} />
          </a>

          <p className="text-center text-[0.625rem] text-[#BDBDCB]/70 leading-relaxed">
            אינו מהווה ייעוץ השקעות. ההטבות לפותחי חשבון דרך MyNeto בלבד.
          </p>
        </div>
      </div>
    </Card>
  );
}
