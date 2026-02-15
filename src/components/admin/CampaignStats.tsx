'use client';

import { Mail, Eye, MousePointerClick, AlertCircle, ShieldAlert } from 'lucide-react';

interface CampaignStatsProps {
  sentCount: number;
  openCount: number;
  clickCount: number;
  bounceCount: number;
  complaintCount: number;
}

export default function CampaignStats({
  sentCount,
  openCount,
  clickCount,
  bounceCount,
  complaintCount,
}: CampaignStatsProps) {
  const openRate = sentCount > 0 ? (openCount / sentCount) * 100 : 0;
  const clickRate = sentCount > 0 ? (clickCount / sentCount) * 100 : 0;
  const bounceRate = sentCount > 0 ? (bounceCount / sentCount) * 100 : 0;

  const stats = [
    {
      label: 'נשלחו',
      value: sentCount.toLocaleString(),
      icon: Mail,
      color: '#69ADFF',
      bgColor: '#69ADFF',
    },
    {
      label: 'נפתחו',
      value: sentCount > 0 ? `${openRate.toFixed(1)}%` : '—',
      subValue: `${openCount.toLocaleString()} מיילים`,
      icon: Eye,
      color: '#0DBACC',
      bgColor: '#0DBACC',
    },
    {
      label: 'הקליקו',
      value: sentCount > 0 ? `${clickRate.toFixed(1)}%` : '—',
      subValue: `${clickCount.toLocaleString()} מיילים`,
      icon: MousePointerClick,
      color: '#74ACEF',
      bgColor: '#74ACEF',
    },
    {
      label: 'נדחו',
      value: sentCount > 0 ? `${bounceRate.toFixed(1)}%` : '—',
      subValue: `${bounceCount.toLocaleString()} מיילים`,
      icon: AlertCircle,
      color: '#F18AB5',
      bgColor: '#F18AB5',
    },
  ];

  // Add complaints only if there are any
  if (complaintCount > 0) {
    stats.push({
      label: 'תלונות',
      value: complaintCount.toLocaleString(),
      subValue: '',
      icon: ShieldAlert,
      color: '#E74C3C',
      bgColor: '#E74C3C',
    });
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="relative overflow-hidden rounded-xl sm:rounded-2xl p-3 sm:p-4 bg-white border border-[#E8E8ED]/60"
          >
            {/* Background decoration */}
            <div
              className="absolute top-0 left-0 w-full h-1 rounded-t-xl sm:rounded-t-2xl"
              style={{ backgroundColor: stat.color }}
            />

            <div className="flex items-start justify-between mb-2 sm:mb-3 mt-1">
              <div
                className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${stat.bgColor}15` }}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" style={{ color: stat.color }} />
              </div>
            </div>

            <p className="text-lg sm:text-2xl font-bold text-[#303150] leading-tight mb-0.5">
              {stat.value}
            </p>
            <p className="text-[11px] sm:text-xs font-medium text-[#7E7F90]">{stat.label}</p>
            {stat.subValue && (
              <p className="text-[10px] text-[#BDBDCB] mt-0.5 hidden sm:block">{stat.subValue}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
