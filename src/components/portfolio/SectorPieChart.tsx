'use client';

import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import { SensitiveData } from '../common/SensitiveData';
import InfoTooltip from '@/components/ui/InfoTooltip';

interface SectorAllocation {
  sector: string;
  sectorHe?: string; // Hebrew sector name from enrichment
  value: number;
  percent: number;
}

interface SectorPieChartProps {
  /** Sector allocation data */
  sectorAllocation: SectorAllocation[];
  /** Additional CSS classes */
  className?: string;
  /** Callback when a sector is clicked */
  onSectorClick?: (sector: string) => void;
  /** Currently selected sector (for filtering) */
  selectedSector?: string | null;
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
  // ETF Categories
  'Large Blend': 'מניות גדולות',
  'Large Growth': 'צמיחה גדולות',
  'Large Value': 'ערך גדולות',
  'Mid-Cap Blend': 'מניות בינוניות',
  'Small Blend': 'מניות קטנות',
  'Small Cap': 'מניות קטנות',
  'Total Market': 'שוק כולל',
  'Commodities': 'סחורות',
  'Commodities Focused': 'סחורות',
  'International': 'בינלאומי',
  'Emerging Markets': 'שווקים מתפתחים',
  'Bonds': 'אג"ח',
  'Israel': 'ישראל',
  'US Equity': 'מניות - ארה"ב',
  'Growth': 'צמיחה',
  'Unknown': 'אחר',
  'Other': 'אחר',
};

// Modern color palette - Design System colors
const SECTOR_COLORS: Record<string, string> = {
  'Technology': '#69ADFF',      // Dodger Blue
  'Healthcare': '#F18AB5',      // Cotton Candy Pink
  'Financial Services': '#0DBACC', // Turquoise
  'Financials': '#0DBACC',
  'Finance': '#0DBACC',
  'Energy': '#ef4444',
  'Real Estate': '#f59e0b',
  'Industrials': '#6366f1',
  'Consumer Cyclical': '#8b5cf6',
  'Consumer Defensive': '#22c55e',
  'Basic Materials': '#14b8a6',
  'Communication Services': '#06b6d4',
  'Utilities': '#a855f7',
  'Large Blend': '#69ADFF',
  'Large Growth': '#6366f1',
  'Large Value': '#0ea5e9',
  'Mid-Cap Blend': '#8b5cf6',
  'Small Blend': '#a855f7',
  'Small Cap': '#a855f7',
  'Total Market': '#69ADFF',
  'Commodities': '#eab308',
  'Commodities Focused': '#eab308',
  'International': '#06b6d4',
  'Emerging Markets': '#14b8a6',
  'Bonds': '#8b5cf6',
  'Israel': '#69ADFF',
  'US Equity': '#6366f1',
  'Growth': '#0DBACC',
  'Unknown': '#7E7F90',
  'Other': '#7E7F90',
  // Hebrew sector names from enrichment (for consistent colors)
  'מניות - ארה"ב': '#6366f1',
  'מניות - בינלאומי': '#06b6d4',
  'מניות - אירופה': '#0ea5e9',
  'מניות - תל אביב 125': '#69ADFF',
  'מניות - תל אביב 35': '#69ADFF',
  'מניות - ישראל': '#69ADFF',
  'מניות גדולות': '#6366f1',
  'סחורות': '#eab308',
  'סחורות - זהב': '#eab308',
  'אג"ח': '#8b5cf6',
};

/**
 * Custom tooltip for pie chart
 */
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      name: string;
      displayName?: string;
      value: number;
      percent: number;
      color: string;
    };
  }>;
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const hebrewName = data.displayName || SECTOR_NAMES[data.name] || data.name;

  return (
    <div
      className="bg-[#303150]/95 backdrop-blur-sm text-white px-4 py-3 rounded-xl border border-[#7E7F90]/30"
      style={{
        fontFamily: 'var(--font-nunito), system-ui, sans-serif',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
      }}
      dir="rtl"
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: data.color }}
        />
        <SensitiveData as="span" className="font-semibold text-sm">
          {hebrewName}
        </SensitiveData>
      </div>
      <div className="text-xs space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-[#BDBDCB]">שווי:</span>
          <SensitiveData as="span" className="font-medium">
            {data.value.toLocaleString('he-IL', {
              style: 'currency',
              currency: 'ILS',
              maximumFractionDigits: 0,
            })}
          </SensitiveData>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-[#BDBDCB]">אחוז:</span>
          <SensitiveData as="span" className="font-medium">
            {data.percent.toFixed(1)}%
          </SensitiveData>
        </div>
      </div>
    </div>
  );
};

/**
 * SectorPieChart - Minimalist pie chart for sector diversification
 * Following Neto Design System - Apple Design Philosophy
 */
