'use client';

import { useState } from 'react';
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

// Sector name translations (GICS sectors + ETF categories + Custom)
const SECTOR_NAMES: Record<string, string> = {
  // GICS Sectors
  'Technology': 'טכנולוגיה',
  'Healthcare': 'בריאות',
  'Financial Services': 'פיננסים',
  'Financials': 'פיננסים',
  'Finance': 'פיננסים',
  'Consumer Cyclical': 'צריכה מחזורית',
  'Consumer Defensive': 'צריכה בסיסית',
  'Industrials': 'תעשייה',
  'Energy': 'אנרגיה',
  'Utilities': 'תשתיות',
  'Real Estate': 'נדל"ן',
  'Basic Materials': 'חומרי גלם',
  'Communication Services': 'תקשורת',

  // ETF Categories - Style
  'Large Blend': 'מניות גדולות',
  'Large Growth': 'צמיחה גדולות',
  'Large Value': 'ערך גדולות',
  'Mid-Cap Blend': 'מניות בינוניות',
  'Small Blend': 'מניות קטנות',
  'Small Cap': 'מניות קטנות',
  'Total Market': 'שוק כולל',

  // ETF Categories - Asset Class
  'Commodities': 'סחורות',
  'Commodities Focused': 'סחורות',
  'Equity Precious Metals': 'מתכות יקרות',
  'International': 'בינלאומי',
  'Foreign Large Blend': 'מניות זרות',
  'World Large Stock': 'מניות עולמיות',
  'Diversified Emerging Mkts': 'שווקים מתפתחים',
  'Emerging Markets': 'שווקים מתפתחים',

  // Bonds
  'Bonds': 'אג"ח',
  'Intermediate Core Bond': 'אג"ח ממשלתי',
  'Corporate Bond': 'אג"ח קונצרני',
  'High Yield Bond': 'אג"ח High Yield',

  // Custom categories from estimateSector
  'Israel': 'ישראל',
  'US Equity': 'מניות ארה"ב',
  'Growth': 'צמיחה',

  // Fallback
  'Unknown': 'אחר',
  'Other': 'אחר',
};

// Modern color palette - Tailwind-inspired
const SECTOR_COLORS: Record<string, string> = {
  // Primary sectors
  'Technology': '#3b82f6',      // blue-500
  'Healthcare': '#ec4899',      // pink-500
  'Financial Services': '#10b981', // emerald-500
  'Financials': '#10b981',      // emerald-500
  'Finance': '#10b981',         // emerald-500
  'Energy': '#ef4444',          // red-500
  'Real Estate': '#f59e0b',     // amber-500
  'Industrials': '#6366f1',     // indigo-500
  'Consumer Cyclical': '#8b5cf6', // violet-500
  'Consumer Defensive': '#22c55e', // green-500
  'Basic Materials': '#14b8a6', // teal-500
  'Communication Services': '#06b6d4', // cyan-500
  'Utilities': '#a855f7',       // purple-500

  // ETF Style categories
  'Large Blend': '#3b82f6',     // blue-500
  'Large Growth': '#6366f1',    // indigo-500
  'Large Value': '#0ea5e9',     // sky-500
  'Mid-Cap Blend': '#8b5cf6',   // violet-500
  'Small Blend': '#a855f7',     // purple-500
  'Small Cap': '#a855f7',       // purple-500
  'Total Market': '#3b82f6',    // blue-500

  // Asset classes
  'Commodities': '#eab308',     // yellow-500
  'Commodities Focused': '#eab308', // yellow-500
  'Equity Precious Metals': '#fbbf24', // amber-400
  'International': '#06b6d4',   // cyan-500
  'Foreign Large Blend': '#0891b2', // cyan-600
  'World Large Stock': '#0e7490', // cyan-700
  'Diversified Emerging Mkts': '#14b8a6', // teal-500
  'Emerging Markets': '#14b8a6', // teal-500

  // Bonds
  'Bonds': '#8b5cf6',           // violet-500
  'Intermediate Core Bond': '#a78bfa', // violet-400
  'Corporate Bond': '#8b5cf6',  // violet-500
  'High Yield Bond': '#7c3aed', // violet-600

  // Custom
  'Israel': '#3b82f6',          // blue-500
  'US Equity': '#6366f1',       // indigo-500
  'Growth': '#10b981',          // emerald-500

  // Fallback
  'Unknown': '#64748b',         // slate-500
  'Other': '#64748b',           // slate-500
};

