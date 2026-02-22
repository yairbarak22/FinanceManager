'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Command } from 'cmdk';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, AlertTriangle, TrendingUp, Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/utils';

interface SearchResult {
  symbol: string;
  name: string;
  nameHe?: string; // Hebrew name from enrichment
  exchange?: string;
  type?: string;
  provider: 'YAHOO' | 'EOD';
  price: number;
  priceILS: number;
  currency: string;
  changePercent: number;
  beta?: number;
  sector?: string;
  sectorHe?: string; // Hebrew sector from enrichment
  isEnriched?: boolean; // Whether result came from local enrichment DB
  logo?: string | null;
}

// Helper to get country info from symbol exchange suffix
const getCountryInfo = (symbol: string): { flag: string; label: string; isIsraeli: boolean } => {
  const upperSymbol = symbol.toUpperCase();

  // Israeli stocks (.TA or 6-9 digit security number)
  if (upperSymbol.endsWith('.TA') || /^\d{6,9}$/.test(symbol.split('.')[0])) {
    return { flag: '🇮🇱', label: 'ת"א', isIsraeli: true };
  }

  // US stocks
  if (upperSymbol.endsWith('.US') || !upperSymbol.includes('.')) {
    return { flag: '🇺🇸', label: 'US', isIsraeli: false };
  }

  // Extract exchange suffix
  const parts = upperSymbol.split('.');
  const exchange = parts[parts.length - 1];

  // Country mapping
  const countryMap: Record<string, { flag: string; label: string }> = {
    'VN': { flag: '🇻🇳', label: 'VN' },
    'HK': { flag: '🇭🇰', label: 'HK' },
    'LSE': { flag: '🇬🇧', label: 'UK' },
    'L': { flag: '🇬🇧', label: 'UK' },
    'PA': { flag: '🇫🇷', label: 'FR' },
    'DE': { flag: '🇩🇪', label: 'DE' },
    'F': { flag: '🇩🇪', label: 'DE' },
    'TO': { flag: '🇨🇦', label: 'CA' },
    'V': { flag: '🇨🇦', label: 'CA' },
    'AS': { flag: '🇳🇱', label: 'NL' },
    'SW': { flag: '🇨🇭', label: 'CH' },
    'AU': { flag: '🇦🇺', label: 'AU' },
    'SG': { flag: '🇸🇬', label: 'SG' },
    'KS': { flag: '🇰🇷', label: 'KR' },
    'T': { flag: '🇯🇵', label: 'JP' },
    'SS': { flag: '🇨🇳', label: 'CN' },
    'SZ': { flag: '🇨🇳', label: 'CN' },
    'CC': { flag: '🪙', label: 'Crypto' },
    'INDX': { flag: '📊', label: 'Index' },
    'FOREX': { flag: '💱', label: 'FX' },
  };

  const country = countryMap[exchange];
  if (country) {
    return { ...country, isIsraeli: false };
  }

  // Default: show exchange code
  return { flag: '🌐', label: exchange, isIsraeli: false };
};

interface QuoteData {
  symbol: string;
  name: string;
  price: number;
  priceILS: number;
  currency: string;
  changePercent: number;
  beta: number;
  sector: string;
  provider: 'YAHOO' | 'EOD';
}

type PriceDisplayUnit = 'ILS' | 'ILS_AGOROT' | 'USD';

interface AddAssetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAsset: (data: {
    symbol: string;
    name: string;
    quantity: number;
    price: number;
    priceILS: number;
    provider: 'YAHOO' | 'EOD';
    currency: string;
    priceDisplayUnit: PriceDisplayUnit;
  }) => void;
  /** Exchange rate USD/ILS for value calculations */
  exchangeRate?: number;
}

type ValueCurrency = 'ILS' | 'USD';

type FlowStep = 'search' | 'quantity';

const DEFAULT_EXCHANGE_RATE = 3.65;

