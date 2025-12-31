'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, Wallet, AlertCircle, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { RiskGauge } from './RiskGauge';
import { HoldingsTable } from './HoldingsTable';
import { DiversificationHeatmap } from './DiversificationHeatmap';
import { AddAssetButton } from './AddAssetButton';
import { apiFetch } from '@/lib/utils';
import { SensitiveData } from '../common/SensitiveData';

interface HoldingData {
  id?: string;
  symbol: string;
  name: string;
  quantity: number;
  priceILS: number;
  valueILS: number;
  beta: number;
  sector: string;
  currency?: 'USD' | 'ILS';
  provider?: 'YAHOO' | 'EOD';
  changePercent: number;
  weight: number;
  sparklineData: number[];
}

interface PortfolioData {
  equity: number;
  equityILS: number;
  beta: number;
  dailyChangePercent: number;
  dailyChangeILS: number;
  diversificationScore: number;
  sectorAllocation: { sector: string; value: number; percent: number }[];
  holdings: HoldingData[];
  riskLevel: 'conservative' | 'moderate' | 'aggressive';
}

interface SmartPortfolioProps {
  className?: string;
}

/**
 * Edit Holding Modal
 */
function EditHoldingModal({
  holding,
  onClose,
  onSave,
}: {
  holding: HoldingData;
  onClose: () => void;
  onSave: (id: string, quantity: number) => Promise<void>;
}) {
  const [quantity, setQuantity] = useState(holding.quantity.toString());
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    const qty = parseFloat(quantity);
    if (!qty || qty <= 0) {
      setError('נא להזין כמות תקינה');
      return;
    }

    if (!holding.id) {
      setError('לא ניתן לערוך אחזקה זו');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(holding.id, qty);
      onClose();
    } catch {
      setError('שגיאה בשמירת השינויים');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <motion.div
        key="edit-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
      />
      <motion.div
        key="edit-modal"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm z-50"
      >
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mx-4 p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">עריכת אחזקה</h3>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Stock Info */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl mb-4">
            <div className="flex-1 text-right">
              <p className="font-bold text-slate-900">{holding.symbol}</p>
              <p className="text-sm text-slate-500 truncate">{holding.name}</p>
            </div>
          </div>

          {/* Quantity Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2 text-right">
              כמות יחידות
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => {
                setQuantity(e.target.value);
                setError('');
              }}
              className={`w-full px-4 py-3 text-lg text-right rounded-xl border transition-colors outline-none ${
                error
                  ? 'border-rose-300 bg-rose-50 focus:border-rose-500'
                  : 'border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
              }`}
              min="0"
              step="0.01"
              dir="ltr"
              autoFocus
            />
            {error && (
              <p className="mt-1 text-sm text-rose-500 text-right">{error}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
            >
              ביטול
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 px-4 py-3 text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                'שמור'
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

/**
 * Delete Confirmation Modal
 */
function DeleteConfirmModal({
  holding,
  onClose,
  onConfirm,
}: {
  holding: HoldingData;
  onClose: () => void;
  onConfirm: (id: string) => Promise<void>;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!holding.id) return;

    setIsDeleting(true);
    try {
      await onConfirm(holding.id);
      onClose();
    } catch {
      // Error handled in parent
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <motion.div
        key="delete-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
      />
      <motion.div
        key="delete-modal"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm z-50"
      >
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mx-4 p-5 text-center">
          <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-rose-600" />
          </div>

          <h3 className="text-lg font-semibold text-slate-900 mb-2">מחיקת אחזקה</h3>
          <p className="text-slate-500 mb-4">
            האם למחוק את <span className="font-semibold text-slate-700">{holding.symbol}</span> מהתיק?
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
            >
              ביטול
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 px-4 py-3 text-white bg-rose-600 rounded-xl hover:bg-rose-700 transition-all active:scale-95 disabled:opacity-50"
            >
              {isDeleting ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                'מחק'
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
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

  // Edit/Delete state
  const [editingHolding, setEditingHolding] = useState<HoldingData | null>(null);
  const [deletingHolding, setDeletingHolding] = useState<HoldingData | null>(null);

  const fetchPortfolioData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/portfolio/analyze');

      // Check content type to ensure we got JSON
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error('יש להתחבר מחדש למערכת');
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch portfolio data');
      }

      setData(result);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Portfolio fetch error:', err);
      setError(err instanceof Error ? err.message : 'שגיאה בטעינת הנתונים');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAddAsset = async (assetData: {
    symbol: string;
    name: string;
    quantity: number;
    price: number;
    priceILS: number;
    provider: 'YAHOO' | 'EOD';
    currency: string;
  }) => {
    try {
      // Use existing holdings API - currentValue represents quantity for portfolio analysis
      const response = await apiFetch('/api/holdings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: assetData.name,
          symbol: assetData.symbol,
          currentValue: assetData.quantity, // quantity becomes currentValue in DB
          targetAllocation: 0, // Default, user can adjust later
          type: 'stock',
          provider: assetData.provider,
          currency: assetData.currency,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add asset');
      }

      // Refresh portfolio data after adding
      await fetchPortfolioData();
    } catch (err) {
      console.error('Error adding asset:', err);
      throw err;
    }
  };

  // Edit holding handler
  const handleEditHolding = async (id: string, quantity: number) => {
    const response = await apiFetch(`/api/holdings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentValue: quantity }),
    });

    if (!response.ok) {
      throw new Error('Failed to update holding');
    }

    await fetchPortfolioData();
  };

  // Delete holding handler
  const handleDeleteHolding = async (id: string) => {
    const response = await apiFetch(`/api/holdings/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete holding');
    }

    await fetchPortfolioData();
  };

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
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <Wallet className="w-12 h-12 text-slate-300" />
          <h3 className="text-lg font-semibold text-slate-700">אין אחזקות בתיק</h3>
          <p className="text-slate-500 text-sm">
            הוסף אחזקות עם סימבול מניה (למשל AAPL, MSFT) כדי לראות ניתוח התיק
          </p>
          <AddAssetButton onAddAsset={handleAddAsset} />
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
          <AddAssetButton onAddAsset={handleAddAsset} />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Value */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-400 mb-1">שווי התיק</p>
          <SensitiveData as="p" className="text-2xl font-light text-slate-900">
            {data.equityILS.toLocaleString('he-IL', {
              style: 'currency',
              currency: 'ILS',
              maximumFractionDigits: 0,
            })}
          </SensitiveData>
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
          <SensitiveData as="p" className={`text-xs mt-1 ${
            data.dailyChangeILS >= 0 ? 'text-emerald-600' : 'text-rose-500'
          }`}>
            {data.dailyChangeILS >= 0 ? '+' : ''}
            {data.dailyChangeILS.toLocaleString('he-IL')}₪
          </SensitiveData>
        </div>

        {/* Beta */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-400 mb-1">סיכון משוקלל</p>
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
          <HoldingsTable
            holdings={data.holdings}
            onEdit={(holding) => setEditingHolding(holding)}
            onDelete={(holding) => setDeletingHolding(holding)}
          />
        </div>
      </div>

      {/* Edit Modal */}
      {editingHolding && (
        <EditHoldingModal
          holding={editingHolding}
          onClose={() => setEditingHolding(null)}
          onSave={handleEditHolding}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingHolding && (
        <DeleteConfirmModal
          holding={deletingHolding}
          onClose={() => setDeletingHolding(null)}
          onConfirm={handleDeleteHolding}
        />
      )}
    </div>
  );
}