/**
 * Custom Treemap content renderer - Modern design with rounded corners
 */
interface TreemapContentProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  percent?: number;
  fill?: string;
  depth?: number;
  index?: number;
}

const CustomTreemapContent = (props: TreemapContentProps) => {
  const { x = 0, y = 0, width = 0, height = 0, name = '', percent = 0, fill = '#64748b' } = props;
  const [isHovered, setIsHovered] = useState(false);

  // Minimum dimensions for labels
  const showFullLabel = width > 70 && height > 50;
  const showSmallLabel = width > 45 && height > 30;
  const hebrewName = SECTOR_NAMES[name] || name;

  // Calculate font sizes based on cell size
  const nameFontSize = Math.min(14, Math.max(10, width / 8));
  const percentFontSize = Math.min(12, Math.max(9, width / 10));

  return (
    <g
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ cursor: 'pointer' }}
    >
      {/* Main rectangle with rounded corners */}
      <rect
        x={x + 1}
        y={y + 1}
        width={Math.max(0, width - 2)}
        height={Math.max(0, height - 2)}
        fill={fill}
        stroke="#ffffff"
        strokeWidth={2}
        rx={8}
        ry={8}
        style={{
          filter: isHovered ? 'brightness(1.1)' : 'none',
          transition: 'filter 0.2s ease, opacity 0.2s ease',
          opacity: isHovered ? 0.9 : 1,
        }}
      />

      {/* Hover highlight effect */}
      {isHovered && (
        <rect
          x={x + 1}
          y={y + 1}
          width={Math.max(0, width - 2)}
          height={Math.max(0, height - 2)}
          fill="rgba(255,255,255,0.1)"
          rx={8}
          ry={8}
          style={{ pointerEvents: 'none' }}
        />
      )}

      {/* Labels */}
      {showFullLabel && (
        <>
          {/* Sector name */}
          <text
            x={x + width / 2}
            y={y + height / 2 - 8}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#ffffff"
            fontSize={nameFontSize}
            fontWeight={600}
            style={{
              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
              pointerEvents: 'none',
            }}
          >
            {hebrewName}
          </text>
          {/* Percentage */}
          <text
            x={x + width / 2}
            y={y + height / 2 + 12}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="rgba(255,255,255,0.85)"
            fontSize={percentFontSize}
            fontWeight={500}
            style={{
              textShadow: '0 1px 2px rgba(0,0,0,0.2)',
              pointerEvents: 'none',
            }}
          >
            {percent.toFixed(1)}%
          </text>
        </>
      )}

      {/* Small label - just percentage */}
      {!showFullLabel && showSmallLabel && (
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#ffffff"
          fontSize={10}
          fontWeight={600}
          style={{
            textShadow: '0 1px 2px rgba(0,0,0,0.3)',
            pointerEvents: 'none',
          }}
        >
          {percent.toFixed(0)}%
        </text>
      )}
    </g>
  );
};

/**
 * Custom tooltip with modern styling
 */
interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      name: string;
      value: number;
      percent: number;
    };
  }>;
}

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const hebrewName = SECTOR_NAMES[data.name] || data.name;
  const color = SECTOR_COLORS[data.name] || SECTOR_COLORS['Unknown'];

  return (
    <div className="bg-slate-900/95 backdrop-blur-sm text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700/50">
      {/* Sector name with color indicator */}
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: color }}
        />
        <p className="font-semibold text-base">{hebrewName}</p>
      </div>

      {/* Stats */}
      <div className="space-y-1 text-sm">
        <div className="flex justify-between gap-6">
          <span className="text-slate-400">שווי:</span>
          <span className="font-medium text-white">
            {data.value.toLocaleString('he-IL', {
              style: 'currency',
              currency: 'ILS',
              maximumFractionDigits: 0,
            })}
          </span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-slate-400">אחוז מהתיק:</span>
          <span className="font-medium text-white">{data.percent.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Score indicator - circular progress
 */
function ScoreIndicator({ score }: { score: number }) {
  let color = 'text-rose-500';
  let bgColor = 'bg-rose-50';
  let strokeColor = '#f43f5e';
  let label = 'ריכוזיות גבוהה';

  if (score >= 70) {
    color = 'text-emerald-600';
    bgColor = 'bg-emerald-50';
    strokeColor = '#10b981';
    label = 'פיזור מעולה';
  } else if (score >= 50) {
    color = 'text-sky-600';
    bgColor = 'bg-sky-50';
    strokeColor = '#0ea5e9';
    label = 'פיזור טוב';
  } else if (score >= 30) {
    color = 'text-amber-500';
    bgColor = 'bg-amber-50';
    strokeColor = '#f59e0b';
    label = 'פיזור בינוני';
  }

  const circumference = 2 * Math.PI * 18;
  const progress = (score / 100) * circumference;

  return (
    <div className="flex items-center gap-3">
      <div className={`relative w-12 h-12 ${bgColor} rounded-full flex items-center justify-center`}>
        <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
          {/* Background circle */}
          <circle
            cx="20"
            cy="20"
            r="18"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="3"
          />
          {/* Progress circle */}
          <circle
            cx="20"
            cy="20"
            r="18"
            fill="none"
            stroke={strokeColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${progress} ${circumference}`}
            style={{ transition: 'stroke-dasharray 0.5s ease' }}
          />
        </svg>
        <span className={`absolute text-sm font-bold ${color}`}>
          {score}
        </span>
      </div>
      <div className="text-right">
        <p className="text-xs text-slate-400">ציון פיזור</p>
        <p className={`text-sm font-semibold ${color}`}>{label}</p>
      </div>
    </div>
  );
}

/**
 * DiversificationHeatmap Component
 * Modern Treemap visualization for sector allocation
 */
export function DiversificationHeatmap({
  sectorAllocation,
  diversificationScore,
  className = '',
}: DiversificationHeatmapProps) {
  if (sectorAllocation.length === 0) {
    return (
      <div className={`bg-white rounded-2xl border border-slate-200 p-8 text-center ${className}`}>
        <div className="w-12 h-12 bg-slate-100 rounded-xl mx-auto mb-3 flex items-center justify-center">
          <PieChart className="w-6 h-6 text-slate-400" />
        </div>
        <p className="text-slate-500 font-medium">אין נתוני סקטורים להצגה</p>
        <p className="text-slate-400 text-sm mt-1">הוסף נכסים לתיק כדי לראות את הפיזור</p>
      </div>
    );
  }

  // Prepare data for treemap with colors
  const treemapData = sectorAllocation.map(s => ({
    name: s.sector,
    value: s.value,
    percent: s.percent,
    fill: SECTOR_COLORS[s.sector] || SECTOR_COLORS['Unknown'],
  }));

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm ${className}`}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
            <PieChart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">פיזור סקטוריאלי</h3>
            <p className="text-xs text-slate-400">{sectorAllocation.length} סקטורים</p>
          </div>
        </div>
        <ScoreIndicator score={diversificationScore} />
      </div>

      {/* Treemap */}
      <div className="p-4">
        <ResponsiveContainer width="100%" height={300}>
          <Treemap
            data={treemapData}
            dataKey="value"
            aspectRatio={4 / 3}
            content={<CustomTreemapContent />}
          >
            <Tooltip
              content={<CustomTooltip />}
              cursor={false}
            />
          </Treemap>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="px-5 pb-4 pt-2">
        <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center">
          {sectorAllocation.slice(0, 8).map(s => (
            <div key={s.sector} className="flex items-center gap-2 group">
              <div
                className="w-3 h-3 rounded-full shadow-sm transition-transform group-hover:scale-110"
                style={{ backgroundColor: SECTOR_COLORS[s.sector] || SECTOR_COLORS['Unknown'] }}
              />
              <span className="text-xs text-slate-600 font-medium">
                {SECTOR_NAMES[s.sector] || s.sector}
              </span>
              <span className="text-xs text-slate-400">
                {s.percent.toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
