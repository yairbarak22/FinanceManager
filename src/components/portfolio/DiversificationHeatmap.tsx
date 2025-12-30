'use client';

import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChart } from 'lucide-react';

interface SectorAllocation {
  sector: string;
  value: number;
  percent: number;
}

interface DiversificationHeatmapProps {
  sectorAllocation: SectorAllocation[];
  diversificationScore: number;
  className?: string;
}

// Sector name translations
const SECTOR_NAMES: Record<string, string> = {
  'Technology': 'טכנולוגיה',
  'Healthcare': 'בריאות',
  'Financial Services': 'פיננסים',
  'Consumer Cyclical': 'צריכה מחזורית',
  'Consumer Defensive': 'צריכה בסיסית',
  'Industrials': 'תעשייה',
  'Energy': 'אנרגיה',
  'Utilities': 'תשתיות',
  'Real Estate': 'נדל"ן',
  'Basic Materials': 'חומרי גלם',
  'Communication Services': 'תקשורת',
  'Unknown': 'אחר',
};

// Sector colors
const SECTOR_COLORS: Record<string, string> = {
  'Technology': '#6366f1',      // indigo-500
  'Healthcare': '#14b8a6',      // teal-500
  'Financial Services': '#0ea5e9', // sky-500
  'Consumer Cyclical': '#f59e0b', // amber-500
  'Consumer Defensive': '#22c55e', // green-500
  'Industrials': '#64748b',     // slate-500
  'Energy': '#f97316',          // orange-500
  'Utilities': '#8b5cf6',       // violet-500
  'Real Estate': '#ec4899',     // pink-500
  'Basic Materials': '#84cc16', // lime-500
  'Communication Services': '#06b6d4', // cyan-500
  'Unknown': '#94a3b8',         // slate-400
};

/**
 * Custom Treemap content renderer
 */
const CustomTreemapContent = (props: {
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  percent: number;
  fill: string;
}) => {
  const { x, y, width, height, name, percent, fill } = props;

  // Only show label if cell is big enough
  const showLabel = width > 60 && height > 40;
  const hebrewName = SECTOR_NAMES[name] || name;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        stroke="#fff"
        strokeWidth={2}
        rx={4}
        className="transition-opacity hover:opacity-80"
      />
      {showLabel && (
        <>
          <text
            x={x + width / 2}
            y={y + height / 2 - 6}
            textAnchor="middle"
            fill="#fff"
            fontSize={12}
            fontWeight={600}
          >
            {hebrewName}
          </text>
          <text
            x={x + width / 2}
            y={y + height / 2 + 10}
            textAnchor="middle"
            fill="rgba(255,255,255,0.8)"
            fontSize={11}
          >
            {percent.toFixed(1)}%
          </text>
        </>
      )}
    </g>
  );
};

/**
 * Custom tooltip
 */
const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; value: number; percent: number } }> }) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const hebrewName = SECTOR_NAMES[data.name] || data.name;

  return (
    <div className="bg-slate-800 text-white px-3 py-2 rounded-lg shadow-lg text-sm">
      <p className="font-medium">{hebrewName}</p>
      <p className="text-slate-300">
        {data.percent.toFixed(1)}% · {data.value.toLocaleString('he-IL', {
          style: 'currency',
          currency: 'ILS',
          maximumFractionDigits: 0,
        })}
      </p>
    </div>
  );
};

/**
 * Score indicator
 */
function ScoreIndicator({ score }: { score: number }) {
  let color = 'text-rose-500';
  let label = 'ריכוזיות גבוהה';

  if (score >= 70) {
    color = 'text-emerald-600';
    label = 'פיזור מעולה';
  } else if (score >= 50) {
    color = 'text-sky-600';
    label = 'פיזור טוב';
  } else if (score >= 30) {
    color = 'text-amber-500';
    label = 'פיזור בינוני';
  }

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-12 h-12">
        <svg className="w-12 h-12 -rotate-90">
          <circle
            cx="24"
            cy="24"
            r="20"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="4"
          />
          <circle
            cx="24"
            cy="24"
            r="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeDasharray={`${(score / 100) * 125.6} 125.6`}
            className={color}
          />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center text-sm font-semibold ${color}`}>
          {score}
        </span>
      </div>
      <div>
        <p className="text-sm text-slate-500">ציון פיזור</p>
        <p className={`text-sm font-medium ${color}`}>{label}</p>
      </div>
    </div>
  );
}

/**
 * DiversificationHeatmap Component
 * A Treemap showing sector allocation
 */
export function DiversificationHeatmap({
  sectorAllocation,
  diversificationScore,
  className = '',
}: DiversificationHeatmapProps) {
  if (sectorAllocation.length === 0) {
    return (
      <div className={`bg-white rounded-xl border border-slate-200 p-8 text-center ${className}`}>
        <p className="text-slate-400">אין נתוני סקטורים להצגה</p>
      </div>
    );
  }

  // Prepare data for treemap
  const treemapData = sectorAllocation.map(s => ({
    name: s.sector,
    value: s.value,
    percent: s.percent,
    fill: SECTOR_COLORS[s.sector] || SECTOR_COLORS['Unknown'],
  }));

  return (
    <div className={`bg-white rounded-xl border border-slate-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center">
            <PieChart className="w-5 h-5 text-indigo-600" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">פיזור סקטוריאלי</h3>
        </div>
        <ScoreIndicator score={diversificationScore} />
      </div>

      {/* Treemap */}
      <div className="p-4">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={treemapData}
              dataKey="value"
              aspectRatio={4 / 3}
              stroke="#fff"
              content={<CustomTreemapContent x={0} y={0} width={0} height={0} name="" percent={0} fill="" />}
            >
              <Tooltip content={<CustomTooltip />} />
            </Treemap>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Legend */}
      <div className="px-5 pb-4">
        <div className="flex flex-wrap gap-3">
          {sectorAllocation.slice(0, 6).map(s => (
            <div key={s.sector} className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: SECTOR_COLORS[s.sector] || SECTOR_COLORS['Unknown'] }}
              />
              <span className="text-xs text-slate-500">
                {SECTOR_NAMES[s.sector] || s.sector}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
