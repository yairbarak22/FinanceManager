'use client';

import { useMemo } from 'react';
import { Shield, TrendingUp, Flame } from 'lucide-react';

interface RiskGaugeProps {
  beta: number;
  className?: string;
}

/**
 * RiskGauge Component
 * A linear scale displaying Portfolio Beta
 * Scale: 0.0 to 2.0
 * Zones: Safe (<0.8), Market (0.8-1.2), Aggressive (>1.2)
 */
export function RiskGauge({ beta, className = '' }: RiskGaugeProps) {
  const { position, riskLevel, riskColor, riskBg, riskIcon } = useMemo(() => {
    // Clamp beta between 0 and 2
    const clampedBeta = Math.max(0, Math.min(2, beta));
    const position = (clampedBeta / 2) * 100;

    let level: string;
    let color: string;
    let bg: string;
    let icon: React.ReactNode;

    if (beta < 0.8) {
      level = 'שמרני';
      color = 'text-emerald-600';
      bg = 'bg-emerald-500';
      icon = <Shield className="w-5 h-5" />;
    } else if (beta <= 1.2) {
      level = 'מאוזן';
      color = 'text-sky-600';
      bg = 'bg-sky-500';
      icon = <TrendingUp className="w-5 h-5" />;
    } else {
      level = 'אגרסיבי';
      color = 'text-rose-600';
      bg = 'bg-rose-500';
      icon = <Flame className="w-5 h-5" />;
    }

    return { position, riskLevel: level, riskColor: color, riskBg: bg, riskIcon: icon };
  }, [beta]);

  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${riskColor} bg-opacity-10`}
               style={{ backgroundColor: `currentColor`, opacity: 0.1 }}>
            <span className={riskColor}>{riskIcon}</span>
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-500">רמת סיכון</h3>
            <p className={`text-lg font-semibold ${riskColor}`}>{riskLevel}</p>
          </div>
        </div>
        <div className="text-left">
          <p className="text-xs text-slate-400">Beta</p>
          <p className="text-2xl font-light text-slate-900">{beta.toFixed(2)}</p>
        </div>
      </div>

      {/* Gauge - scale 0.0 to 2.0 left to right */}
      <div className="relative">
        {/* Background track with zones */}
        <div className="h-3 rounded-full overflow-hidden flex">
          {/* Aggressive zone: 1.2 - 2.0 (40%) */}
          <div className="w-[40%] bg-rose-200" />
           {/* Market zone: 0.8 - 1.2 (20%) */}
          <div className="w-[20%] bg-sky-200" />
          {/* Safe zone: 0 - 0.8 (40%) */}
          <div className="w-[40%] bg-emerald-200" />
         
          
        </div>

        {/* Marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-500"
          style={{ left: `${position}%` }}
        >
          <div className={`w-5 h-5 rounded-full ${riskBg} border-2 border-white shadow-lg`} />
        </div>

        {/* Scale labels */}
        <div className="flex justify-between mt-2 text-xs text-slate-400 relative">
          <span>2.0</span>
          <span className="absolute left-[60%] -translate-x-1/2">0.8</span>
          <span className="absolute left-[40%] -translate-x-1/2">1.2</span>
          <span>0.0</span>
        </div>
      </div>

      {/* Zone labels */}
      <div className="flex justify-between mt-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-slate-500">שמרני</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-sky-400" />
          <span className="text-slate-500">שוק</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-rose-400" />
          <span className="text-slate-500">אגרסיבי</span>
        </div>
      </div>

      {/* Info text */}
      <p className="mt-4 text-xs text-slate-400 text-center">
        {beta < 0.8 && 'התיק שלך פחות תנודתי מהשוק - מתאים לפרופיל שמרני'}
        {beta >= 0.8 && beta <= 1.2 && 'התיק שלך נע בהתאם לשוק - פרופיל מאוזן'}
        {beta > 1.2 && 'התיק שלך תנודתי יותר מהשוק - מתאים לטווח ארוך'}
      </p>
    </div>
  );
}
