'use client';

import { useMemo } from 'react';
import { Sparkles, AlertTriangle, TrendingUp, Shield } from 'lucide-react';
import { RiskGauge } from './RiskGauge';
import { SectorPieChart } from './SectorPieChart';
import InfoTooltip from '@/components/ui/InfoTooltip';

interface SectorAllocation {
  sector: string;
  value: number;
  percent: number;
}

interface HoldingData {
  symbol: string;
  name: string;
  sector: string;
  weight: number;
  beta: number;
}

interface SmartInsightsPanelProps {
  /** Portfolio beta */
  beta: number;
  /** Sector allocation data */
  sectorAllocation: SectorAllocation[];
  /** Diversification score (0-100) */
  diversificationScore: number;
  /** Holdings data for analysis */
  holdings?: HoldingData[];
  /** Risk level */
  riskLevel?: 'conservative' | 'moderate' | 'aggressive';
  /** Additional CSS classes */
  className?: string;
  /** Callback when a sector is clicked in the pie chart */
  onSectorClick?: (sector: string) => void;
  /** Currently selected sector (for filtering) */
  selectedSector?: string | null;
}

interface Insight {
  type: 'warning' | 'success' | 'info';
  icon: React.ReactNode;
  message: string;
}

/**
 * Generate AI-like portfolio insights based on data
 */
function generateInsights(
  beta: number,
  sectorAllocation: SectorAllocation[],
  diversificationScore: number,
  holdings?: HoldingData[]
): Insight[] {
  const insights: Insight[] = [];

  // Beta-based insights
  if (beta > 1.3) {
    insights.push({
      type: 'warning',
      icon: <AlertTriangle className="w-4 h-4" />,
      message: 'התיק שלך תנודתי מהשוק. שקול להוסיף נכסים שמרניים יותר.',
    });
  } else if (beta < 0.7) {
    insights.push({
      type: 'success',
      icon: <Shield className="w-4 h-4" />,
      message: 'התיק שלך יציב יחסית לשוק - מתאים לפרופיל שמרני.',
    });
  }

  // Sector concentration insights
  if (sectorAllocation.length > 0) {
    const topSector = sectorAllocation[0];
    if (topSector.percent > 50) {
      insights.push({
        type: 'warning',
        icon: <AlertTriangle className="w-4 h-4" />,
        message: `ריכוז גבוה בסקטור ${topSector.sector} (${topSector.percent.toFixed(0)}%). שקול לפזר יותר.`,
      });
    } else if (sectorAllocation.length >= 5 && topSector.percent < 30) {
      insights.push({
        type: 'success',
        icon: <TrendingUp className="w-4 h-4" />,
        message: 'פיזור סקטוריאלי טוב! ההשקעות מפוזרות היטב.',
      });
    }
  }

  // Diversification score insights
  if (diversificationScore < 30) {
    insights.push({
      type: 'warning',
      icon: <AlertTriangle className="w-4 h-4" />,
      message: 'ציון הפיזור נמוך. הוסף נכסים מסקטורים שונים.',
    });
  } else if (diversificationScore >= 70) {
    insights.push({
      type: 'success',
      icon: <Shield className="w-4 h-4" />,
      message: 'ציון פיזור מעולה! התיק שלך מגוון היטב.',
    });
  }

  // Holdings-based insights
  if (holdings && holdings.length > 0) {
    // Check for high-beta stocks
    const highBetaHoldings = holdings.filter((h) => h.beta > 1.5);
    if (highBetaHoldings.length >= 3) {
      insights.push({
        type: 'info',
        icon: <TrendingUp className="w-4 h-4" />,
        message: `יש לך ${highBetaHoldings.length} נכסים עם סיכון גבוה. מתאים לטווח ארוך.`,
      });
    }

    // Check for concentrated positions
    const largePositions = holdings.filter((h) => h.weight > 25);
    if (largePositions.length > 0) {
      insights.push({
        type: 'warning',
        icon: <AlertTriangle className="w-4 h-4" />,
        message: `${largePositions[0].symbol} מהווה ${largePositions[0].weight.toFixed(0)}% מהתיק. שקול לאזן.`,
      });
    }
  }

  // If no insights, add a default one
  if (insights.length === 0) {
    insights.push({
      type: 'info',
      icon: <Sparkles className="w-4 h-4" />,
      message: 'המשך לעקוב אחר התיק שלך לקבלת המלצות מותאמות.',
    });
  }

  return insights.slice(0, 3); // Limit to 3 insights
}

