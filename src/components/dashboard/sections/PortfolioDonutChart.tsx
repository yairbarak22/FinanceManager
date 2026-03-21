'use client';

import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import { SensitiveData } from '@/components/common/SensitiveData';
import { formatCurrency } from '@/lib/utils';
import { getChartColor } from '@/lib/chartColors';
import type { SectorAllocation } from '@/lib/finance/types';

interface PortfolioDonutChartProps {
  sectorAllocation: SectorAllocation[];
  totalEquityILS: number;
}

export default function PortfolioDonutChart({
  sectorAllocation,
  totalEquityILS,
}: PortfolioDonutChartProps) {
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  const chartData = useMemo(
    () =>
      [...sectorAllocation]
        .sort((a, b) => b.percent - a.percent)
        .map((s, i) => ({
          id: s.sector,
          name: s.sectorHe || s.sector,
          value: s.value,
          percentage: s.percent.toFixed(0),
          color: getChartColor(i),
        })),
    [sectorAllocation],
  );

  if (chartData.length === 0) {
    return (
      <div
        className="bg-white rounded-[20px] p-6 h-full flex flex-col items-center justify-center text-center"
        style={{ boxShadow: '0 4px 24px rgba(13, 186, 204, 0.1)' }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: 'rgba(105, 173, 255, 0.1)' }}
        >
          <PieChartIcon className="w-8 h-8" style={{ color: '#69ADFF' }} strokeWidth={1.5} />
        </div>
        <p className="text-sm mb-1" style={{ color: '#7E7F90' }}>
          אין נתוני התפלגות
        </p>
        <p className="text-xs" style={{ color: '#BDBDCB' }}>
          הוסף נכסים כדי לראות את הפילוח
        </p>
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-[20px] p-6 h-full flex flex-col"
      style={{ boxShadow: '0 4px 24px rgba(13, 186, 204, 0.1)' }}
    >
      <div className="flex-1 flex flex-col">
        {/* Header row: title+total on start side, donut on end side */}
        <div className="flex items-start gap-4 mb-6">
          <div className="flex-1">
            <h3
              className="text-sm font-medium mb-2"
              style={{
                fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                color: '#7E7F90',
              }}
            >
              התפלגות התיק
            </h3>
            <SensitiveData
              as="p"
              className="text-3xl font-bold mb-1"
              style={{
                fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                color: '#1D1D35',
              }}
            >
              {formatCurrency(totalEquityILS)}
            </SensitiveData>
            <p className="text-xs" style={{ color: '#7E7F90' }}>
              שווי כולל
            </p>
          </div>

          <div
            className="relative flex-shrink-0 overflow-hidden"
            style={{
              width: 'clamp(96px, 18vw, 128px)',
              aspectRatio: '1',
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius="58%"
                  outerRadius="80%"
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
                          ? `drop-shadow(0 0 6px ${entry.color}33)`
                          : 'none',
                        transform: hoveredItemId === entry.id
                          ? 'scale(1.04)'
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

        {/* Legend */}
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

                <div className="flex items-center gap-2 pl-4">
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
    </div>
  );
}
