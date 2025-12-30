'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Command } from 'cmdk';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, AlertTriangle, TrendingUp, Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/utils';

interface SearchResult {
  symbol: string;
  name: string;
  exchange?: string;
  type?: string;
  price: number;
  currency: string;
  changePercent: number;
  logo?: string | null;
}

interface QuoteData {
  symbol: string;
  name: string;
  price: number;
  currency: string;
  changePercent: number;
  beta: number;
  sector: string;
}

interface AddAssetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAsset: (data: { symbol: string; name: string; quantity: number; price: number }) => void;
}

type FlowStep = 'search' | 'quantity';

export function AddAssetDialog({ isOpen, onClose, onAddAsset }: AddAssetDialogProps) {
  const [step, setStep] = useState<FlowStep>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedStock, setSelectedStock] = useState<SearchResult | null>(null);
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
  const [quantity, setQuantity] = useState('');
  const [quantityError, setQuantityError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const quantityInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    }
  }, [isOpen]);

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
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-50"
          >
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mx-4">
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
                      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
                        <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
                        <Command.Input
                          value={searchQuery}
                          onValueChange={setSearchQuery}
                          placeholder="חפש מניה או ETF..."
                          className="flex-1 text-base bg-transparent outline-none placeholder:text-slate-400 text-right"
                          dir="rtl"
                          autoFocus
                        />
                        {isSearching && (
                          <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                        )}
                        <button
                          onClick={onClose}
                          className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          <X className="w-5 h-5 text-slate-400" />
                        </button>
                      </div>

                      {/* Results */}
                      <Command.List className="max-h-80 overflow-y-auto p-2">
                        {searchQuery.length > 0 && searchResults.length === 0 && !isSearching && (
                          <Command.Empty className="py-8 text-center text-slate-400">
                            לא נמצאו תוצאות
                          </Command.Empty>
                        )}

                        {searchResults.map((result) => (
                          <Command.Item
                            key={result.symbol}
                            value={result.symbol}
                            onSelect={() => handleSelectStock(result)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors data-[selected=true]:bg-slate-100"
                          >
                            {/* Logo */}
                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
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
                                <TrendingUp className="w-5 h-5 text-slate-400" />
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0 text-right">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-900">{result.symbol}</span>
                                {result.exchange && (
                                  <span className="text-xs text-slate-400">{result.exchange}</span>
                                )}
                              </div>
                              <p className="text-sm text-slate-500 truncate">{result.name}</p>
                            </div>

                            {/* Price */}
                            {result.price > 0 && (
                              <div className="text-left flex-shrink-0">
                                <p className="font-medium text-slate-900">
                                  {formatPrice(result.price, result.currency)}
                                </p>
                                <p className={`text-xs ${result.changePercent >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                  {result.changePercent >= 0 ? '+' : ''}{result.changePercent.toFixed(2)}%
                                </p>
                              </div>
                            )}
                          </Command.Item>
                        ))}
                      </Command.List>

                      {/* Helper */}
                      <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-400 text-center">
                        הקלד סימבול מניה (למשל AAPL) או שם חברה
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
                        className="text-sm text-indigo-600 hover:text-indigo-700 transition-colors"
                      >
                        ← חזרה לחיפוש
                      </button>
                      <button
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <X className="w-5 h-5 text-slate-400" />
                      </button>
                    </div>

                    {/* Selected Stock Token */}
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl mb-4">
                      <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-indigo-500" />
                      </div>
                      <div className="flex-1 text-right">
                        <p className="font-bold text-slate-900">{selectedStock.symbol}</p>
                        <p className="text-sm text-slate-500 truncate">{selectedStock.name}</p>
                      </div>
                      {quoteData && (
                        <div className="text-left">
                          <p className="font-semibold text-slate-900">
                            {formatPrice(quoteData.price, quoteData.currency)}
                          </p>
                          <p className={`text-xs ${quoteData.changePercent >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                            {quoteData.changePercent >= 0 ? '+' : ''}{quoteData.changePercent.toFixed(2)}%
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Beta Warning */}
                    {quoteData && quoteData.beta > 1.2 && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg mb-4 text-right">
                        <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        <span className="text-sm text-amber-700">
                          נכס תנודתי גבוה (Beta: {quoteData.beta.toFixed(2)})
                        </span>
                      </div>
                    )}

                    {/* Quantity Input */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-slate-700 mb-2 text-right">
                        כמות יחידות
                      </label>
                      <input
                        ref={quantityInputRef}
                        type="number"
                        value={quantity}
                        onChange={(e) => {
                          setQuantity(e.target.value);
                          setQuantityError('');
                        }}
                        placeholder="0"
                        className={`w-full px-4 py-3 text-lg text-right rounded-xl border transition-colors outline-none ${
                          quantityError
                            ? 'border-rose-300 bg-rose-50 focus:border-rose-500'
                            : 'border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                        }`}
                        min="0"
                        step="0.01"
                        dir="ltr"
                      />
                      {quantityError && (
                        <p className="mt-1 text-sm text-rose-500 text-right">{quantityError}</p>
                      )}
                    </div>

                    {/* Live Price Helper */}
                    {quoteData && (
                      <p className="text-sm text-slate-500 mb-4 text-right">
                        מחיר אחרון: {formatPrice(quoteData.price, quoteData.currency)}
                        {quantity && parseFloat(quantity) > 0 && (
                          <span className="text-slate-400">
                            {' '}• שווי משוער: {formatPrice(quoteData.price * parseFloat(quantity), quoteData.currency)}
                          </span>
                        )}
                      </p>
                    )}

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
                        disabled={isSaving || !quantity}
                        className="flex-1 px-4 py-3 text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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
