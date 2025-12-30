'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, Wallet, AlertCircle } from 'lucide-react';
import { RiskGauge } from './RiskGauge';
import { HoldingsTable } from './HoldingsTable';
import { DiversificationHeatmap } from './DiversificationHeatmap';

interface PortfolioData {
  equity: number;
  equityILS: number;
  beta: number;
  dailyChangePercent: number;
  dailyChangeILS: number;
  diversificationScore: number;
  sectorAllocation: { sector: string; value: number; percent: number }[];
  holdings: Array<{
    symbol: string;
    name: string;
    quantity: number;
    priceILS: number;
    valueILS: number;
    beta: number;
    sector: string;
    changePercent: number;
    weight: number;
    sparklineData: number[];
  }>;
  riskLevel: 'conservative' | 'moderate' | 'aggressive';
}

interface SmartPortfolioProps {
  className?: string;
}

/**
 * SmartPortfolio Dashboard
 * Main dashboard component integrating all portfolio analysis features
 */
export function SmartPortfolio({ className = '' }: SmartPortfolioProps) {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchPortfolioData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/portfolio/analyze');
      if (!response.ok) {
        throw new Error('Failed to fetch portfolio data');
      }

      const result = await response.json();
      setData(result);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בטעינת הנתונים');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPortfolioData();
  }, [fetchPortfolioData]);

  // Loading state
  if (loading && !data) {
    return (
      <div className={`bg-slate-50 min-h-[400px] flex items-center justify-center ${className}`}>
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-slate-500">טוען נתוני שוק...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !data) {
    return (
      <div className={`bg-slate-50 min-h-[400px] flex items-center justify-center ${className}`}>
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle className="w-8 h-8 text-rose-500" />
          <p className="text-slate-600">{error}</p>
          <button
            onClick={fetchPortfolioData}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            נסה שוב
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (!data || data.holdings.length === 0) {
    return (
      <div className={`bg-slate-50 min-h-[400px] flex items-center justify-center ${className}`}>
        <div className="flex flex-col items-center gap-3 text-center max-w-md">
          <Wallet className="w-12 h-12 text-slate-300" />
          <h3 className="text-lg font-semibold text-slate-700">אין אחזקות בתיק</h3>
          <p className="text-slate-500 text-sm">
            הוסף אחזקות עם סימבול מניה (למשל AAPL, MSFT) כדי לראות ניתוח התיק
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-slate-50 p-4 md:p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">תיק חכם</h2>
          <p className="text-sm text-slate-500">
            ניתוח מבוסס CAPM ופיזור סיכונים
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-slate-400">
              עודכן {lastUpdated.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={fetchPortfolioData}
            disabled={loading}
            className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Value */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-400 mb-1">שווי התיק</p>
          <p className="text-2xl font-light text-slate-900 smartlook-mask">
            {data.equityILS.toLocaleString('he-IL', {
              style: 'currency',
              currency: 'ILS',
              maximumFractionDigits: 0,
            })}
          </p>
        </div>

        {/* Daily Change */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-400 mb-1">שינוי יומי</p>
          <div className="flex items-center gap-2">
            {data.dailyChangePercent >= 0 ? (
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            ) : (
              <TrendingDown className="w-5 h-5 text-rose-500" />
            )}
            <span
              className={`text-2xl font-light ${
                data.dailyChangePercent >= 0 ? 'text-emerald-600' : 'text-rose-500'
              }`}
            >
              {data.dailyChangePercent >= 0 ? '+' : ''}
              {data.dailyChangePercent.toFixed(2)}%
            </span>
          </div>
          <p className={`text-xs mt-1 smartlook-mask ${
            data.dailyChangeILS >= 0 ? 'text-emerald-600' : 'text-rose-500'
          }`}>
            {data.dailyChangeILS >= 0 ? '+' : ''}
            {data.dailyChangeILS.toLocaleString('he-IL')}₪
          </p>
        </div>

        {/* Beta */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-400 mb-1">Beta משוקלל</p>
          <p className={`text-2xl font-light ${
            data.beta < 0.8 ? 'text-emerald-600' :
            data.beta <= 1.2 ? 'text-sky-600' : 'text-rose-500'
          }`}>
            {data.beta.toFixed(2)}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {data.riskLevel === 'conservative' && 'שמרני'}
            {data.riskLevel === 'moderate' && 'מאוזן'}
            {data.riskLevel === 'aggressive' && 'אגרסיבי'}
          </p>
        </div>

        {/* Diversification */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-400 mb-1">ציון פיזור</p>
          <p className={`text-2xl font-light ${
            data.diversificationScore >= 70 ? 'text-emerald-600' :
            data.diversificationScore >= 50 ? 'text-sky-600' :
            data.diversificationScore >= 30 ? 'text-amber-500' : 'text-rose-500'
          }`}>
            {data.diversificationScore}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {data.sectorAllocation.length} סקטורים
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Risk Gauge & Heatmap */}
        <div className="space-y-6">
          <RiskGauge beta={data.beta} />
          <DiversificationHeatmap
            sectorAllocation={data.sectorAllocation}
            diversificationScore={data.diversificationScore}
          />
        </div>

        {/* Right Column - Holdings Table */}
        <div className="lg:col-span-2">
          <HoldingsTable holdings={data.holdings} />
        </div>
      </div>
    </div>
  );
}