/**
 * SmartInsightsPanel - Side panel with risk gauge, sector chart, and AI insights
 * Following Neto Design System - Apple Design Philosophy
 */
export function SmartInsightsPanel({
  beta,
  sectorAllocation,
  diversificationScore,
  holdings,
  className = '',
  onSectorClick,
  selectedSector,
}: SmartInsightsPanelProps) {
  // Generate insights
  const insights = useMemo(
    () => generateInsights(beta, sectorAllocation, diversificationScore, holdings),
    [beta, sectorAllocation, diversificationScore, holdings]
  );

  return (
    <div
      className={`flex flex-col gap-6 overflow-y-auto scrollbar-ghost ${className}`}
      style={{
        fontFamily: 'var(--font-nunito), system-ui, sans-serif',
        minHeight: '700px',
      }}
    >
      {/* Risk Gauge */}
      <RiskGauge beta={beta} />

      {/* Sector Pie Chart */}
      <SectorPieChart 
        sectorAllocation={sectorAllocation}
        onSectorClick={onSectorClick}
        selectedSector={selectedSector}
      />

      {/* AI Portfolio Analysis */}
      <div
        className="bg-[#FFFFFF] rounded-3xl p-6"
        style={{
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08), 0 0 20px rgba(105, 173, 255, 0.1)',
        }}
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #0DBACC 0%, #69ADFF 100%)' }}
            >
              <Sparkles className="w-4 h-4 text-white" strokeWidth={1.75} />
            </div>
            <span className="text-sm font-semibold text-[#303150]">תובנות חכמות</span>
          </div>
          <InfoTooltip
            content="המלצות אוטומטיות המבוססות על ניתוח התיק שלך, רמת הסיכון והפיזור."
            side="top"
          />
        </div>

        {/* Insights List */}
        <div className="space-y-3">
          {insights.map((insight, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 p-3 rounded-xl ${
                insight.type === 'warning'
                  ? 'bg-[#FFC0DB]/20'
                  : insight.type === 'success'
                  ? 'bg-[#B4F1F1]/20'
                  : 'bg-[#C1DDFF]/20'
              }`}
            >
              <div
                className={`flex-shrink-0 mt-0.5 ${
                  insight.type === 'warning'
                    ? 'text-[#F18AB5]'
                    : insight.type === 'success'
                    ? 'text-[#0DBACC]'
                    : 'text-[#69ADFF]'
                }`}
              >
                {insight.icon}
              </div>
              <p className="text-xs text-[#303150] leading-relaxed">{insight.message}</p>
            </div>
          ))}
        </div>

        {/* Diversification Score */}
        <div className="mt-4 pt-4 border-t border-[#F7F7F8]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#7E7F90]">ציון פיזור</span>
            <div className="flex items-center gap-2">
              <div
                className={`text-lg font-bold ${
                  diversificationScore >= 70
                    ? 'text-[#0DBACC]'
                    : diversificationScore >= 50
                    ? 'text-[#69ADFF]'
                    : diversificationScore >= 30
                    ? 'text-[#FFB84D]'
                    : 'text-[#F18AB5]'
                }`}
              >
                {diversificationScore}
              </div>
              <span className="text-xs text-[#BDBDCB]">/ 100</span>
            </div>
          </div>
          {/* Score Bar */}
          <div className="mt-2 h-1.5 bg-[#F7F7F8] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${diversificationScore}%`,
                backgroundColor:
                  diversificationScore >= 70
                    ? '#0DBACC'
                    : diversificationScore >= 50
                    ? '#69ADFF'
                    : diversificationScore >= 30
                    ? '#FFB84D'
                    : '#F18AB5',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default SmartInsightsPanel;

