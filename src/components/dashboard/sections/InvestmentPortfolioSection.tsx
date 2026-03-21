'use client';

import { SectionHeader } from '@/components/dashboard';
import Card from '@/components/ui/Card';
import { TrendingUp } from 'lucide-react';
import type { PortfolioAnalysis } from '@/lib/finance/types';
import { PortfolioSummaryHero } from '@/components/portfolio';
import PortfolioDonutChart from './PortfolioDonutChart';

export interface InvestmentPortfolioSectionProps {
  portfolioAnalysis: PortfolioAnalysis | null;
  portfolioHistory: Array<{ date: string; value: number }>;
  isLoading: boolean;
  error: Error | null;
}

export default function InvestmentPortfolioSection({
  portfolioAnalysis,
  portfolioHistory,
  isLoading,
  error,
}: InvestmentPortfolioSectionProps) {
  const hasData = portfolioAnalysis && portfolioAnalysis.equityILS > 0;

  return (
    <section>
      <SectionHeader
        title="תיק השקעות"
        subtitle="מעקב אחר תיק המסחר וההשקעות שלך"
      />

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <Card className="h-[420px] animate-pulse">
              <div className="h-full flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#69ADFF] border-t-transparent rounded-full animate-spin" />
              </div>
            </Card>
          </div>
          <div className="lg:col-span-4">
            <Card className="h-[420px] animate-pulse">
              <div className="h-full flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#69ADFF] border-t-transparent rounded-full animate-spin" />
              </div>
            </Card>
          </div>
        </div>
      ) : error || !hasData ? (
        <Card>
          <div className="flex flex-col items-center justify-center min-h-[200px] gap-3">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(105, 173, 255, 0.1)' }}
            >
              <TrendingUp className="w-8 h-8" style={{ color: '#69ADFF' }} strokeWidth={1.5} />
            </div>
            <p className="text-sm" style={{ color: '#7E7F90', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}>
              {error ? 'שגיאה בטעינת תיק ההשקעות' : 'אין החזקות בתיק'}
            </p>
            <p className="text-xs" style={{ color: '#BDBDCB', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}>
              {error ? 'נסה לרענן את הדף' : 'הוסף נכסים בעמוד תיק ההשקעות'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <PortfolioSummaryHero
              totalValue={portfolioAnalysis.equityILS}
              dailyChangeILS={portfolioAnalysis.dailyChangeILS}
              dailyChangePercent={portfolioAnalysis.dailyChangePercent}
              cashBalance={portfolioAnalysis.cashBalance ?? 0}
              cashWeight={portfolioAnalysis.cashWeight}
              portfolioHistory={portfolioHistory}
              exchangeRate={portfolioAnalysis.exchangeRate}
              className="h-full"
            />
          </div>
          <div className="lg:col-span-4">
            <PortfolioDonutChart
              sectorAllocation={portfolioAnalysis.sectorAllocation}
              totalEquityILS={portfolioAnalysis.equityILS}
            />
          </div>
        </div>
      )}
    </section>
  );
}
