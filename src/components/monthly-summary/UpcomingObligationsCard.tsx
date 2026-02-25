'use client';

import { motion } from 'framer-motion';
import {
  Calendar,
  Landmark,
  CreditCard,
  HandCoins,
  BadgeCheck,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { SensitiveData } from '@/components/common/SensitiveData';
import type { UpcomingObligation } from '@/lib/monthlyReport/calculations';

interface UpcomingObligationsCardProps {
  obligations: UpcomingObligation[];
}

const TYPE_LABELS: Record<string, string> = {
  mortgage: 'משכנתא',
  gemach: 'גמ״ח',
  loan: 'הלוואה',
};

const TYPE_ICONS: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  mortgage: Landmark,
  gemach: HandCoins,
  loan: CreditCard,
};

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  mortgage: { bg: 'bg-[#EBF3FF]', text: 'text-[#69ADFF]' },
  gemach: { bg: 'bg-[#FFF8E1]', text: 'text-[#E9A800]' },
  loan: { bg: 'bg-[#FDE8F0]', text: 'text-[#F18AB5]' },
};

export default function UpcomingObligationsCard({
  obligations,
}: UpcomingObligationsCardProps) {
  const totalMonthly = obligations.reduce(
    (sum, o) => sum + o.monthlyPayment,
    0
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35, ease: 'easeOut' }}
      className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
    >
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-[#EBF3FF] flex items-center justify-center">
          <Calendar
            className="w-4 h-4 text-[#69ADFF]"
            strokeWidth={1.75}
          />
        </div>
        <h3 className="text-[1.125rem] font-semibold text-[#303150]">
          מבט קדימה – התחייבויות
        </h3>
      </div>

      {obligations.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-[0.9375rem] text-[#7E7F90]">
            אין התחייבויות פעילות
          </p>
          <p className="text-[0.8125rem] text-[#BDBDCB] mt-1">
            מצב מצוין! 🎉
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {obligations.map((ob, idx) => {
              const TypeIcon = TYPE_ICONS[ob.type] || CreditCard;
              const colors = TYPE_COLORS[ob.type] || TYPE_COLORS.loan;
              const label = TYPE_LABELS[ob.type] || ob.type;

              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: 0.3 + idx * 0.08,
                  }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-[#F5F5F7]/50"
                >
                  <div
                    className={`w-9 h-9 rounded-xl ${colors.bg} flex items-center justify-center flex-shrink-0`}
                  >
                    <TypeIcon
                      className={`w-4.5 h-4.5 ${colors.text}`}
                      strokeWidth={1.75}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[0.9375rem] font-medium text-[#303150] truncate">
                        {ob.name}
                      </p>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[0.6875rem] font-medium ${colors.bg} ${colors.text}`}
                      >
                        {label}
                      </span>
                      {ob.isEndingSoon && (
                        <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[0.6875rem] font-medium bg-[#E6F9FB] text-[#0DBACC]">
                          <BadgeCheck className="w-3 h-3" strokeWidth={2} />
                          מסתיים בקרוב
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <SensitiveData>
                        <span className="text-[0.75rem] text-[#7E7F90]">
                          תשלום:{' '}
                          <span className="font-semibold text-[#303150]">
                            {formatCurrency(ob.monthlyPayment)}
                          </span>
                        </span>
                      </SensitiveData>
                      <SensitiveData>
                        <span className="text-[0.75rem] text-[#7E7F90]">
                          יתרה:{' '}
                          <span className="font-semibold text-[#303150]">
                            {formatCurrency(ob.remainingBalance)}
                          </span>
                        </span>
                      </SensitiveData>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Total footer */}
          <div className="mt-4 pt-4 border-t border-[#F5F5F7] flex items-center justify-between">
            <span className="text-[0.8125rem] font-medium text-[#7E7F90]">
              סה&quot;כ תשלומים חודשיים
            </span>
            <SensitiveData>
              <span className="text-[1rem] font-bold text-[#303150]">
                {formatCurrency(totalMonthly)}
              </span>
            </SensitiveData>
          </div>
        </>
      )}
    </motion.div>
  );
}
