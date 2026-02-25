'use client';

import { motion } from 'framer-motion';
import { Sparkles, Trophy, AlertTriangle, Telescope } from 'lucide-react';

interface AIInsightsCardProps {
  insights: {
    success: string;
    attention: string;
    forecast: string;
  } | null;
  loading?: boolean;
}

const insightItems = [
  {
    key: 'success' as const,
    icon: Trophy,
    label: 'הצלחה',
    color: '#0DBACC',
    bg: 'bg-[#E6F9FB]',
  },
  {
    key: 'attention' as const,
    icon: AlertTriangle,
    label: 'לתשומת לב',
    color: '#E9A800',
    bg: 'bg-[#FFF8E1]',
  },
  {
    key: 'forecast' as const,
    icon: Telescope,
    label: 'מבט קדימה',
    color: '#69ADFF',
    bg: 'bg-[#EBF3FF]',
  },
];

export default function AIInsightsCard({
  insights,
  loading,
}: AIInsightsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
      className="relative bg-white rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.08)] overflow-hidden border border-[#69ADFF]/[0.08]"
    >
      {/* Multi-point gradient mesh */}
      <div className="absolute -top-20 -end-20 w-44 h-44 bg-[#69ADFF] opacity-[0.05] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 start-10 w-36 h-36 bg-[#9F7FE0] opacity-[0.04] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 end-1/3 w-24 h-24 bg-[#0DBACC] opacity-[0.03] rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-lg bg-[#EBF3FF] flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-[#69ADFF]" strokeWidth={1.75} />
        </div>
        <h3 className="text-[1.125rem] font-semibold text-[#303150]">
          תובנות AI
        </h3>
      </div>

      <div className="space-y-5">
        {insightItems.map((item, idx) => {
          const Icon = item.icon;
          const text = insights?.[item.key];

          return (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.4,
                delay: 0.2 + idx * 0.15,
                ease: 'easeOut',
              }}
              className="flex items-start gap-3 p-3 rounded-xl bg-[#F5F5F7]/50"
            >
              <div
                className={`flex-shrink-0 w-9 h-9 rounded-xl ${item.bg} flex items-center justify-center`}
              >
                <Icon
                  className="w-4.5 h-4.5"
                  style={{ color: item.color }}
                  strokeWidth={1.75}
                />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[0.75rem] font-medium text-[#BDBDCB] mb-1">
                  {item.label}
                </p>
                {loading ? (
                  <div className="h-4 w-3/4 bg-[#E8E8ED] rounded-full animate-pulse" />
                ) : (
                  <p className="text-[0.9375rem] font-normal text-[#303150] leading-relaxed">
                    {text || '—'}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
