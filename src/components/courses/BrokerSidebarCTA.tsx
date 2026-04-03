'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Check, ChevronDown, TrendingUp } from 'lucide-react';
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
  benefits: { text: string; highlight: string; suffix: string }[];
  mainBenefit: string;
  mainBenefitSub: string;
}> = {
  altshuler: {
    name: 'אלטשולר שחם',
    url: ALTSHULER_URL,
    color: '#0DBACC',
    benefits: [
      { text: 'פתיחת חשבון מ-', highlight: '5,000 ₪', suffix: 'בלבד' },
      { text: '', highlight: '200 ₪', suffix: 'מתנת הצטרפות' },
      { text: 'דמי ניהול', highlight: '0₪', suffix: 'לכל החיים' },
    ],
    mainBenefit: 'פטור מלא מדמי ניהול!',
    mainBenefitSub: 'ללא הגבלת זמן',
  },
  ibi: {
    name: 'IBI',
    url: IBI_URL,
    color: '#2B4699',
    benefits: [
      { text: '', highlight: '300 ₪', suffix: 'מתנת הצטרפות' },
      { text: 'פטור מדמי ניהול', highlight: 'ל-2 שנים', suffix: '' },
      { text: 'פתיחה', highlight: 'ללא מצלמה', suffix: '' },
    ],
    mainBenefit: 'פתיחה ללא מצלמה!',
    mainBenefitSub: 'מתאים לכולם',
  },
};

interface BrokerSidebarCTAProps {
  isCollapsed: boolean;
}

export default function BrokerSidebarCTA({ isCollapsed }: BrokerSidebarCTAProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeBroker, setActiveBroker] = useState<BrokerId>('altshuler');
  const { trackOpenTradingAccountClicked } = useAnalytics();
  const broker = brokerData[activeBroker];

  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center py-3 border-t border-[#F7F7F8]">
        <button
          type="button"
          onClick={() => setIsExpanded((v) => !v)}
          className="w-8 h-8 rounded-full bg-[#0DBACC]/10 flex items-center justify-center transition-transform duration-150 hover:scale-110"
          title="פתיחת חשבון מסחר"
        >
          <TrendingUp className="w-3.5 h-3.5 text-[#0DBACC]" strokeWidth={2} />
        </button>
      </div>
    );
  }

  return (
    <div className="border-t border-[#F7F7F8]">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded((v) => !v)}
        className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-[#F7F7F8] transition-colors duration-150 cursor-pointer"
      >
        <div className="w-7 h-7 rounded-lg bg-[#0DBACC]/8 flex items-center justify-center flex-shrink-0">
          <TrendingUp className="w-3.5 h-3.5 text-[#0DBACC]" strokeWidth={1.75} />
        </div>
        <div className="flex-1 min-w-0 text-right">
          <p className="text-[0.75rem] font-bold text-[#303150] truncate leading-tight">
            פתיחת חשבון מסחר
          </p>
          <p className="text-[0.625rem] text-[#BDBDCB] mt-px truncate">
            אלטשולר שחם או IBI · בשיתוף MyNeto
          </p>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="flex-shrink-0"
        >
          <ChevronDown className="w-3.5 h-3.5 text-[#BDBDCB]" strokeWidth={1.75} />
        </motion.div>
      </button>

      {/* Expandable details */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              {/* Broker tabs */}
              <div className="flex rounded-lg bg-[#F7F7F8] p-0.5 mb-3">
                {(Object.keys(brokerData) as BrokerId[]).map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveBroker(id)}
                    className={`flex-1 py-1.5 px-2 rounded-md text-[0.625rem] font-bold transition-all duration-200 cursor-pointer ${
                      activeBroker === id
                        ? 'bg-white text-[#303150] shadow-sm'
                        : 'text-[#BDBDCB] hover:text-[#7E7F90]'
                    }`}
                  >
                    {brokerData[id].name}
                  </button>
                ))}
              </div>

              {/* Main benefit */}
              <div
                className="py-2.5 px-3 rounded-xl text-center mb-3 transition-colors duration-200"
                style={{
                  background: `${broker.color}08`,
                  border: `1px solid ${broker.color}1A`,
                }}
              >
                <p className="text-[0.8125rem] font-bold text-[#303150] leading-snug">
                  {broker.mainBenefit}
                </p>
                <p className="text-[0.625rem] font-medium mt-0.5" style={{ color: broker.color }}>
                  {broker.mainBenefitSub}
                </p>
              </div>

              {/* Benefits */}
              <div className="space-y-1.5 mb-3">
                {broker.benefits.map((b, i) => (
                  <div key={`${activeBroker}-${i}`} className="flex items-center gap-2">
                    <Check className="w-3 h-3 flex-shrink-0" style={{ color: broker.color }} strokeWidth={2.5} />
                    <p className="text-[0.6875rem] text-[#7E7F90] leading-snug">
                      {b.text}
                      <span className="font-bold text-[#303150]">{b.highlight}</span>
                      {b.suffix && <span> {b.suffix}</span>}
                    </p>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <a
                href={broker.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => { trackOpenTradingAccountClicked('course_sidebar', activeBroker); trackCtaClickServer(`course_sidebar_${activeBroker}`); }}
                className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl font-medium text-[0.75rem] text-white transition-colors duration-200"
                style={{ background: broker.color }}
              >
                <span>פתיחת חשבון</span>
                <ExternalLink className="w-3 h-3" strokeWidth={2} />
              </a>

              <p className="text-center text-[0.5625rem] text-[#BDBDCB]/70 mt-2 leading-relaxed">
                אינו מהווה ייעוץ השקעות. MyNeto אינה בעלת רישיון ייעוץ.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
