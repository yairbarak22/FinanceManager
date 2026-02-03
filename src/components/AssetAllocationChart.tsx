'use client';

import { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { PieChartIcon } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Asset } from '@/lib/types';
import { assetCategories, getCategoryInfo } from '@/lib/categories';
import { SensitiveData } from './common/SensitiveData';

interface AssetAllocationChartProps {
  assets: Asset[];
}

// Fincheck style color palette - pastel gradients
const CATEGORY_COLORS: Record<string, string> = {
  real_estate: '#0DBACC',    // Turquoise
  stocks: '#69ADFF',          // Dodger Blue
  crypto: '#9F7FE0',          // Lavender
  pension_fund: '#F18AB5',    // Cotton Candy
  education_fund: '#74ACEF',  // Baby Blue
  savings_account: '#B4F1F1', // Light Turquoise
  investments: '#69ADFF',     // Dodger Blue
  vehicle: '#F18AB5',         // Cotton Candy
  cash: '#0DBACC',            // Turquoise
  other: '#BDBDCB',           // Light Grey
};

export default function AssetAllocationChart({ assets }: AssetAllocationChartProps) {
  // Hover state for synchronized chart/legend interaction
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  // Calculate totals by category
  const { chartData, totalAssets } = useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    let total = 0;

    assets.forEach((asset) => {
      const category = asset.category || 'other';
      categoryTotals[category] = (categoryTotals[category] || 0) + asset.value;
      total += asset.value;
    });

    const data = Object.entries(categoryTotals)
      .map(([categoryId, value]) => {
        const categoryInfo = getCategoryInfo(categoryId, 'asset') ||
          assetCategories.find(c => c.id === 'other');
        return {
          id: categoryId,
          name: categoryInfo?.nameHe || categoryId,
          value,
          percentage: total > 0 ? ((value / total) * 100).toFixed(0) : '0',
          color: CATEGORY_COLORS[categoryId] || '#BDBDCB',
        };
      })
      .sort((a, b) => b.value - a.value); // Sort by value descending

    return { chartData: data, totalAssets: total };
  }, [assets]);

  const isEmpty = chartData.length === 0;

  return (
    <div 
      className="bg-white rounded-[20px] p-6 h-full flex flex-col"
      style={{ boxShadow: '0 4px 24px rgba(13, 186, 204, 0.1)' }}
    >
      {isEmpty ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
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
            אין נכסים להצגה
          </p>
          <p 
            className="text-xs"
            style={{ color: '#BDBDCB' }}
          >
            הוסף נכסים כדי לראות את הפילוח
          </p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          {/* Hybrid Layout: Header/Summary on Left, Chart on Right */}
          <div className="flex items-start gap-4 mb-6">
            {/* Left Side: Title & Summary */}
            <div className="flex-1">
              <h3 
                className="text-sm font-medium mb-2"
                style={{ 
                  fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                  color: '#7E7F90'
                }}
              >
                פילוח נכסים
              </h3>
              <SensitiveData 
                as="p" 
                className="text-3xl font-bold mb-1"
                style={{ 
                  fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                  color: '#1D1D35'
                }}
              >
                {formatCurrency(totalAssets)}
              </SensitiveData>
              <p 
                className="text-xs"
                style={{ color: '#7E7F90' }}
              >
                שווי כולל
              </p>
            </div>

            {/* Right Side: Donut Chart */}
            <div className="relative w-32 h-32 flex-shrink-0">
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
                    {chartData.map((entry) => (
                      <Cell
                        key={entry.id}
                        fill={entry.color}
                        style={{
                          filter: hoveredItemId === entry.id 
                            ? `drop-shadow(0 0 8px ${entry.color}33)` 
                            : 'none',
                          transform: hoveredItemId === entry.id 
                            ? 'scale(1.07)' 
                            : 'scale(1)',
                          transformOrigin: 'center',
                          transition: 'all 250ms ease-out',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={() => setHoveredItemId(entry.id)}
                        onMouseLeave={() => setHoveredItemId(null)}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Legend - Right-aligned text, left-aligned percentages, with scrolling */}
          <div 
            className="flex-1 flex flex-col mt-5 px-2 overflow-y-auto max-h-[250px]"
            onMouseLeave={() => setHoveredItemId(null)}
          >
            {chartData.map((item) => {
              const isHovered = hoveredItemId === item.id;
              const hasHover = hoveredItemId !== null;
              
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-2 cursor-pointer"
                  style={{
                    opacity: hasHover && !isHovered ? 0.4 : 1,
                    transition: 'all 250ms ease-out',
                  }}
                  onMouseEnter={() => setHoveredItemId(item.id)}
                  onMouseLeave={() => setHoveredItemId(null)}
                >
                  {/* Left Side: Colored Dot + Name */}
                  <div className="flex items-center gap-2 pr-4">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <SensitiveData 
                      as="span"
                      className="text-right"
                      style={{ 
                        fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                        color: isHovered ? '#303150' : '#7E7F90',
                        fontWeight: isHovered ? 700 : 400,
                        fontSize: isHovered ? '16px' : '14px',
                        transition: 'all 250ms ease-out',
                      }}
                    >
                      {item.name}
                    </SensitiveData>
                  </div>
                  
                  {/* Right Side: Amount (slides in) + Percentage */}
                  <div className="flex items-center gap-2 pl-4">
                    {/* Amount - slides in from left, pushes percentage right */}
                    <SensitiveData 
                      as="span"
                      style={{ 
                        fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                        color: '#303150',
                        fontWeight: 600,
                        fontSize: '14px',
                        opacity: isHovered ? 1 : 0,
                        maxWidth: isHovered ? '120px' : '0px',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        transform: isHovered ? 'translateX(0)' : 'translateX(-12px)',
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
                        fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                        color: isHovered ? '#303150' : '#7E7F90',
                        fontWeight: isHovered ? 700 : 400,
                        fontSize: isHovered ? '16px' : '14px',
                        minWidth: '40px',
                        transition: 'all 250ms ease-out',
                      }}
                    >
                      {item.percentage}%
                    </SensitiveData>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
