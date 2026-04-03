'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Check, ChevronDown, TrendingUp, CameraOff, Camera } from 'lucide-react';
import Card from '@/components/ui/Card';
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
  benefits: { text: string; highlight: string; suffix: string }[];
  mainBenefit: string;
  mainBenefitSub: string;
  identBadge: { icon: typeof Camera; text: string };
}> = {
  altshuler: {
    name: 'אלטשולר שחם',
    url: ALTSHULER_URL,
    color: '#0DBACC',
    benefits: [
      { text: 'פתיחת חשבון מ-', highlight: '5,000 ₪', suffix: 'בלבד' },
      { text: '', highlight: '200 ₪', suffix: 'מתנת הצטרפות' },
      { text: 'קורס היכרות עם שוק ההון', highlight: 'בחינם', suffix: '' },
      { text: 'שיעורי הדרכה בלייב', highlight: 'בחינם', suffix: '' },
    ],
    mainBenefit: 'פטור מלא מדמי ניהול!',
    mainBenefitSub: 'ללא הגבלת זמן',
    identBadge: { icon: Camera, text: 'זיהוי: סלפי + ת"ז' },
  },
  ibi: {
    name: 'IBI',
    url: IBI_URL,
    color: '#2B4699',
    benefits: [
      { text: 'פתיחת חשבון מ-', highlight: '15,000 ₪', suffix: '' },
      { text: '', highlight: '300 ₪', suffix: 'מתנת הצטרפות' },
      { text: 'פטור מדמי ניהול', highlight: 'ל-2 שנים', suffix: '' },
      { text: 'פתיחה', highlight: 'ללא מצלמה', suffix: '— מתאים לכולם!' },
    ],
    mainBenefit: 'פתיחה ללא מצלמה!',
    mainBenefitSub: 'מתאים לחברה החרדית',
    identBadge: { icon: CameraOff, text: 'ללא מצלמה!' },
  },
};

export default function BrokerCTA() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeBroker, setActiveBroker] = useState<BrokerId>('altshuler');
  const { trackOpenTradingAccountClicked } = useAnalytics();
  const broker = brokers[activeBroker];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: 0.15 }}
    >
      <Card padding="none">
        {/* Collapsed header */}
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-4 p-6 cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0DBACC]/8 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-[#0DBACC]" strokeWidth={1.75} />
            </div>
            <div className="text-right">
              <p className="text-[0.9375rem] font-bold text-[#303150] leading-tight">
                פתיחת חשבון מסחר
              </p>
              <p className="text-[0.75rem] text-[#7E7F90] font-medium mt-0.5">
                אלטשולר שחם או IBI · במבצע מיוחד בשיתוף MyNeto
              </p>
            </div>
          </div>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <ChevronDown className="w-5 h-5 text-[#BDBDCB]" strokeWidth={1.75} />
          </motion.div>
        </button>

        {/* Expandable content */}
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="px-6 pb-6">
                <div className="h-px bg-[#F7F7F8] mb-6" />

                {/* Broker tabs */}
                <div className="flex rounded-xl bg-[#F7F7F8] p-1 mb-6">
                  {(Object.keys(brokers) as BrokerId[]).map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setActiveBroker(id)}
                      className={`flex-1 py-2 px-3 rounded-lg text-[0.8125rem] font-bold transition-all duration-200 cursor-pointer ${
                        activeBroker === id
                          ? 'bg-white text-[#303150] shadow-sm'
                          : 'text-[#BDBDCB] hover:text-[#7E7F90]'
                      }`}
                    >
                      {brokers[id].name}
                    </button>
                  ))}
                </div>

                {/* Main benefit */}
                <div
                  className="py-4 px-5 rounded-2xl text-center mb-6 transition-colors duration-200"
                  style={{
                    background: `${broker.color}08`,
                    border: `1px solid ${broker.color}1F`,
                  }}
                >
                  <p className="text-[1.125rem] sm:text-[1.25rem] font-bold text-[#303150] leading-snug">
                    {broker.mainBenefit}
                  </p>
                  <p className="text-[0.8125rem] font-medium mt-1" style={{ color: broker.color }}>
                    {broker.mainBenefitSub}
                  </p>
                </div>

                {/* Standing order */}
                <div className="flex items-start gap-3 mb-6 py-3 px-4 rounded-xl bg-[#F7F7F8]">
                  <div className="w-1 min-h-[2.5rem] rounded-full flex-shrink-0 mt-0.5" style={{ background: `${broker.color}40` }} />
                  <p className="text-[0.8125rem] text-[#7E7F90] leading-relaxed">
                    מגדירים{' '}
                    <span className="font-bold text-[#303150]">הוראת קבע פעם אחת</span> —
                    ומהרגע הזה הכסף עובד בשבילך.
                    <br />
                    בלי להיכנס לחשבון, בלי לגעת במשהו, בלי להתעסק.
                  </p>
                </div>

                {/* Benefits list */}
                <div className="space-y-3 mb-6">
                  {broker.benefits.map((b, i) => (
                    <motion.div
                      key={`${activeBroker}-${i}`}
                      initial={{ opacity: 0, x: 6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25, delay: i * 0.06 }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${broker.color}14` }}>
                        <Check className="w-3 h-3" style={{ color: broker.color }} strokeWidth={2.5} />
                      </div>
                      <p className="text-[0.8125rem] sm:text-[0.875rem] text-[#7E7F90] leading-relaxed">
                        {b.text && <span>{b.text}</span>}
                        <span className="font-bold text-[#303150] mx-0.5">{b.highlight}</span>
                        {b.suffix && <span>{b.suffix}</span>}
                      </p>
                    </motion.div>
                  ))}
                </div>

                {/* CTA Button */}
                <motion.a
                  href={broker.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => { trackOpenTradingAccountClicked('course_cta', activeBroker); trackCtaClickServer(`course_cta_${activeBroker}`); }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-medium text-[0.875rem] text-white cursor-pointer transition-colors duration-200"
                  style={{ background: broker.color }}
                >
                  <span>לפתיחת חשבון ב{broker.name}</span>
                  <ExternalLink className="w-3.5 h-3.5" strokeWidth={2} />
                </motion.a>

                <p className="text-center text-[0.75rem] text-[#BDBDCB] mt-3">
                  ההטבות בתוקף לפותחי חשבון דרך MyNeto בלבד
                </p>
                <p className="text-center text-[0.625rem] text-[#BDBDCB]/70 mt-2 leading-relaxed">
                  האמור אינו מהווה ייעוץ השקעות או שיווק השקעות ואינו תחליף לייעוץ אישי. מערכת MyNeto אינה בעלת רישיון ייעוץ השקעות.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