export function AddAssetDialog({ isOpen, onClose, onAddAsset, exchangeRate = DEFAULT_EXCHANGE_RATE }: AddAssetDialogProps) {
  const [step, setStep] = useState<FlowStep>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedStock, setSelectedStock] = useState<SearchResult | null>(null);
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
  const [quantity, setQuantity] = useState('');
  const [quantityError, setQuantityError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [priceDisplayUnit, setPriceDisplayUnit] = useState<PriceDisplayUnit>('ILS');
  
  // Value-based input states
  const [value, setValue] = useState('');
  const [valueCurrency, setValueCurrency] = useState<ValueCurrency>('ILS');
  const [manualPrice, setManualPrice] = useState('');
  const [manualPriceCurrency, setManualPriceCurrency] = useState<ValueCurrency>('ILS');
  const [lastEditedField, setLastEditedField] = useState<'quantity' | 'value' | null>(null);

  const quantityInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Calculate effective price (from quote or manual input)
  const effectivePriceILS = manualPrice && parseFloat(manualPrice) > 0
    ? (manualPriceCurrency === 'ILS' 
        ? parseFloat(manualPrice) 
        : parseFloat(manualPrice) * exchangeRate)
    : quoteData?.priceILS || selectedStock?.priceILS || 0;
    
  const effectivePriceUSD = manualPrice && parseFloat(manualPrice) > 0
    ? (manualPriceCurrency === 'USD' 
        ? parseFloat(manualPrice) 
        : parseFloat(manualPrice) / exchangeRate)
    : quoteData?.price || selectedStock?.price || 0;

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('search');
      setSearchQuery('');
      setSearchResults([]);
      setSelectedStock(null);
      setQuoteData(null);
      setQuantity('');
      setQuantityError('');
      setPriceDisplayUnit('ILS');
      setValue('');
      setValueCurrency('ILS');
      setManualPrice('');
      setManualPriceCurrency('ILS');
      setLastEditedField(null);
    }
  }, [isOpen]);

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
        // Round to 4 decimal places for quantity
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

  // Debounced search
  const handleSearch = useCallback(async (query: string) => {
    if (query.length < 1) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await apiFetch(`/api/finance/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results || []);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounce search input
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, handleSearch]);

  // Fetch detailed quote when stock is selected
  const handleSelectStock = async (stock: SearchResult) => {
    setSelectedStock(stock);
    setStep('quantity');

    // Fetch detailed quote with beta
    try {
      const res = await apiFetch(`/api/finance/quote?symbol=${encodeURIComponent(stock.symbol)}`);
      if (res.ok) {
        const data = await res.json();
        setQuoteData(data);
      }
    } catch (error) {
      console.error('Quote fetch error:', error);
    }

    // Focus quantity input after transition
    setTimeout(() => {
      quantityInputRef.current?.focus();
    }, 100);
  };

  // Handle save
  const handleSave = async () => {
    if (!selectedStock) return;

    const qty = parseFloat(quantity);
    if (!qty || qty <= 0) {
      setQuantityError('נא להזין כמות תקינה');
      return;
    }

    setIsSaving(true);
    try {
      await onAddAsset({
        symbol: selectedStock.symbol,
        name: selectedStock.name,
        quantity: qty,
        price: quoteData?.price ?? selectedStock.price,
        priceILS: quoteData?.priceILS ?? selectedStock.priceILS,
        provider: selectedStock.provider,
        currency: selectedStock.currency,
        priceDisplayUnit,
      });
      onClose();
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle back to search
  const handleBack = () => {
    setStep('search');
    setSelectedStock(null);
    setQuoteData(null);
    setQuantity('');
    setQuantityError('');
    setPriceDisplayUnit('ILS');
    setValue('');
    setValueCurrency('ILS');
    setManualPrice('');
    setManualPriceCurrency('ILS');
    setLastEditedField(null);
  };

  // Format currency
  const formatPrice = (price: number, currency: string) => {
    const symbol = currency === 'ILS' ? '₪' : '$';
    return `${symbol}${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-50"
          >
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mx-4">
              {/* Search Step */}
              <AnimatePresence mode="wait">
                {step === 'search' && (
                  <motion.div
                    key="search"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <Command className="w-full" shouldFilter={false}>
                      {/* Search Input */}
                      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#F7F7F8]">
                        <Search className="w-5 h-5 text-[#BDBDCB] flex-shrink-0" />
                        <Command.Input
                          value={searchQuery}
                          onValueChange={setSearchQuery}
                          placeholder="חפש מניה או ETF..."
                          className="flex-1 text-base bg-transparent outline-none placeholder:text-[#BDBDCB] text-right"
                          dir="rtl"
                          autoFocus
                        />
                        {isSearching && (
                          <Loader2 className="w-4 h-4 text-[#BDBDCB] animate-spin" />
                        )}
                        <button
                          onClick={onClose}
                          className="p-1 rounded-lg hover:bg-[#F7F7F8] transition-colors"
                        >
                          <X className="w-5 h-5 text-[#BDBDCB]" />
                        </button>
                      </div>

                      {/* Results */}
                      <Command.List className="max-h-80 overflow-y-auto p-2">
                        {searchQuery.length > 0 && searchResults.length === 0 && !isSearching && (
                          <Command.Empty className="py-8 text-center text-[#BDBDCB]">
                            לא נמצאו תוצאות
                          </Command.Empty>
                        )}

                        {searchResults.map((result, index) => {
                          const countryInfo = getCountryInfo(result.symbol);
                          const displayName = result.nameHe || result.name;
                          const isHebrew = !!result.nameHe;
                          
                          return (
                            <motion.div
                              key={result.symbol}
                              initial={{ opacity: 0, y: isHebrew ? -10 : 0 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: isHebrew ? index * 0.05 : 0 }}
                            >
                              <Command.Item
                                value={result.symbol}
                                onSelect={() => handleSelectStock(result)}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-[#F7F7F8] transition-colors data-[selected=true]:bg-[#F7F7F8]"
                                dir="ltr"
                              >
                                {/* Logo / Flag Badge */}
                                <div className="w-10 h-10 rounded-xl bg-[#F7F7F8] flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                                  {result.logo ? (
                                    <img
                                      src={result.logo}
                                      alt={result.symbol}
                                      className="w-6 h-6 object-contain"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <span className="text-lg">{countryInfo.flag}</span>
                                  )}
                                </div>

                                {/* Price */}
                                {result.priceILS > 0 && (
                                  <div className="text-left flex-shrink-0">
                                    <p className="font-medium text-[#303150]">
                                      ₪{result.priceILS.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                    <p className={`text-xs ${result.changePercent >= 0 ? 'text-[#0DBACC]' : 'text-[#F18AB5]'}`} dir="ltr">
                                      {result.changePercent >= 0 ? '+' : ''}{result.changePercent.toFixed(2)}%
                                    </p>
                                  </div>
                                )}

                                {/* Info */}
                                <div className="flex-1 min-w-0 text-right">
                                  <div className="flex items-center gap-2 justify-end">
                                    <span className="font-semibold text-[#303150]">{result.symbol}</span>
                                    {!countryInfo.isIsraeli && (
                                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#F7F7F8] text-[#7E7F90]">
                                        {countryInfo.label}
                                      </span>
                                    )}
                                  </div>
                                  <p className={`text-sm text-[#7E7F90] truncate ${isHebrew ? 'font-medium' : ''}`} dir={isHebrew ? 'rtl' : 'ltr'}>
                                    {displayName}
                                  </p>
                                </div>
                              </Command.Item>
                            </motion.div>
                          );
                        })}
                      </Command.List>

                      {/* Helper */}
                      <div className="px-4 py-3 border-t border-[#F7F7F8] text-xs text-[#BDBDCB] text-center">
                        חפש מניות אמריקאיות (AAPL) או ישראליות (מספר ני"ע)
                      </div>
                    </Command>
                  </motion.div>
                )}

                {/* Quantity Step */}
                {step === 'quantity' && selectedStock && (
                  <motion.div
                    key="quantity"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="p-4"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={handleBack}
                        className="text-sm text-[#69ADFF] hover:text-[#69ADFF]/90 transition-colors"
                      >
                        ← חזרה לחיפוש
                      </button>
                      <button
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-[#F7F7F8] transition-colors"
                      >
                        <X className="w-5 h-5 text-[#BDBDCB]" />
                      </button>
                    </div>

                    {/* Selected Stock Token */}
                    {(() => {
                      const countryInfo = getCountryInfo(selectedStock.symbol);
                      return (
                        <div className="flex items-center gap-3 p-3 bg-[#F7F7F8] rounded-xl mb-4" dir="ltr">
                          <div className="w-12 h-12 rounded-xl bg-white border border-[#E8E8ED] flex items-center justify-center flex-shrink-0">
                            <span className="text-2xl">{countryInfo.flag}</span>
                          </div>
                          {quoteData && (
                            <div className="text-left flex-shrink-0">
                              <p className="font-semibold text-[#303150]">
                                ₪{quoteData.priceILS.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </p>
                              <p className={`text-xs ${quoteData.changePercent >= 0 ? 'text-[#0DBACC]' : 'text-[#F18AB5]'}`} dir="ltr">
                                {quoteData.changePercent >= 0 ? '+' : ''}{quoteData.changePercent.toFixed(2)}%
                              </p>
                            </div>
                          )}
                          <div className="flex-1 text-right">
                            <div className="flex items-center gap-2 justify-end">
                              <p className="font-bold text-[#303150]">{selectedStock.symbol}</p>
                              {!countryInfo.isIsraeli && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#F7F7F8] text-[#7E7F90]">
                                  {countryInfo.label}
                                </span>
                              )}
                            </div>
                            <p className={`text-sm text-[#7E7F90] truncate ${selectedStock.nameHe ? 'font-medium' : ''}`} dir={selectedStock.nameHe ? 'rtl' : 'ltr'}>
                              {selectedStock.nameHe || selectedStock.name}
                            </p>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Beta Warning */}
                    {quoteData && quoteData.beta > 1.2 && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-[#FFE5B4]/30 border border-[#FFB84D]/50 rounded-xl mb-4 text-right">
                        <AlertTriangle className="w-4 h-4 text-[#FFB84D] flex-shrink-0" />
                        <span className="text-sm text-[#303150]">
                          נכס תנודתי גבוה (Beta: {quoteData.beta.toFixed(2)})
                        </span>
                      </div>
                    )}

                    {/* Quantity Input */}
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-[#303150] mb-2 text-right">
                        כמות יחידות
                      </label>
                      <input
                        ref={quantityInputRef}
                        type="number"
                        value={quantity}
                        onChange={(e) => {
                          setQuantity(e.target.value);
                          setQuantityError('');
                          setLastEditedField('quantity');
                        }}
                        placeholder="0"
                        className={`w-full px-4 py-3 text-lg text-right rounded-xl border transition-colors outline-none ${
                          quantityError
                            ? 'border-rose-300 bg-rose-50 focus:border-rose-500'
                            : 'border-[#E8E8ED] focus:border-[#69ADFF] focus:ring-2 focus:ring-[#69ADFF]/20'
                        }`}
                        min="0"
                        step="0.01"
                        dir="ltr"
                      />
                      {quantityError && (
                        <p className="mt-1 text-sm text-rose-500 text-right">{quantityError}</p>
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
                      <label className="block text-sm font-medium text-[#303150] mb-2 text-right">
                        שווי (₪)
                      </label>
                      <input
                        type="number"
                        value={value}
                        onChange={(e) => {
                          setValue(e.target.value);
                          setQuantityError('');
                          setLastEditedField('value');
                        }}
                        placeholder="0"
                        className="w-full px-4 py-3 text-lg text-right rounded-xl border border-[#E8E8ED] focus:border-[#69ADFF] focus:ring-2 focus:ring-[#69ADFF]/20 transition-colors outline-none"
                        min="0"
                        step="0.01"
                        dir="ltr"
                      />
                    </div>

                    {/* Manual Price Input (when quote not available) */}
                    {!quoteData && !selectedStock?.priceILS && (
                      <div className="mb-4 p-3 bg-[#FFF9E6] border border-[#FFE0A3] rounded-xl">
                        <label className="block text-sm font-medium text-[#303150] mb-2 text-right">
                          מחיר ליחידה (לא זמין מהשוק)
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={manualPrice}
                            onChange={(e) => setManualPrice(e.target.value)}
                            placeholder="הזן מחיר"
                            className="flex-1 px-4 py-2 text-right rounded-xl border border-[#E8E8ED] focus:border-[#69ADFF] focus:ring-2 focus:ring-[#69ADFF]/20 transition-colors outline-none"
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
                            >
                              $
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

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

                    {/* Live Price Helper */}
                    {effectivePriceILS > 0 && (
                      <p className="text-sm text-[#7E7F90] mb-4 text-right">
                        מחיר: ₪{effectivePriceILS.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        {quantity && parseFloat(quantity) > 0 && (
                          <span className="text-[#BDBDCB]">
                            {' '}• שווי: ₪{(effectivePriceILS * parseFloat(quantity)).toLocaleString('he-IL', { maximumFractionDigits: 0 })}
                          </span>
                        )}
                        {value && parseFloat(value) > 0 && quantity && parseFloat(quantity) > 0 && (
                          <span className="text-[#BDBDCB]">
                            {' '}• כמות: {parseFloat(quantity).toFixed(2)} יח'
                          </span>
                        )}
                      </p>
                    )}

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
                        disabled={isSaving || !quantity}
                        className="flex-1 px-4 py-3 text-white bg-[#303150] rounded-xl hover:bg-[#303150]/90 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSaving ? (
                          <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                        ) : (
                          'הוסף לתיק'
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
