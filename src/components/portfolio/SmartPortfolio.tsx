'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, Wallet, AlertCircle, X, Loader2, Banknote, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { RiskGauge } from './RiskGauge';
import { HoldingsTable } from './HoldingsTable';
import { DiversificationHeatmap } from './DiversificationHeatmap';
import { AddAssetButton } from './AddAssetButton';
import { apiFetch } from '@/lib/utils';
import { SensitiveData } from '../common/SensitiveData';

type PriceDisplayUnit = 'ILS' | 'ILS_AGOROT' | 'USD';

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
  priceDisplayUnit?: PriceDisplayUnit;
  changePercent: number;
  weight: number;
  sparklineData: number[];
}

interface PortfolioData {
  equity: number;
  equityILS: number;
  cashBalance?: number;
  cashWeight?: number;
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
 * Edit Cash Modal
 */
function EditCashModal({
  currentCash,
  onClose,
  onSave,
}: {
  currentCash: number;
  onClose: () => void;
  onSave: (cashBalance: number) => Promise<void>;
}) {
  const [cashBalance, setCashBalance] = useState(currentCash.toString());
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    const amount = parseFloat(cashBalance);
    if (isNaN(amount) || amount < 0) {
      setError('נא להזין סכום תקין');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(amount);
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
        key="cash-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
      />
      <motion.div
        key="cash-modal"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm z-50"
      >
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mx-4 p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#303150]">עריכת מזומן בתיק</h3>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-[#F7F7F8] transition-colors"
            >
              <X className="w-5 h-5 text-[#BDBDCB]" />
            </button>
          </div>

          {/* Cash Icon */}
          <div className="flex items-center gap-3 p-3 bg-[#B4F1F1]/30 rounded-xl mb-4">
            <div className="w-10 h-10 bg-[#B4F1F1] rounded-full flex items-center justify-center">
              <Banknote className="w-5 h-5 text-[#0DBACC]" />
            </div>
            <div className="flex-1 text-right">
              <p className="font-bold text-[#303150]">מזומן</p>
              <p className="text-sm text-[#7E7F90]">סכום מזומן בתיק ההשקעות</p>
            </div>
          </div>

          {/* Cash Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-[#303150] mb-2 text-right">
              סכום בשקלים (₪)
            </label>
            <input
              type="number"
              value={cashBalance}
              onChange={(e) => {
                setCashBalance(e.target.value);
                setError('');
              }}
              className={`w-full px-4 py-3 text-lg text-right rounded-xl border transition-colors outline-none ${
                error
                  ? 'border-rose-300 bg-rose-50 focus:border-rose-500'
                  : 'border-[#E8E8ED] focus:border-[#69ADFF] focus:ring-2 focus:ring-[#69ADFF]/20'
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
              className="flex-1 px-4 py-3 text-[#7E7F90] bg-[#F7F7F8] rounded-xl hover:bg-[#E8E8ED] transition-colors"
            >
              ביטול
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 px-4 py-3 text-white bg-[#0DBACC] rounded-xl hover:bg-[#0DBACC]/90 transition-all active:scale-95 disabled:opacity-50"
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
 * Edit Holding Modal
 */
function EditHoldingModal({
  holding,
  onClose,
  onSave,
}: {
  holding: HoldingData;
  onClose: () => void;
  onSave: (id: string, quantity: number, priceDisplayUnit: PriceDisplayUnit) => Promise<void>;
}) {
  const [quantity, setQuantity] = useState(holding.quantity.toString());
  const [priceDisplayUnit, setPriceDisplayUnit] = useState<PriceDisplayUnit>(
    holding.priceDisplayUnit || 'ILS'
  );
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
      await onSave(holding.id, qty, priceDisplayUnit);
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
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
      />
      <motion.div
        key="edit-modal"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm z-50"
      >
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mx-4 p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#303150]">עריכת אחזקה</h3>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-[#F7F7F8] transition-colors"
            >
              <X className="w-5 h-5 text-[#BDBDCB]" />
            </button>
          </div>

          {/* Stock Info */}
          <div className="flex items-center gap-3 p-3 bg-[#F7F7F8] rounded-xl mb-4">
            <div className="flex-1 text-right">
              <p className="font-bold text-[#303150]">{holding.symbol}</p>
              <p className="text-sm text-[#7E7F90] truncate">{holding.name}</p>
            </div>
          </div>

          {/* Quantity Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-[#303150] mb-2 text-right">
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
                  : 'border-[#E8E8ED] focus:border-[#69ADFF] focus:ring-2 focus:ring-[#69ADFF]/20'
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

          {/* Price Display Unit Selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-[#303150] mb-2 text-right">
              יחידת תצוגת מחיר
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPriceDisplayUnit('ILS')}
                className={`flex-1 px-3 py-2 text-sm rounded-xl border transition-all ${
                  priceDisplayUnit === 'ILS'
                    ? 'bg-[#69ADFF] text-white border-[#69ADFF]'
                    : 'bg-white text-[#303150] border-[#E8E8ED] hover:border-[#69ADFF]'
                }`}
              >
                שקל (₪)
              </button>
              <button
                type="button"
                onClick={() => setPriceDisplayUnit('ILS_AGOROT')}
                className={`flex-1 px-3 py-2 text-sm rounded-xl border transition-all ${
                  priceDisplayUnit === 'ILS_AGOROT'
                    ? 'bg-[#69ADFF] text-white border-[#69ADFF]'
                    : 'bg-white text-[#303150] border-[#E8E8ED] hover:border-[#69ADFF]'
                }`}
              >
                אגורות
              </button>
              <button
                type="button"
                onClick={() => setPriceDisplayUnit('USD')}
                className={`flex-1 px-3 py-2 text-sm rounded-xl border transition-all ${
                  priceDisplayUnit === 'USD'
                    ? 'bg-[#69ADFF] text-white border-[#69ADFF]'
                    : 'bg-white text-[#303150] border-[#E8E8ED] hover:border-[#69ADFF]'
                }`}
              >
                דולר ($)
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 text-[#7E7F90] bg-[#F7F7F8] rounded-xl hover:bg-[#E8E8ED] transition-colors"
            >
              ביטול
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 px-4 py-3 text-white bg-[#303150] rounded-xl hover:bg-[#303150]/90 transition-all active:scale-95 disabled:opacity-50"
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
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
      />
      <motion.div
        key="delete-modal"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm z-50"
      >
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mx-4 p-5 text-center">
          <div className="w-12 h-12 bg-[#FFC0DB] rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-[#F18AB5]" />
          </div>

          <h3 className="text-lg font-semibold text-[#303150] mb-2">מחיקת אחזקה</h3>
          <p className="text-[#7E7F90] mb-4">
            האם למחוק את <span className="font-semibold text-[#303150]">{holding.symbol}</span> מהתיק?
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 text-[#7E7F90] bg-[#F7F7F8] rounded-xl hover:bg-[#E8E8ED] transition-colors"
            >
              ביטול
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 px-4 py-3 text-white bg-[#F18AB5] rounded-xl hover:bg-[#F18AB5]/90 transition-all active:scale-95 disabled:opacity-50"
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
  const [isEditingCash, setIsEditingCash] = useState(false);

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
    priceDisplayUnit: 'ILS' | 'ILS_AGOROT' | 'USD';
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
          priceDisplayUnit: assetData.priceDisplayUnit,
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
  const handleEditHolding = async (id: string, quantity: number, priceDisplayUnit: PriceDisplayUnit) => {
    const response = await apiFetch(`/api/holdings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentValue: quantity, priceDisplayUnit }),
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

  // Update cash balance handler
  const handleUpdateCash = async (cashBalance: number) => {
    const response = await apiFetch('/api/portfolio/cash', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cashBalance }),
    });

    if (!response.ok) {
      throw new Error('Failed to update cash balance');
    }

    await fetchPortfolioData();
  };

  useEffect(() => {
    fetchPortfolioData();
  }, [fetchPortfolioData]);

  // Loading state
  if (loading && !data) {
    return (
      <div className={`bg-[#F7F7F8] min-h-[400px] flex items-center justify-center ${className}`}>
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-[#69ADFF] animate-spin" />
          <p className="text-[#7E7F90]">טוען נתוני שוק...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !data) {
    return (
      <div className={`bg-[#F7F7F8] min-h-[400px] flex items-center justify-center ${className}`}>
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle className="w-8 h-8 text-[#F18AB5]" />
          <p className="text-[#7E7F90]">{error}</p>
          <button
            onClick={fetchPortfolioData}
            className="px-4 py-2 bg-[#69ADFF] text-white rounded-xl hover:bg-[#69ADFF]/90 transition-colors"
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
      <div className={`bg-[#F7F7F8] min-h-[400px] flex items-center justify-center ${className}`}>
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <Wallet className="w-12 h-12 text-[#BDBDCB]" />
          <h3 className="text-lg font-semibold text-[#303150]">אין אחזקות בתיק</h3>
          <p className="text-[#7E7F90] text-sm">
            הוסף אחזקות עם סימבול מניה (למשל AAPL, MSFT) כדי לראות ניתוח התיק
          </p>
          <AddAssetButton onAddAsset={handleAddAsset} />
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-[#F7F7F8] p-4 md:p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#303150]">תיק חכם</h2>
          <p className="text-sm text-[#7E7F90]">
            ניתוח מבוסס CAPM ופיזור סיכונים
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-[#BDBDCB]">
              עודכן {lastUpdated.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={fetchPortfolioData}
            disabled={loading}
            className="p-2 rounded-xl border border-[#E8E8ED] bg-white hover:bg-[#F7F7F8] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-[#7E7F90] ${loading ? 'animate-spin' : ''}`} />
          </button>
          <AddAssetButton onAddAsset={handleAddAsset} />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Value */}
        <div className="bg-white rounded-3xl border border-[#E8E8ED] p-4">
          <p className="text-xs text-[#BDBDCB] mb-1">שווי התיק</p>
          <SensitiveData as="p" className="text-2xl font-light text-[#303150]">
            {data.equityILS.toLocaleString('he-IL', {
              style: 'currency',
              currency: 'ILS',
              maximumFractionDigits: 0,
            })}
          </SensitiveData>
        </div>

        {/* Daily Change */}
        <div className="bg-white rounded-3xl border border-[#E8E8ED] p-4">
          <p className="text-xs text-[#BDBDCB] mb-1">שינוי יומי</p>
          <div className="flex items-center gap-2">
            {data.dailyChangePercent >= 0 ? (
              <TrendingUp className="w-5 h-5 text-[#0DBACC]" />
            ) : (
              <TrendingDown className="w-5 h-5 text-[#F18AB5]" />
            )}
            <span
              className={`text-2xl font-light ${
                data.dailyChangePercent >= 0 ? 'text-[#0DBACC]' : 'text-[#F18AB5]'
              }`}
              dir="ltr"
            >
              {data.dailyChangePercent >= 0 ? '+' : ''}
              {data.dailyChangePercent.toFixed(2)}%
            </span>
          </div>
          <SensitiveData as="p" className={`text-xs mt-1 ${
            data.dailyChangeILS >= 0 ? 'text-[#0DBACC]' : 'text-[#F18AB5]'
          }`} dir="ltr">
            {data.dailyChangeILS >= 0 ? '+' : ''}
            {data.dailyChangeILS.toLocaleString('he-IL')}₪
          </SensitiveData>
        </div>

        {/* Beta */}
        <div className="bg-white rounded-3xl border border-[#E8E8ED] p-4">
          <p className="text-xs text-[#BDBDCB] mb-1">סיכון משוקלל</p>
          <p className={`text-2xl font-light ${
            data.beta < 0.8 ? 'text-[#0DBACC]' :
            data.beta <= 1.2 ? 'text-[#69ADFF]' : 'text-[#F18AB5]'
          }`}>
            {data.beta.toFixed(2)}
          </p>
          <p className="text-xs text-[#BDBDCB] mt-1">
            {data.riskLevel === 'conservative' && 'שמרני'}
            {data.riskLevel === 'moderate' && 'מאוזן'}
            {data.riskLevel === 'aggressive' && 'אגרסיבי'}
          </p>
        </div>

        {/* Diversification */}
        <div className="bg-white rounded-3xl border border-[#E8E8ED] p-4">
          <p className="text-xs text-[#BDBDCB] mb-1">ציון פיזור</p>
          <p className={`text-2xl font-light ${
            data.diversificationScore >= 70 ? 'text-[#0DBACC]' :
            data.diversificationScore >= 50 ? 'text-[#69ADFF]' :
            data.diversificationScore >= 30 ? 'text-[#FFB84D]' : 'text-[#F18AB5]'
          }`}>
            {data.diversificationScore}
          </p>
          <p className="text-xs text-[#BDBDCB] mt-1">
            {data.sectorAllocation.length} סקטורים
          </p>
        </div>
      </div>

      {/* Cash Balance Section */}
      <div className="bg-white rounded-3xl border border-[#E8E8ED] p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#B4F1F1] rounded-full flex items-center justify-center">
              <Banknote className="w-5 h-5 text-[#0DBACC]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#303150]">מזומן בתיק</p>
              <SensitiveData as="p" className="text-xl font-semibold text-[#303150]">
                {(data.cashBalance ?? 0).toLocaleString('he-IL', {
                  style: 'currency',
                  currency: 'ILS',
                  maximumFractionDigits: 0,
                })}
              </SensitiveData>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {data.cashWeight !== undefined && data.cashWeight > 0 && (
              <div className="text-right">
                <p className="text-xs text-[#BDBDCB]">אחוז מהתיק</p>
                <p className="text-sm font-medium text-[#7E7F90]">{data.cashWeight.toFixed(1)}%</p>
              </div>
            )}
            <button
              onClick={() => setIsEditingCash(true)}
              className="p-2 rounded-xl border border-[#E8E8ED] bg-white hover:bg-[#F7F7F8] transition-colors"
            >
              <Pencil className="w-4 h-4 text-[#7E7F90]" />
            </button>
          </div>
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

      {/* Edit Cash Modal */}
      {isEditingCash && (
        <EditCashModal
          currentCash={data.cashBalance ?? 0}
          onClose={() => setIsEditingCash(false)}
          onSave={handleUpdateCash}
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
