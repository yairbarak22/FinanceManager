'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ExternalLink, Check, X, Camera, CameraOff } from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { trackCtaClickServer } from '@/lib/utils';

const ALTSHULER_URL =
  'https://digitalsolutions.as-invest.co.il/trade_OnBoarding/?utm_source=MyNeto&utm_medium=Link';
const IBI_URL =
  'https://onboarding.ibi.co.il/open-account?step=first_name&source__c=OB&UTM_Campaign_Source__c=OB&keyword__c=smart-feature-ob&Coupon__c=IBIYAIRBA&referrer=myNETO';

interface BrokerComparisonTableProps {
  source: string;
}

const rows = [
  {
    label: 'דמי ניהול',
    altshuler: '0₪ לכל החיים',
    ibi: '0₪ ל-2 שנים',
    altshulerHighlight: true,
    ibiHighlight: false,
  },
  {
    label: 'מתנת הצטרפות',
    altshuler: '200₪',
    ibi: '300₪',
    altshulerHighlight: false,
    ibiHighlight: true,
  },
  {
    label: 'מינימום הפקדה',
    altshuler: '5,000₪',
    ibi: '15,000₪',
    altshulerHighlight: true,
    ibiHighlight: false,
  },
  {
    label: 'מסלול הלכתי',
    altshuler: 'check',
    ibi: 'check',
    altshulerHighlight: false,
    ibiHighlight: false,
  },
];

export default function BrokerComparisonTable({ source }: BrokerComparisonTableProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });
  const { trackOpenTradingAccountClicked } = useAnalytics();

  return (
    <div ref={ref} className="space-y-4" dir="rtl">
      {/* Header */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div />
        <div className="py-2 px-3 rounded-xl bg-[#0DBACC]/8">
          <p className="text-xs font-bold text-[#0DBACC]">אלטשולר שחם</p>
        </div>
        <div className="py-2 px-3 rounded-xl bg-[#2B4699]/8">
          <p className="text-xs font-bold text-[#2B4699]">IBI</p>
        </div>
      </div>

      {/* Rows */}
      {rows.map((row, i) => (
        <motion.div
          key={row.label}
          initial={{ opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
          className="grid grid-cols-3 gap-2 items-center"
        >
          <p className="text-xs text-[#7E7F90] font-medium">{row.label}</p>
          <div className={`text-center py-2 px-2 rounded-lg ${row.altshulerHighlight ? 'bg-[#0DBACC]/5 font-bold text-[#0DBACC]' : 'text-[#303150]'} text-xs`}>
            {row.altshuler === 'check' ? <Check className="w-4 h-4 text-emerald-500 mx-auto" /> : row.altshuler}
          </div>
          <div className={`text-center py-2 px-2 rounded-lg ${row.ibiHighlight ? 'bg-[#2B4699]/5 font-bold text-[#2B4699]' : 'text-[#303150]'} text-xs`}>
            {row.ibi === 'check' ? <Check className="w-4 h-4 text-emerald-500 mx-auto" /> : row.ibi}
          </div>
        </motion.div>
      ))}

      {/* Identification row - special */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4, delay: 0.1 + rows.length * 0.08 }}
        className="grid grid-cols-3 gap-2 items-center"
      >
        <p className="text-xs text-[#7E7F90] font-medium">הזדהות</p>
        <div className="text-center py-2 px-2 rounded-lg text-[#303150] text-xs">
          <div className="flex items-center justify-center gap-1">
            <Camera className="w-3.5 h-3.5 text-[#7E7F90]" />
            <span>סלפי + ת&quot;ז</span>
          </div>
        </div>
        <div className="text-center py-2 px-2 rounded-lg bg-[#2B4699]/5 text-xs">
          <div className="flex items-center justify-center gap-1">
            <CameraOff className="w-3.5 h-3.5 text-[#2B4699]" />
            <span className="font-bold text-[#2B4699]">ללא מצלמה!</span>
          </div>
        </div>
      </motion.div>

      {/* CTA Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4, delay: 0.1 + (rows.length + 1) * 0.08 }}
        className="grid grid-cols-2 gap-3 pt-2"
      >
        <a
          href={ALTSHULER_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => { trackOpenTradingAccountClicked(source, 'altshuler'); trackCtaClickServer(`${source}_altshuler`); }}
          className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-white text-xs font-bold transition-transform hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: '#0DBACC' }}
        >
          <span>פתיחה באלטשולר</span>
          <ExternalLink className="w-3 h-3" />
        </a>
        <a
          href={IBI_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => { trackOpenTradingAccountClicked(source, 'ibi'); trackCtaClickServer(`${source}_ibi`); }}
          className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-white text-xs font-bold transition-transform hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: '#2B4699' }}
        >
          <span>פתיחה ב-IBI</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </motion.div>
    </div>
  );
}
