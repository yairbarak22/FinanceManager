'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, TrendingUp, Landmark, CreditCard, HandCoins } from 'lucide-react';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { SensitiveData } from '@/components/common/SensitiveData';
import type { UpcomingObligation } from '@/lib/monthlyReport/calculations';

interface AssetItem {
  id: string;
  name: string;
  value: number;
  category: string;
}

interface LiabilityItem {
  name: string;
  remainingBalance: number;
  type: string;
}

interface NetWorthCardProps {
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  netWorthHistory: { monthKey: string; netWorth: number }[];
  isFirstMonth: boolean;
  assets?: AssetItem[];
  liabilities?: (LiabilityItem | UpcomingObligation)[];
}

const MONTH_NAMES_SHORT: Record<string, string> = {
  '01': 'ינו׳',
  '02': 'פבר׳',
  '03': 'מרץ',
  '04': 'אפר׳',
  '05': 'מאי',
  '06': 'יונ׳',
  '07': 'יול׳',
  '08': 'אוג׳',
  '09': 'ספט׳',
  '10': 'אוק׳',
  '11': 'נוב׳',
  '12': 'דצמ׳',
};

const TYPE_ICONS: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  mortgage: Landmark,
  gemach: HandCoins,
  loan: CreditCard,
};

export default function NetWorthCard({
  netWorth,
  totalAssets,
  totalLiabilities,
  netWorthHistory,
  isFirstMonth,
  assets = [],
  liabilities = [],
}: NetWorthCardProps) {
  const [activeTab, setActiveTab] = useState<'assets' | 'liabilities'>(
    'assets'
  );

  const sparklineData = netWorthHistory.map((item) => ({
    name: MONTH_NAMES_SHORT[item.monthKey.split('-')[1]] || item.monthKey,
    value: item.netWorth,
  }));

  const hasSparklineData = sparklineData.length > 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4, ease: 'easeOut' }}
      className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-[#EBF3FF] flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-[#69ADFF]" strokeWidth={1.75} />
        </div>
        <h3 className="text-[1.125rem] font-semibold text-[#303150]">
          תמונת מצב – שווי נקי
        </h3>
      </div>

      {/* Net Worth Hero */}
      <SensitiveData>
        <p
          className={`text-[2rem] font-bold leading-tight ${
            netWorth >= 0 ? 'text-[#0DBACC]' : 'text-[#F18AB5]'
          }`}
        >
          {formatCurrency(netWorth)}
        </p>
      </SensitiveData>

      {/* Sparkline with gradient fill */}
      <div className="mt-4 mb-5">
        {hasSparklineData ? (
          <div className="h-[80px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData}>
                <defs>
                  <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#69ADFF" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#69ADFF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#BDBDCB' }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#69ADFF"
                  strokeWidth={2}
                  fill="url(#netWorthGradient)"
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: '#69ADFF',
                    stroke: '#fff',
                    strokeWidth: 2,
                  }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    return (
                      <div className="bg-white rounded-xl px-3 py-2 shadow-lg border border-[#F7F7F8] text-[0.8125rem]">
                        <p className="text-[#303150] font-semibold">
                          {formatCurrency(payload[0].value as number)}
                        </p>
                        <p className="text-[#BDBDCB]">
                          {payload[0].payload.name}
                        </p>
                      </div>
                    );
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[60px] flex items-center justify-center">
            <p className="text-[0.8125rem] text-[#BDBDCB]">
              {isFirstMonth
                ? 'הנתונים יתמלאו עם הזמן'
                : 'אין מספיק נתונים לגרף'}
            </p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-[#F5F5F7] rounded-xl mb-4">
        <button
          onClick={() => setActiveTab('assets')}
          className={`flex-1 py-2 px-4 rounded-lg text-[0.8125rem] font-medium transition-all cursor-pointer ${
            activeTab === 'assets'
              ? 'bg-white text-[#303150] shadow-sm'
              : 'text-[#7E7F90] hover:text-[#303150]'
          }`}
        >
          נכסים
        </button>
        <button
          onClick={() => setActiveTab('liabilities')}
          className={`flex-1 py-2 px-4 rounded-lg text-[0.8125rem] font-medium transition-all cursor-pointer ${
            activeTab === 'liabilities'
              ? 'bg-white text-[#303150] shadow-sm'
              : 'text-[#7E7F90] hover:text-[#303150]'
          }`}
        >
          התחייבויות
        </button>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[#F5F5F7]">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            activeTab === 'assets' ? 'bg-[#E6F9FB]' : 'bg-[#FDE8F0]'
          }`}
        >
          <Wallet
            className="w-4 h-4"
            style={{
              color: activeTab === 'assets' ? '#0DBACC' : '#F18AB5',
            }}
            strokeWidth={1.75}
          />
        </div>
        <div>
          <p className="text-[0.75rem] text-[#BDBDCB]">
            {activeTab === 'assets' ? 'סך כל הנכסים' : 'סך כל ההתחייבויות'}
          </p>
          <SensitiveData>
            <p className="text-[1.125rem] font-semibold text-[#303150]">
              {formatCurrency(
                activeTab === 'assets' ? totalAssets : totalLiabilities
              )}
            </p>
          </SensitiveData>
        </div>
      </div>

      {/* Items list */}
      <div className="space-y-2 max-h-[200px] overflow-y-auto">
        {activeTab === 'assets' ? (
          assets.length > 0 ? (
            assets.map((asset) => (
              <div
                key={asset.id}
                className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-[#F5F5F7]/50 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-[#0DBACC]" />
                  <span className="text-[0.875rem] text-[#303150]">
                    {asset.name}
                  </span>
                </div>
                <SensitiveData>
                  <span className="text-[0.875rem] font-semibold text-[#303150]">
                    {formatCurrency(asset.value)}
                  </span>
                </SensitiveData>
              </div>
            ))
          ) : (
            <p className="text-[0.8125rem] text-[#BDBDCB] text-center py-3">
              לא נמצאו נכסים
            </p>
          )
        ) : liabilities.length > 0 ? (
          liabilities.map((l, idx) => {
            const TypeIcon =
              TYPE_ICONS[l.type] || CreditCard;
            const balance = 'remainingBalance' in l ? l.remainingBalance : 0;

            return (
              <div
                key={idx}
                className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-[#F5F5F7]/50 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-[#FDE8F0] flex items-center justify-center">
                    <TypeIcon
                      className="w-3.5 h-3.5 text-[#F18AB5]"
                      strokeWidth={1.75}
                    />
                  </div>
                  <span className="text-[0.875rem] text-[#303150]">
                    {l.name}
                  </span>
                </div>
                <SensitiveData>
                  <span className="text-[0.875rem] font-semibold text-[#F18AB5]">
                    {formatCurrency(balance)}
                  </span>
                </SensitiveData>
              </div>
            );
          })
        ) : (
          <p className="text-[0.8125rem] text-[#BDBDCB] text-center py-3">
            לא נמצאו התחייבויות
          </p>
        )}
      </div>
    </motion.div>
  );
}
