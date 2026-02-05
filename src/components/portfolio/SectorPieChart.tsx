'use client';

import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import { SensitiveData } from '../common/SensitiveData';

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
  // Cash
  'Cash': 'מזומן',
  'מזומן': 'מזומן',
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
  // Cash
  'Cash': '#0DBACC',
  'מזומן': '#0DBACC',
};

/**
 * Format currency for display
 */
function formatCurrency(value: number): string {
  return value.toLocaleString('he-IL', {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: 0,
  });
}

/**
 * SectorPieChart - Minimalist pie chart for sector diversification
 * Following Neto Design System - Apple Design Philosophy
 * Matching ExpensesPieChart design
 */
export function SectorPieChart({
  sectorAllocation,
  className = '',
  onSectorClick,
  selectedSector,
}: SectorPieChartProps) {
  // Hover state - using sector ID (displayName) instead of index
  const [hoveredSectorId, setHoveredSectorId] = useState<string | null>(null);
  
  // Check if any sector is selected (for dimming non-selected items)
  const hasSelection = selectedSector !== null && selectedSector !== undefined;

  // Prepare data with colors and calculate total
  const { chartData, totalValue } = useMemo(() => {
    const data = sectorAllocation.map((s) => {
      const displayName = s.sectorHe || SECTOR_NAMES[s.sector] || s.sector;
      return {
        id: displayName, // Use displayName as unique ID
        name: s.sector,
        displayName,
        value: s.value,
        percent: s.percent,
        color: SECTOR_COLORS[displayName] || SECTOR_COLORS[s.sector] || SECTOR_COLORS['Unknown'],
      };
    });
    
    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    return { chartData: data, totalValue: total };
  }, [sectorAllocation]);

  // Card wrapper styles
  const cardStyles = {
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08), 0 0 20px rgba(105, 173, 255, 0.1)',
    fontFamily: 'var(--font-nunito), system-ui, sans-serif',
  };

  // Empty state
  if (sectorAllocation.length === 0) {
    return (
      <div 
        className={`bg-[#FFFFFF] rounded-3xl p-6 ${className}`}
        style={cardStyles}
        dir="rtl"
      >
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'rgba(105, 173, 255, 0.1)' }}
          >
            <PieChartIcon className="w-8 h-8" style={{ color: '#69ADFF' }} strokeWidth={1.5} />
          </div>
          <p 
            className="text-sm mb-1"
            style={{ color: '#7E7F90' }}
          >
            אין נתוני סקטורים
          </p>
          <p 
            className="text-xs"
            style={{ color: '#BDBDCB' }}
          >
            הוסף נכסים לתיק כדי לראות את הפילוח
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`bg-[#FFFFFF] rounded-3xl p-6 flex flex-col ${className}`}
      style={cardStyles}
      dir="rtl"
    >
      {/* Hybrid Layout: Header/Summary on Left, Chart on Right */}
      <div className="flex items-start gap-4 mb-6">
        {/* Left Side: Title & Summary */}
        <div className="flex-1">
          <h3 
            className="text-sm font-medium mb-2"
            style={{ color: '#7E7F90' }}
          >
            פיזור סקטוריאלי
          </h3>
          <SensitiveData 
            as="p" 
            className="text-3xl font-bold mb-1"
            style={{ color: '#1D1D35' }}
          >
            {formatCurrency(totalValue)}
          </SensitiveData>
          <p 
            className="text-xs"
            style={{ color: '#7E7F90' }}
          >
            סה"כ שווי
          </p>
        </div>

        {/* Right Side: Donut Chart */}
        <div className="relative w-32 h-32 flex-shrink-0" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={55}
                paddingAngle={2}
                dataKey="value"
                strokeWidth={0}
              >
                {chartData.map((entry) => {
                  const isSelected = selectedSector === entry.id;
                  const isHovered = hoveredSectorId === entry.id;
                  const isDimmed = hasSelection && !isSelected;
                  
                  return (
                    <Cell
                      key={entry.id}
                      fill={entry.color}
                      style={{
                        filter: (isHovered || isSelected)
                          ? `drop-shadow(0 0 8px ${entry.color}66)` 
                          : 'none',
                        transform: isSelected 
                          ? 'scale(1.12)' 
                          : isHovered 
                            ? 'scale(1.07)' 
                            : 'scale(1)',
                        opacity: isDimmed ? 0.4 : 1,
                        transformOrigin: 'center',
                        transition: 'all 250ms ease-out',
                        cursor: onSectorClick ? 'pointer' : 'default',
                      }}
                      onClick={() => onSectorClick?.(entry.id)}
                      onMouseEnter={() => setHoveredSectorId(entry.id)}
                      onMouseLeave={() => setHoveredSectorId(null)}
                    />
                  );
                })}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Legend - Right-aligned text, left-aligned percentages, with scrolling */}
      <div 
        className="flex-1 flex flex-col mt-5 px-2 overflow-y-auto max-h-[250px]"
        onMouseLeave={() => setHoveredSectorId(null)}
      >
        {chartData.map((item) => {
          const isHovered = hoveredSectorId === item.id;
          const isSelected = selectedSector === item.id;
          const isActive = isHovered || isSelected;
          const isDimmed = hasSelection && !isSelected && !isHovered;
          
          return (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              className="flex items-center justify-between py-2 rounded-lg px-2 -mx-2"
              style={{
                opacity: isDimmed ? 0.4 : 1,
                backgroundColor: isSelected ? `${item.color}15` : 'transparent',
                boxShadow: isSelected ? `inset 0 0 0 1px ${item.color}40` : 'none',
                cursor: onSectorClick ? 'pointer' : 'default',
                transition: 'all 250ms ease-out',
              }}
              onClick={() => onSectorClick?.(item.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSectorClick?.(item.id);
                }
              }}
              onMouseEnter={() => setHoveredSectorId(item.id)}
              onMouseLeave={() => setHoveredSectorId(null)}
            >
              {/* Left Side: Colored Dot + Name */}
              <div className="flex items-center gap-2 pr-4">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ 
                    backgroundColor: item.color,
                    transform: isActive ? 'scale(1.3)' : 'scale(1)',
                    boxShadow: isActive ? `0 0 6px ${item.color}66` : 'none',
                    transition: 'all 250ms ease-out',
                  }}
                />
                <SensitiveData 
                  as="span"
                  className="text-right"
                  style={{ 
                    color: isActive ? '#303150' : '#7E7F90',
                    fontWeight: isActive ? 700 : 400,
                    fontSize: isActive ? '16px' : '14px',
                    transition: 'all 250ms ease-out',
                  }}
                >
                  {item.displayName}
                </SensitiveData>
              </div>
              
              {/* Right Side: Amount (slides in) + Percentage */}
              <div className="flex items-center gap-2 pl-4">
                {/* Amount - slides in from left, pushes percentage right */}
                <SensitiveData 
                  as="span"
                  style={{ 
                    color: '#303150',
                    fontWeight: 600,
                    fontSize: '14px',
                    opacity: isActive ? 1 : 0,
                    maxWidth: isActive ? '120px' : '0px',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    transform: isActive ? 'translateX(0)' : 'translateX(-12px)',
                    transition: 'all 250ms ease-out',
                  }}
                >
                  {formatCurrency(item.value)}
                </SensitiveData>
                
                {/* Percentage */}
                <SensitiveData 
                  as="span"
                  className="text-left"
                  style={{ 
                    color: isActive ? '#303150' : '#7E7F90',
                    fontWeight: isActive ? 700 : 400,
                    fontSize: isActive ? '16px' : '14px',
                    minWidth: '40px',
                    transition: 'all 250ms ease-out',
                  }}
                >
                  {item.percent.toFixed(0)}%
                </SensitiveData>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SectorPieChart;
