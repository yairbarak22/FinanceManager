'use client';

import { TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';

interface ProjectionDataPoint {
  month: number;
  value: number;
  valueWithInterest?: number;
}

interface GoalSimulatorResultsProps {
  monthlyContribution: number;
  effectiveMonths: number;
  investInPortfolio: boolean;
  expectedInterestRate: number;
  monthlySavings: number;
  projectionData: ProjectionDataPoint[];
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl p-3"
      style={{
        backgroundColor: 'white',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        border: '1px solid #F7F7F8',
      }}
    >
      <p className="text-xs mb-1" style={{ color: '#7E7F90' }}>
        חודש {label}
      </p>
      {payload.map((entry, i) => (
        <p
          key={i}
          className="text-sm font-bold tabular-nums"
          style={{
            color: entry.dataKey === 'valueWithInterest' ? '#0DBACC' : '#69ADFF',
            fontFamily: 'var(--font-nunito), system-ui, sans-serif',
          }}
        >
          {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
}

export default function GoalSimulatorResults({
  monthlyContribution,
  effectiveMonths,
  investInPortfolio,
  expectedInterestRate,
  monthlySavings,
  projectionData,
}: GoalSimulatorResultsProps) {
  const yearsDisplay = Math.round(effectiveMonths / 12 * 10) / 10;

  return (
    <div className="space-y-5">
      {/* Hero Monthly Contribution */}
      <div
        className="rounded-2xl p-6 text-center text-white"
        style={{
          background: 'linear-gradient(135deg, #0DBACC 0%, #69ADFF 100%)',
          boxShadow: '0 8px 32px rgba(13, 186, 204, 0.25)',
        }}
      >
        <p className="text-sm font-medium mb-2" style={{ opacity: 0.85 }}>
          הפרשה חודשית נדרשת
        </p>
        <motion.div
          key={monthlyContribution}
          initial={{ scale: 0.95, opacity: 0.7 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="text-3xl lg:text-4xl font-bold tabular-nums mb-2"
          style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
        >
          {formatCurrency(monthlyContribution)}
        </motion.div>
        <p className="text-sm" style={{ opacity: 0.7 }}>
          למשך {effectiveMonths} חודשים ({yearsDisplay} שנים)
        </p>

        {/* Savings badge */}
        {investInPortfolio && monthlySavings > 0 && (
          <div
            className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
            style={{ backgroundColor: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(4px)' }}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>
              חיסכון של {formatCurrency(monthlySavings)}/חודש עם ריבית {expectedInterestRate}%
            </span>
          </div>
        )}
      </div>

      {/* Projection Chart */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p
            className="text-sm font-medium"
            style={{ color: '#7E7F90' }}
          >
            תחזית חיסכון
          </p>
          {investInPortfolio && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#69ADFF' }} />
                <span className="text-xs" style={{ color: '#7E7F90' }}>ללא ריבית</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#0DBACC' }} />
                <span className="text-xs" style={{ color: '#7E7F90' }}>עם ריבית</span>
              </div>
            </div>
          )}
        </div>
        <div
          className="rounded-xl p-3"
          style={{ backgroundColor: '#FAFBFC' }}
        >
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={projectionData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <defs>
                <linearGradient id="goalGradientResults" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#69ADFF" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#69ADFF" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="interestGradientResults" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0DBACC" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#0DBACC" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="month"
                tick={{ fill: '#BDBDCB', fontSize: 11, fontFamily: 'Nunito' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#69ADFF"
                strokeWidth={2.5}
                fill="url(#goalGradientResults)"
                animationDuration={800}
              />
              {investInPortfolio && (
                <Area
                  type="monotone"
                  dataKey="valueWithInterest"
                  stroke="#0DBACC"
                  strokeWidth={2.5}
                  fill="url(#interestGradientResults)"
                  animationDuration={800}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
