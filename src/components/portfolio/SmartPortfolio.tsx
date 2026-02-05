'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Wallet, AlertCircle, X, Loader2, Banknote, Plus, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { HoldingsTable } from './HoldingsTable';
import { AddAssetButton } from './AddAssetButton';
import { PortfolioSummaryHero } from './PortfolioSummaryHero';
import { SmartInsightsPanel } from './SmartInsightsPanel';
import { PortfolioSettingsCard } from './PortfolioSettingsCard';
import { ImportPortfolioDialog } from './ImportPortfolioDialog';
import SectionHeader from '@/components/dashboard/SectionHeader';
import { apiFetch } from '@/lib/utils';

type PriceDisplayUnit = 'ILS' | 'ILS_AGOROT' | 'USD';
type Currency = 'ILS' | 'USD';

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
  targetAllocation?: number;
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

// Default exchange rate (will be updated from API)
const DEFAULT_EXCHANGE_RATE = 3.65;

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
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999]"
      />
      <motion.div
        key="cash-modal"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm z-[9999]"
      >
        <div
          className="bg-[#FFFFFF] rounded-3xl overflow-hidden mx-4 p-6"
          style={{
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            fontFamily: 'var(--font-nunito), system-ui, sans-serif',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-[#303150]">עריכת מזומן בתיק</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[#F7F7F8] transition-colors"
            >
              <X className="w-5 h-5 text-[#BDBDCB]" strokeWidth={1.75} />
            </button>
          </div>

          {/* Cash Icon */}
          <div className="flex items-center gap-3 p-4 bg-[#B4F1F1]/20 rounded-xl mb-6">
            <div className="w-12 h-12 bg-[#B4F1F1] rounded-xl flex items-center justify-center">
              <Banknote className="w-6 h-6 text-[#0DBACC]" strokeWidth={1.75} />
            </div>
            <div className="flex-1 text-right">
              <p className="font-bold text-[#303150]">מזומן</p>
              <p className="text-sm text-[#7E7F90]">סכום מזומן בתיק ההשקעות</p>
            </div>
          </div>

          {/* Cash Input */}
          <div className="mb-6">
            <label className="block text-[0.8125rem] font-medium text-[#7E7F90] mb-2 text-right">
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
                  ? 'border-[#F18AB5] bg-[#FFC0DB]/10 focus:border-[#F18AB5]'
                  : 'border-[#E8E8ED] focus:border-[#69ADFF] focus:ring-2 focus:ring-[#69ADFF]/20'
              }`}
              style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
              min="0"
              step="0.01"
              dir="ltr"
              autoFocus
            />
            {error && (
              <p className="mt-2 text-sm text-[#F18AB5] text-right">{error}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-5 py-2.5 text-[#303150] bg-[#F7F7F8] rounded-xl hover:bg-[#E8E8ED] transition-colors font-medium"
              style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
            >
              ביטול
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 px-5 py-2.5 text-white bg-[#69ADFF] rounded-xl hover:bg-[#5A9EE6] transition-all active:scale-95 disabled:opacity-60 font-medium"
              style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
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

type ValueCurrency = 'ILS' | 'USD';

/**
 * Edit Holding Modal
 */
function EditHoldingModal({
  holding,
  onClose,
  onSave,
  exchangeRate = DEFAULT_EXCHANGE_RATE,
}: {
  holding: HoldingData;
  onClose: () => void;
  onSave: (id: string, quantity: number, priceDisplayUnit: PriceDisplayUnit) => Promise<void>;
  exchangeRate?: number;
}) {
  const [quantity, setQuantity] = useState(holding.quantity.toString());
  const [priceDisplayUnit, setPriceDisplayUnit] = useState<PriceDisplayUnit>(
    holding.priceDisplayUnit || 'ILS'
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Value-based input states
  const [value, setValue] = useState('');
  const [valueCurrency, setValueCurrency] = useState<ValueCurrency>('ILS');
  const [manualPrice, setManualPrice] = useState('');
  const [manualPriceCurrency, setManualPriceCurrency] = useState<ValueCurrency>('ILS');
  const [lastEditedField, setLastEditedField] = useState<'quantity' | 'value' | null>(null);
  
  // Use holding's price or manual price
  const effectivePriceILS = manualPrice && parseFloat(manualPrice) > 0
    ? (manualPriceCurrency === 'ILS' 
        ? parseFloat(manualPrice) 
        : parseFloat(manualPrice) * exchangeRate)
    : holding.priceILS || 0;
    
  const effectivePriceUSD = effectivePriceILS > 0 ? effectivePriceILS / exchangeRate : 0;
  
  // Initialize value from quantity on mount
  useEffect(() => {
    if (effectivePriceILS > 0 && holding.quantity > 0) {
      const initialValue = holding.quantity * effectivePriceILS;
      setValue(initialValue.toFixed(2));
    }
  }, []);

  // Calculate value from quantity when quantity changes
  useEffect(() => {
    if (lastEditedField === 'quantity' && quantity && effectivePriceILS > 0) {
      const qty = parseFloat(quantity);
      if (!isNaN(qty) && qty > 0) {
        let newValue: number;
        if (valueCurrency === 'ILS') {
          newValue = qty * effectivePriceILS;
        } else {
          newValue = qty * effectivePriceUSD;
        }
        setValue(newValue.toFixed(2));
      }
    }
  }, [quantity, effectivePriceILS, effectivePriceUSD, valueCurrency, lastEditedField]);

  // Calculate quantity from value when value changes
  useEffect(() => {
    if (lastEditedField === 'value' && value && effectivePriceILS > 0) {
      const val = parseFloat(value);
      if (!isNaN(val) && val > 0) {
        let newQuantity: number;
        if (valueCurrency === 'ILS') {
          newQuantity = val / effectivePriceILS;
        } else {
          newQuantity = val / effectivePriceUSD;
        }
        setQuantity(newQuantity.toFixed(4).replace(/\.?0+$/, ''));
      }
    }
  }, [value, effectivePriceILS, effectivePriceUSD, valueCurrency, lastEditedField]);

  // Recalculate when currency changes
  useEffect(() => {
    if (effectivePriceILS > 0 && quantity) {
      const qty = parseFloat(quantity);
      if (!isNaN(qty) && qty > 0) {
        let newValue: number;
        if (valueCurrency === 'ILS') {
          newValue = qty * effectivePriceILS;
        } else {
          newValue = qty * effectivePriceUSD;
        }
        setValue(newValue.toFixed(2));
      }
    }
  }, [valueCurrency]);

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
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999]"
      />
      <motion.div
        key="edit-modal"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm z-[9999]"
      >
        <div
          className="bg-[#FFFFFF] rounded-3xl overflow-hidden mx-4 p-6 max-h-[90vh] overflow-y-auto"
          style={{
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            fontFamily: 'var(--font-nunito), system-ui, sans-serif',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-[#303150]">עריכת אחזקה</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[#F7F7F8] transition-colors"
            >
              <X className="w-5 h-5 text-[#BDBDCB]" strokeWidth={1.75} />
            </button>
          </div>

          {/* Stock Info */}
          <div className="flex items-center gap-3 p-4 bg-[#F7F7F8] rounded-xl mb-4">
            <div className="flex-1 text-right">
              <p className="font-bold text-[#303150]">{holding.symbol}</p>
              <p className="text-sm text-[#7E7F90] truncate">{holding.name}</p>
            </div>
            {effectivePriceILS > 0 && (
              <div className="text-left">
                <p className="font-semibold text-[#303150]">
                  ₪{effectivePriceILS.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            )}
          </div>

          {/* Quantity Input */}
          <div className="mb-3">
            <label className="block text-[0.8125rem] font-medium text-[#7E7F90] mb-2 text-right">
              כמות יחידות
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => {
                setQuantity(e.target.value);
                setError('');
                setLastEditedField('quantity');
              }}
              className={`w-full px-4 py-3 text-lg text-right rounded-xl border transition-colors outline-none ${
                error
                  ? 'border-[#F18AB5] bg-[#FFC0DB]/10 focus:border-[#F18AB5]'
                  : 'border-[#E8E8ED] focus:border-[#69ADFF] focus:ring-2 focus:ring-[#69ADFF]/20'
              }`}
              style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
              min="0"
              step="0.01"
              dir="ltr"
              autoFocus
            />
            {error && (
              <p className="mt-2 text-sm text-[#F18AB5] text-right">{error}</p>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-px bg-[#E8E8ED]" />
            <span className="text-xs text-[#BDBDCB] font-medium">או</span>
            <div className="flex-1 h-px bg-[#E8E8ED]" />
          </div>

          {/* Value Input */}
          <div className="mb-4">
            <label className="block text-[0.8125rem] font-medium text-[#7E7F90] mb-2 text-right">
              שווי (₪)
            </label>
            <input
              type="number"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError('');
                setLastEditedField('value');
              }}
              placeholder="0"
              className="w-full px-4 py-3 text-lg text-right rounded-xl border border-[#E8E8ED] focus:border-[#69ADFF] focus:ring-2 focus:ring-[#69ADFF]/20 transition-colors outline-none"
              style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
              min="0"
              step="0.01"
              dir="ltr"
            />
          </div>

          {/* Manual Price Input (when price not available) */}
          {effectivePriceILS === 0 && (
            <div className="mb-4 p-3 bg-[#FFF9E6] border border-[#FFE0A3] rounded-xl">
              <label className="block text-[0.8125rem] font-medium text-[#303150] mb-2 text-right">
                מחיר ליחידה (לא זמין)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={manualPrice}
                  onChange={(e) => setManualPrice(e.target.value)}
                  placeholder="הזן מחיר"
                  className="flex-1 px-4 py-2 text-right rounded-xl border border-[#E8E8ED] focus:border-[#69ADFF] focus:ring-2 focus:ring-[#69ADFF]/20 transition-colors outline-none"
                  style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
                  min="0"
                  step="0.01"
                  dir="ltr"
                />
                <div className="flex rounded-xl overflow-hidden border border-[#E8E8ED]">
                  <button
                    type="button"
                    onClick={() => setManualPriceCurrency('ILS')}
                    className={`px-3 py-2 text-sm font-medium transition-all ${
                      manualPriceCurrency === 'ILS'
                        ? 'bg-[#69ADFF] text-white'
                        : 'bg-white text-[#303150] hover:bg-[#F7F7F8]'
                    }`}
                    style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
                  >
                    ₪
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualPriceCurrency('USD')}
                    className={`px-3 py-2 text-sm font-medium transition-all ${
                      manualPriceCurrency === 'USD'
                        ? 'bg-[#69ADFF] text-white'
                        : 'bg-white text-[#303150] hover:bg-[#F7F7F8]'
                    }`}
                    style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
                  >
                    $
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Price Display Unit Selector */}
          <div className="mb-4">
            <label className="block text-[0.8125rem] font-medium text-[#7E7F90] mb-2 text-right">
              יחידת תצוגת מחיר
            </label>
            <div className="flex gap-2">
              {(['ILS', 'ILS_AGOROT', 'USD'] as PriceDisplayUnit[]).map((unit) => (
              <button
                  key={unit}
                type="button"
                  onClick={() => setPriceDisplayUnit(unit)}
                  className={`flex-1 px-3 py-2.5 text-sm rounded-xl border transition-all font-medium ${
                    priceDisplayUnit === unit
                    ? 'bg-[#69ADFF] text-white border-[#69ADFF]'
                      : 'bg-[#FFFFFF] text-[#303150] border-[#E8E8ED] hover:border-[#69ADFF]'
                }`}
                  style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
              >
                  {unit === 'ILS' ? 'שקל (₪)' : unit === 'ILS_AGOROT' ? 'אגורות' : 'דולר ($)'}
              </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          {effectivePriceILS > 0 && quantity && parseFloat(quantity) > 0 && (
            <p className="text-sm text-[#7E7F90] mb-4 text-right">
              שווי: ₪{(effectivePriceILS * parseFloat(quantity)).toLocaleString('he-IL', { maximumFractionDigits: 0 })}
              {' '}• כמות: {parseFloat(quantity).toFixed(2)} יח'
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-5 py-2.5 text-[#303150] bg-[#F7F7F8] rounded-xl hover:bg-[#E8E8ED] transition-colors font-medium"
              style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
            >
              ביטול
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 px-5 py-2.5 text-white bg-[#69ADFF] rounded-xl hover:bg-[#5A9EE6] transition-all active:scale-95 disabled:opacity-60 font-medium"
              style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
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
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999]"
      />
      <motion.div
        key="delete-modal"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm z-[9999]"
      >
        <div
          className="bg-[#FFFFFF] rounded-3xl overflow-hidden mx-4 p-6 text-center"
          style={{
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            fontFamily: 'var(--font-nunito), system-ui, sans-serif',
          }}
        >
          <div className="w-14 h-14 bg-[#FFC0DB]/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-[#F18AB5]" strokeWidth={1.75} />
          </div>

          <h3 className="text-lg font-semibold text-[#303150] mb-2">מחיקת אחזקה</h3>
          <p className="text-[#7E7F90] mb-6">
            האם למחוק את <span className="font-semibold text-[#303150]">{holding.symbol}</span> מהתיק?
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-5 py-2.5 text-[#303150] bg-[#F7F7F8] rounded-xl hover:bg-[#E8E8ED] transition-colors font-medium"
              style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
            >
              ביטול
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 px-5 py-2.5 text-white bg-[#F18AB5] rounded-xl hover:bg-[#E87AA5] transition-all active:scale-95 disabled:opacity-60 font-medium"
              style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
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
 * Premium Empty State
 */
function EmptyState({ onAddAsset }: { onAddAsset: (data: Parameters<typeof AddAssetButton>[0]['onAddAsset'] extends (data: infer T) => void ? T : never) => void }) {
  return (
    <div
      className="min-h-[60vh] flex items-center justify-center"
      style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
    >
      <div className="flex flex-col items-center gap-6 text-center max-w-md px-6">
        {/* Illustration */}
        <div
          className="w-24 h-24 rounded-3xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(105, 173, 255, 0.1) 0%, rgba(13, 186, 204, 0.1) 100%)',
          }}
        >
          <Wallet className="w-12 h-12 text-[#69ADFF]" strokeWidth={1.5} />
        </div>

        {/* Text */}
        <div>
          <h3 className="text-2xl font-bold text-[#303150] mb-2">התחל לבנות את התיק שלך</h3>
          <p className="text-[0.9375rem] text-[#7E7F90] leading-relaxed">
            הוסף את ההשקעות שלך כדי לקבל ניתוח מקצועי, מעקב ביצועים, ותובנות חכמות לניהול הפורטפוליו.
          </p>
        </div>

        {/* Features */}
        <div className="flex flex-wrap justify-center gap-3 mt-2">
          {['מעקב בזמן אמת', 'ניתוח סיכונים', 'פיזור סקטוריאלי'].map((feature) => (
            <span
              key={feature}
              className="px-3 py-1.5 text-xs font-medium text-[#0DBACC] bg-[#B4F1F1]/30 rounded-lg"
            >
              {feature}
            </span>
          ))}
        </div>

        {/* CTA Button */}
        <button
          onClick={() => {
            // Trigger the AddAssetButton programmatically
            const addBtn = document.querySelector('[data-add-asset-trigger]') as HTMLButtonElement;
            addBtn?.click();
          }}
          className="flex items-center gap-2 px-6 py-3 bg-[#69ADFF] text-white rounded-xl hover:bg-[#5A9EE6] transition-all active:scale-95 font-medium shadow-lg shadow-[#69ADFF]/25"
          style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
        >
          <Plus className="w-5 h-5" strokeWidth={2} />
          <span>הוסף נכס ראשון</span>
        </button>

        {/* Hidden AddAssetButton for dialog */}
        <div className="hidden">
          <AddAssetButton onAddAsset={onAddAsset} exchangeRate={DEFAULT_EXCHANGE_RATE} />
        </div>
      </div>
    </div>
  );
}

/**
 * SmartPortfolio Dashboard
 * Main dashboard component integrating all portfolio analysis features
 * Following Neto Design System - Apple Design Philosophy
 */
// Portfolio history item type
interface PortfolioHistoryItem {
  date: string;
  value: number;
}

export function SmartPortfolio({ className = '' }: SmartPortfolioProps) {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [currency, setCurrency] = useState<Currency>('ILS');
  const [exchangeRate, setExchangeRate] = useState(DEFAULT_EXCHANGE_RATE);
  const [portfolioHistory, setPortfolioHistory] = useState<PortfolioHistoryItem[]>([]);

  // Edit/Delete state
  const [editingHolding, setEditingHolding] = useState<HoldingData | null>(null);
  const [deletingHolding, setDeletingHolding] = useState<HoldingData | null>(null);
  const [isEditingCash, setIsEditingCash] = useState(false);
  
  // Import dialog state
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // Sector filter state
  const [selectedSector, setSelectedSector] = useState<string | null>(null);

  // Fetch portfolio history for chart
  const fetchPortfolioHistory = useCallback(async () => {
    try {
      const response = await fetch('/api/portfolio/history');
      if (response.ok) {
        const historyData = await response.json();
        setPortfolioHistory(historyData);
      }
    } catch (err) {
      console.error('Portfolio history fetch error:', err);
      // Don't set error for history - it's not critical
    }
  }, []);

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
      
      // Update exchange rate from API response
      if (result.exchangeRate) {
        setExchangeRate(result.exchangeRate);
      }
      
      // Also fetch history after portfolio data
      fetchPortfolioHistory();
    } catch (err) {
      console.error('Portfolio fetch error:', err);
      setError(err instanceof Error ? err.message : 'שגיאה בטעינת הנתונים');
    } finally {
      setLoading(false);
    }
  }, [fetchPortfolioHistory]);

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
      const response = await apiFetch('/api/holdings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: assetData.name,
          symbol: assetData.symbol,
          currentValue: assetData.quantity,
          targetAllocation: 0,
          type: 'stock',
          provider: assetData.provider,
          currency: assetData.currency,
          priceDisplayUnit: assetData.priceDisplayUnit,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add asset');
      }

      await fetchPortfolioData();
    } catch (err) {
      console.error('Error adding asset:', err);
      throw err;
    }
  };

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

  const handleDeleteHolding = async (id: string) => {
    const response = await apiFetch(`/api/holdings/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete holding');
    }

    await fetchPortfolioData();
  };

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

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const response = await fetch('/api/portfolio/export');
      
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `portfolio-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      // Could show a toast notification here
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportSuccess = () => {
    setIsImportDialogOpen(false);
    fetchPortfolioData();
  };

  // Sector filter handlers
  const handleSectorClick = (sector: string) => {
    setSelectedSector(prev => prev === sector ? null : sector);
  };

  const handleClearSectorFilter = () => {
    setSelectedSector(null);
  };

  useEffect(() => {
    fetchPortfolioData();
  }, [fetchPortfolioData]);

  // Loading state
  if (loading && !data) {
    return (
      <div
        className={`min-h-[60vh] flex items-center justify-center ${className}`}
        style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(105, 173, 255, 0.1)' }}
          >
            <RefreshCw className="w-8 h-8 text-[#69ADFF] animate-spin" strokeWidth={1.75} />
          </div>
          <p className="text-[#7E7F90] text-[0.9375rem]">טוען נתוני שוק...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !data) {
    return (
      <div
        className={`min-h-[60vh] flex items-center justify-center ${className}`}
        style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
      >
        <div className="flex flex-col items-center gap-4 text-center px-6">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(241, 138, 181, 0.1)' }}
          >
            <AlertCircle className="w-8 h-8 text-[#F18AB5]" strokeWidth={1.75} />
          </div>
          <p className="text-[#7E7F90] text-[0.9375rem]">{error}</p>
          <button
            onClick={fetchPortfolioData}
            className="px-5 py-2.5 bg-[#69ADFF] text-white rounded-xl hover:bg-[#5A9EE6] transition-colors font-medium"
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
      <div className={className}>
        <EmptyState onAddAsset={handleAddAsset} />
        {/* Visible AddAssetButton for empty state */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <AddAssetButton onAddAsset={handleAddAsset} exchangeRate={exchangeRate} />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`space-y-12 pb-12 ${className}`}
      style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
      dir="rtl"
    >
      {/* ============================================
          SECTION 1: תיק השקעות כללי (Portfolio Overview)
          ============================================ */}
      <section>
        <SectionHeader
          title="תיק השקעות כללי"
          subtitle="סיכום התיק והגדרות"
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Portfolio Summary Hero - 8 cols */}
          <div className="lg:col-span-8 h-full">
            <PortfolioSummaryHero
              totalValue={data.equityILS}
              dailyChangeILS={data.dailyChangeILS}
              dailyChangePercent={data.dailyChangePercent}
              cashBalance={data.cashBalance ?? 0}
              cashWeight={data.cashWeight}
              yearlyReturnPercent={8.5} // TODO: Calculate from actual data
              portfolioHistory={portfolioHistory}
              currency={currency}
              exchangeRate={exchangeRate}
            />
          </div>

          {/* Portfolio Settings Card - 4 cols */}
          <div className="lg:col-span-4 h-full">
            <PortfolioSettingsCard
              currency={currency}
              onCurrencyChange={setCurrency}
              exchangeRate={exchangeRate}
              onRefresh={fetchPortfolioData}
              loading={loading || isExporting}
              lastUpdated={lastUpdated}
              onAddAsset={handleAddAsset}
              onImport={() => setIsImportDialogOpen(true)}
              onExport={handleExport}
            />
          </div>
        </div>
      </section>

      {/* ============================================
          SECTION 2: תיק מפורט (Detailed Portfolio)
          ============================================ */}
      <section>
        <SectionHeader
          title="תיק מפורט"
          subtitle="פירוט האחזקות, ניתוח סיכונים ותובנות"
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" style={{ height: '700px' }}>
          {/* Right Column (8 cols) - Holdings Table (includes cash as last row) */}
          <div className="lg:col-span-8 h-full">
            <HoldingsTable
              holdings={data.holdings}
              onEdit={(holding) => setEditingHolding(holding)}
              onDelete={(holding) => setDeletingHolding(holding)}
              selectedSector={selectedSector}
              onClearSectorFilter={handleClearSectorFilter}
              cashBalance={data.cashBalance ?? 0}
              cashWeight={data.cashWeight}
              onEditCash={() => setIsEditingCash(true)}
              className="h-full"
            />
          </div>

          {/* Left Column (4 cols) - Smart Insights Panel */}
          <div className="lg:col-span-4 h-full">
            <SmartInsightsPanel
              beta={data.beta}
              sectorAllocation={data.sectorAllocation}
              onSectorClick={handleSectorClick}
              selectedSector={selectedSector}
            />
          </div>
        </div>
      </section>

      {/* Modals */}
      {editingHolding && (
        <EditHoldingModal
          holding={editingHolding}
          onClose={() => setEditingHolding(null)}
          onSave={handleEditHolding}
          exchangeRate={exchangeRate}
        />
      )}

      {isEditingCash && (
        <EditCashModal
          currentCash={data.cashBalance ?? 0}
          onClose={() => setIsEditingCash(false)}
          onSave={handleUpdateCash}
        />
      )}

      {deletingHolding && (
        <DeleteConfirmModal
          holding={deletingHolding}
          onClose={() => setDeletingHolding(null)}
          onConfirm={handleDeleteHolding}
        />
      )}

      {/* Import Dialog */}
      <ImportPortfolioDialog
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        onSuccess={handleImportSuccess}
      />
    </div>
  );
}
