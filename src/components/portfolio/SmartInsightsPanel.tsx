'use client';

import { RiskGauge } from './RiskGauge';
import { SectorPieChart } from './SectorPieChart';

interface SectorAllocation {
  sector: string;
  sectorHe?: string;
  value: number;
  percent: number;
}

interface SmartInsightsPanelProps {
  /** Portfolio beta */
  beta: number;
  /** Sector allocation data */
  sectorAllocation: SectorAllocation[];
  /** Additional CSS classes */
  className?: string;
  /** Callback when a sector is clicked in the pie chart */
  onSectorClick?: (sector: string) => void;
  /** Currently selected sector (for filtering) */
  selectedSector?: string | null;
}

/**
 * SmartInsightsPanel - Side panel with risk gauge and sector chart
 * Following Neto Design System - Apple Design Philosophy
 */
export function SmartInsightsPanel({
  beta,
  sectorAllocation,
  className = '',
  onSectorClick,
  selectedSector,
}: SmartInsightsPanelProps) {
  return (
    <div
      className={`flex flex-col gap-6 h-full ${className}`}
      style={{
        fontFamily: 'var(--font-nunito), system-ui, sans-serif',
      }}
    >
      {/* Risk Gauge */}
      <RiskGauge beta={beta} className="flex-shrink-0" />

      {/* Sector Pie Chart - Fills remaining space */}
      <SectorPieChart 
        sectorAllocation={sectorAllocation}
        onSectorClick={onSectorClick}
        selectedSector={selectedSector}
        className="flex-1"
      />
    </div>
  );
}

export default SmartInsightsPanel;