export function SectorPieChart({
  sectorAllocation,
  className = '',
  onSectorClick,
  selectedSector,
}: SectorPieChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  // Check if any sector is selected
  const hasSelection = selectedSector !== null && selectedSector !== undefined;

  // Empty state
  if (sectorAllocation.length === 0) {
    return (
      <div
        className={`bg-[#FFFFFF] rounded-3xl p-6 text-center ${className}`}
        style={{
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          fontFamily: 'var(--font-nunito), system-ui, sans-serif',
        }}
      >
        <div className="w-12 h-12 bg-[#F7F7F8] rounded-xl mx-auto mb-3 flex items-center justify-center">
          <PieChartIcon className="w-6 h-6 text-[#BDBDCB]" strokeWidth={1.75} />
        </div>
        <p className="text-[#7E7F90] font-medium text-sm">אין נתוני סקטורים</p>
        <p className="text-[#BDBDCB] text-xs mt-1">הוסף נכסים לתיק</p>
      </div>
    );
  }

  // Prepare data with colors
  // Use Hebrew sector name if available, otherwise translate
  const chartData = sectorAllocation.map((s) => {
    const displayName = s.sectorHe || SECTOR_NAMES[s.sector] || s.sector;
    // Check if this sector is selected (compare with displayName which is the Hebrew name)
    const isSelected = selectedSector === displayName;
    return {
      name: s.sector, // Keep original for color mapping
      displayName, // Hebrew name for display
      value: s.value,
      percent: s.percent,
      color: SECTOR_COLORS[displayName] || SECTOR_COLORS[s.sector] || SECTOR_COLORS['Unknown'],
      isSelected,
    };
  });

  return (
    <div
      className={`bg-[#FFFFFF] rounded-3xl p-6 ${className}`}
      style={{
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        fontFamily: 'var(--font-nunito), system-ui, sans-serif',
      }}
      dir="rtl"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #69ADFF 0%, #9F7FE0 100%)' }}
          >
            <PieChartIcon className="w-4 h-4 text-white" strokeWidth={1.75} />
          </div>
          <span className="text-sm font-semibold text-[#303150]">פיזור סקטוריאלי</span>
        </div>
        <InfoTooltip
          content="פיזור ההשקעות שלך לפי סקטורים כלכליים. פיזור טוב מפחית סיכון."
          side="top"
        />
      </div>

      {/* Pie Chart */}
      <div className="h-[14rem]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={75}
              paddingAngle={2}
              dataKey="value"
              onMouseEnter={(_, index) => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {chartData.map((entry, index) => {
              const isHovered = hoveredIndex === index;
              const isActive = entry.isSelected || isHovered;
              const isDimmed = hasSelection && !entry.isSelected && !isHovered;
              
              return (
                <Cell
                  key={entry.name}
                  fill={entry.color}
                  style={{
                    transform: isActive ? 'scale(1.08)' : 'scale(1)',
                    transformOrigin: 'center',
                    transition: 'all 200ms ease-out',
                    cursor: onSectorClick ? 'pointer' : 'default',
                    filter: isActive
                      ? `drop-shadow(0 0 10px ${entry.color}88)`
                      : 'none',
                    opacity: isDimmed ? 0.4 : 1,
                  }}
                  onClick={() => onSectorClick?.(entry.displayName)}
                />
              );
            })}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-4 space-y-1">
        {chartData.slice(0, 5).map((item, index) => {
          const isHovered = hoveredIndex === index;
          const isActive = item.isSelected || isHovered;
          const isDimmed = hasSelection && !item.isSelected && !isHovered;
          
          return (
            <div
              key={item.name}
              role={onSectorClick ? 'button' : undefined}
              tabIndex={onSectorClick ? 0 : undefined}
              className="flex items-center justify-between text-xs py-1.5 px-2 -mx-2 rounded-lg"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => onSectorClick?.(item.displayName)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSectorClick?.(item.displayName);
                }
              }}
              style={{
                opacity: isDimmed ? 0.4 : 1,
                backgroundColor: item.isSelected ? `${item.color}15` : isHovered ? '#F7F7F8' : 'transparent',
                boxShadow: item.isSelected ? `inset 0 0 0 1px ${item.color}40` : 'none',
                cursor: onSectorClick ? 'pointer' : 'default',
                transition: 'all 200ms ease-out',
              }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ 
                    backgroundColor: item.color,
                    transform: isActive ? 'scale(1.3)' : 'scale(1)',
                    boxShadow: isActive ? `0 0 6px ${item.color}66` : 'none',
                    transition: 'all 200ms ease-out',
                  }}
                />
                <SensitiveData 
                  as="span" 
                  className="font-medium"
                  style={{
                    color: isActive ? '#303150' : '#7E7F90',
                    fontWeight: isActive ? 700 : 500,
                    transition: 'all 200ms ease-out',
                  }}
                >
                  {item.displayName || SECTOR_NAMES[item.name] || item.name}
                </SensitiveData>
              </div>
              <SensitiveData 
                as="span" 
                style={{
                  color: isActive ? '#303150' : '#BDBDCB',
                  fontWeight: isActive ? 600 : 400,
                  transition: 'all 200ms ease-out',
                }}
              >
                {item.percent.toFixed(0)}%
              </SensitiveData>
            </div>
          );
        })}
        {chartData.length > 5 && (
          <p className="text-xs text-[#BDBDCB] text-center pt-1">
            +{chartData.length - 5} סקטורים נוספים
          </p>
        )}
      </div>
    </div>
  );
}

export default SectorPieChart;

