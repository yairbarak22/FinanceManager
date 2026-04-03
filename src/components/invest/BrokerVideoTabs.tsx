'use client';

import { useState } from 'react';
import { Check, ExternalLink, CameraOff, Camera } from 'lucide-react';
import VideoEmbed from '@/components/knowledge/VideoEmbed';
import { useAnalytics } from '@/hooks/useAnalytics';
import { trackCtaClickServer } from '@/lib/utils';

const ALTSHULER_URL =
  'https://digitalsolutions.as-invest.co.il/trade_OnBoarding/?utm_source=MyNeto&utm_medium=Link';
const IBI_URL =
  'https://onboarding.ibi.co.il/open-account?step=first_name&source__c=OB&UTM_Campaign_Source__c=OB&keyword__c=smart-feature-ob&Coupon__c=IBIYAIRBA&referrer=myNETO';

type BrokerId = 'altshuler' | 'ibi';

const brokerData: Record<BrokerId, {
  name: string;
  url: string;
  color: string;
  youtubeId: string;
  videoTitle: string;
  duration: string;
  bullets: string[];
  benefits: string[];
  identLabel: string;
  identIcon: typeof Camera;
}> = {
  altshuler: {
    name: 'אלטשולר שחם',
    url: ALTSHULER_URL,
    color: '#0DBACC',
    youtubeId: 'SVZnToUSRMg',
    videoTitle: 'פותחים חשבון באלטשולר שחם',
    duration: '04:24',
    bullets: [
      'תהליך פתיחת חשבון מסחר צעד אחר צעד',
      'איך לבחור מסלול',
      'מה ההטבות שמקבלים דרך MyNeto',
    ],
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
    youtubeId: 'FXt1hJf2IAk',
    videoTitle: 'פתיחת חשבון מסחר ב-IBI — גם ללא מצלמה',
    duration: '03:00',
    bullets: [
      'תהליך פתיחת חשבון ב-IBI צעד אחר צעד',
      'פתיחה ללא מצלמה — מתאים לכולם',
      'השוואה בין אלטשולר שחם ל-IBI',
    ],
    benefits: [
      'פטור מדמי ניהול ל-2 שנים',
      '300₪ מתנת הצטרפות',
      'מינימום הפקדה: 15,000₪',
    ],
    identLabel: 'ללא מצלמה!',
    identIcon: CameraOff,
  },
};

export default function BrokerVideoTabs() {
  const [active, setActive] = useState<BrokerId>('altshuler');
  const { trackOpenTradingAccountClicked } = useAnalytics();
  const broker = brokerData[active];
  const IdentIcon = broker.identIcon;

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex rounded-xl bg-[#F7F7F8] p-1">
        {(Object.keys(brokerData) as BrokerId[]).map((id) => (
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
            {brokerData[id].name}
          </button>
        ))}
      </div>

      {/* Video */}
      <VideoEmbed
        key={active}
        youtubeId={broker.youtubeId}
        title={broker.videoTitle}
        duration={broker.duration}
        bullets={broker.bullets}
      />

      {/* Benefits + CTA */}
      <div
        className="rounded-2xl p-5 space-y-4"
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
          {/* Identification row */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `${broker.color}14` }}
            >
              <IdentIcon className="w-3 h-3" style={{ color: broker.color }} strokeWidth={2.5} />
            </div>
            <span className={`text-[0.8125rem] ${active === 'ibi' ? 'font-bold' : ''}`} style={{ color: active === 'ibi' ? broker.color : '#303150' }}>
              {broker.identLabel}
            </span>
          </div>
        </div>

        <a
          href={broker.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => { trackOpenTradingAccountClicked('course_video_tab', active); trackCtaClickServer(`course_video_tab_${active}`); }}
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
  );
}
