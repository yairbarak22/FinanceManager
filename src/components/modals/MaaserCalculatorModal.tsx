'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Loader2, ChevronDown, ChevronUp, Calculator, RefreshCw, Link2, Plus, Trash2 } from 'lucide-react';
import { Transaction, RecurringTransaction, CustomCategory, MaaserExpenseOffset } from '@/lib/types';
import { formatCurrency, apiFetch } from '@/lib/utils';
import {
  CalculationType,
  calculateObligation,
  calculateBalance,
  getMonthlyIncomes,
  getMonthlyDonationTransactions,
  getMonthlyDonationsTotal,
  getActiveRecurringIncomes,
  getActiveRecurringDonationTransactions,
  getActiveRecurringDonationsTotal,
  getHebrewMonthName,
  getCalculationLabel,
  getCalculationPercentageLabel,
  buildOffsetMap,
  getMonthlyExpensesByCategory,
  calculateObligatedIncomeWithOffsets,
  OffsetSummaryItem,
  calculateOffsetSummary,
} from '@/lib/maaserCalculations';
import {
  getCategoryInfo,
  expenseCategories,
  harediExpenseCategories,
  CategoryInfo,
  customCategoryToInfo,
} from '@/lib/categories';
import StyledSelect from '@/components/ui/StyledSelect';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { SensitiveData } from '@/components/common/SensitiveData';

interface MaaserPreference {
  id: string;
  incomeSource: string;
  incomeCategory?: string | null;
  isObligated: boolean;
  calculationType: string;
}

interface IncomeItem {
  key: string;
  description: string;
  amount: number;
  category: string;
  isRecurring: boolean;
}

interface MaaserCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  recurringTransactions: RecurringTransaction[];
  selectedMonth: string;
  customCategories?: CustomCategory[];
}

function getCategoryDisplayName(
  categoryId: string,
  type: 'income' | 'expense',
  customCats?: CustomCategory[]
): string {
  const customCatInfos = customCats?.map((c) => customCategoryToInfo(c)) ?? [];
  const info = getCategoryInfo(categoryId, type, customCatInfos);
  return info?.nameHe ?? categoryId;
}

export default function MaaserCalculatorModal({
  isOpen,
  onClose,
  transactions,
  recurringTransactions,
  selectedMonth,
  customCategories,
}: MaaserCalculatorModalProps) {
  const [calculationType, setCalculationType] = useState<CalculationType>('maaser');
  const [incomeToggles, setIncomeToggles] = useState<Map<string, boolean>>(new Map());
  const [preferences, setPreferences] = useState<MaaserPreference[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDonationDetails, setShowDonationDetails] = useState(false);

  // Offset state
  const [offsets, setOffsets] = useState<MaaserExpenseOffset[]>([]);
  const [showOffsetSection, setShowOffsetSection] = useState(false);
  const [newOffsetIncome, setNewOffsetIncome] = useState('');
  const [newOffsetExpense, setNewOffsetExpense] = useState('');

  const { containerRef, handleKeyDown } = useFocusTrap<HTMLDivElement>(isOpen, {
    onEscape: onClose,
  });

  const monthlyIncomes = useMemo(
    () => getMonthlyIncomes(transactions, selectedMonth, customCategories),
    [transactions, selectedMonth, customCategories]
  );

  const activeRecurringIncomes = useMemo(
    () => getActiveRecurringIncomes(recurringTransactions, selectedMonth),
    [recurringTransactions, selectedMonth]
  );

  const allIncomeItems: IncomeItem[] = useMemo(() => {
    const items: IncomeItem[] = [];
    activeRecurringIncomes.forEach((rt) => {
      items.push({
        key: `recurring:${rt.name}`,
        description: rt.name,
        amount: rt.amount,
        category: rt.category,
        isRecurring: true,
      });
    });
    monthlyIncomes.forEach((tx) => {
      items.push({
        key: `tx:${tx.description}`,
        description: tx.description,
        amount: tx.amount,
        category: tx.category,
        isRecurring: false,
      });
    });
    return items;
  }, [activeRecurringIncomes, monthlyIncomes]);

  const donationTransactions = useMemo(
    () => getMonthlyDonationTransactions(transactions, selectedMonth, customCategories),
    [transactions, selectedMonth, customCategories]
  );

  const recurringDonationTransactions = useMemo(
    () => getActiveRecurringDonationTransactions(recurringTransactions, selectedMonth),
    [recurringTransactions, selectedMonth]
  );

  const totalDonationsPaid = useMemo(() => {
    const oneTime = getMonthlyDonationsTotal(transactions, selectedMonth, customCategories);
    const recurring = getActiveRecurringDonationsTotal(recurringTransactions, selectedMonth);
    return oneTime + recurring;
  }, [transactions, recurringTransactions, selectedMonth, customCategories]);

  const hasDonationDetails =
    donationTransactions.length > 0 || recurringDonationTransactions.length > 0;

  // Offset calculations
  const offsetMap = useMemo(() => buildOffsetMap(offsets), [offsets]);

  const expenseByCategory = useMemo(
    () => getMonthlyExpensesByCategory(transactions, recurringTransactions, selectedMonth),
    [transactions, recurringTransactions, selectedMonth]
  );

  // Available income categories (from actual transactions this month)
  const availableIncomeCategories = useMemo(() => {
    const cats = new Set<string>();
    allIncomeItems.forEach((item) => cats.add(item.category));
    return Array.from(cats);
  }, [allIncomeItems]);

  // Available expense categories (all built-in + custom, excluding maaser/donation)
  const availableExpenseCategories = useMemo(() => {
    const builtIn: CategoryInfo[] = [
      ...expenseCategories,
      ...harediExpenseCategories.filter((c) => c.id !== 'maaser' && c.id !== 'donation'),
    ];
    const customExpCats = customCategories
      ?.filter((c) => c.type === 'expense' && !c.isMaaserEligible)
      .map((c) => customCategoryToInfo(c)) ?? [];
    return [...builtIn, ...customExpCats];
  }, [customCategories]);

  // Expense categories already used in an offset
  const usedExpenseCategories = useMemo(() => {
    return new Set(offsets.map((o) => o.expenseCategory));
  }, [offsets]);

  // Offset summary for display
  const offsetSummary: OffsetSummaryItem[] = useMemo(() => {
    if (offsets.length === 0) return [];
    const incomeByCat = new Map<string, number>();
    allIncomeItems.forEach((item) => {
      if (incomeToggles.get(item.key) === false) return;
      incomeByCat.set(item.category, (incomeByCat.get(item.category) ?? 0) + item.amount);
    });
    return calculateOffsetSummary(incomeByCat, expenseByCategory, offsetMap);
  }, [allIncomeItems, incomeToggles, expenseByCategory, offsetMap, offsets.length]);

  // Calculate obligated income with offsets
  const { total: obligatedIncomeTotal, totalOffset } = useMemo(() => {
    if (offsets.length === 0) {
      let total = 0;
      allIncomeItems.forEach((item) => {
        if (incomeToggles.get(item.key) !== false) total += item.amount;
      });
      return { total, totalOffset: 0 };
    }
    return calculateObligatedIncomeWithOffsets(allIncomeItems, incomeToggles, offsetMap, expenseByCategory);
  }, [allIncomeItems, incomeToggles, offsets.length, offsetMap, expenseByCategory]);

  const obligation = useMemo(
    () => calculateObligation(obligatedIncomeTotal, calculationType),
    [obligatedIncomeTotal, calculationType]
  );

  const balance = useMemo(
    () => calculateBalance(obligation, totalDonationsPaid),
    [obligation, totalDonationsPaid]
  );

  // Fetch preferences + offsets
  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [prefsRes, offsetsRes] = await Promise.all([
          apiFetch('/api/maaser-preferences'),
          apiFetch('/api/maaser-offsets'),
        ]);

        if (prefsRes.ok) {
          const data: MaaserPreference[] = await prefsRes.json();
          setPreferences(data);
          const firstWithType = data.find((p) => p.calculationType);
          if (firstWithType) {
            setCalculationType(firstWithType.calculationType as CalculationType);
          }
          const toggleMap = new Map<string, boolean>();
          allIncomeItems.forEach((item) => {
            const pref =
              data.find((p) => p.incomeSource === item.description) ||
              data.find((p) => p.incomeCategory === item.category);
            toggleMap.set(item.key, pref ? pref.isObligated : true);
          });
          setIncomeToggles(toggleMap);
        }

        if (offsetsRes.ok) {
          const offsetData: MaaserExpenseOffset[] = await offsetsRes.json();
          setOffsets(offsetData);
          if (offsetData.length > 0) setShowOffsetSection(true);
        }
      } catch (err) {
        console.error('Error fetching maaser data:', err);
        const toggleMap = new Map<string, boolean>();
        allIncomeItems.forEach((item) => toggleMap.set(item.key, true));
        setIncomeToggles(toggleMap);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isOpen, allIncomeItems]);

  const handleToggleIncome = useCallback((key: string) => {
    setIncomeToggles((prev) => {
      const next = new Map(prev);
      next.set(key, !prev.get(key));
      return next;
    });
  }, []);

  const handleAddOffset = useCallback(() => {
    if (!newOffsetIncome || !newOffsetExpense) return;
    if (usedExpenseCategories.has(newOffsetExpense)) return;

    setOffsets((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}`,
        incomeCategory: newOffsetIncome,
        expenseCategory: newOffsetExpense,
      },
    ]);
    setNewOffsetExpense('');
  }, [newOffsetIncome, newOffsetExpense, usedExpenseCategories]);

  const handleRemoveOffset = useCallback((incCat: string, expCat: string) => {
    setOffsets((prev) =>
      prev.filter((o) => !(o.incomeCategory === incCat && o.expenseCategory === expCat))
    );
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const prefsToSave = allIncomeItems.map((item) => ({
        incomeSource: item.description,
        incomeCategory: item.category,
        isObligated: incomeToggles.get(item.key) !== false,
        calculationType,
      }));

      const offsetsToSave = offsets.map((o) => ({
        incomeCategory: o.incomeCategory,
        expenseCategory: o.expenseCategory,
      }));

      await Promise.all([
        apiFetch('/api/maaser-preferences', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ preferences: prefsToSave }),
        }),
        apiFetch('/api/maaser-offsets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ offsets: offsetsToSave }),
        }),
      ]);

      onClose();
    } catch (err) {
      console.error('Error saving maaser data:', err);
    } finally {
      setIsSaving(false);
    }
  }, [allIncomeItems, incomeToggles, calculationType, offsets, onClose]);

  if (!isOpen) return null;

  const monthLabel = getHebrewMonthName(selectedMonth);
  const fontFamily = 'var(--font-nunito), system-ui, sans-serif';

  // Group offsets by income category for display
  const offsetsByIncome = new Map<string, string[]>();
  offsets.forEach((o) => {
    const arr = offsetsByIncome.get(o.incomeCategory) ?? [];
    arr.push(o.expenseCategory);
    offsetsByIncome.set(o.incomeCategory, arr);
  });

  return (
    <div
      className="modal-overlay"
      onClick={() => !isSaving && onClose()}
      role="presentation"
    >
      <div
        ref={containerRef}
        className="modal-content animate-scale-in"
        style={{ maxWidth: '32rem' }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-modal="true"
        aria-labelledby="maaser-modal-title"
      >
        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(105, 173, 255, 0.1)' }}
            >
              <Calculator
                className="w-5 h-5"
                style={{ color: '#69ADFF' }}
                strokeWidth={1.75}
              />
            </div>
            <div>
              <h2
                id="maaser-modal-title"
                className="text-xl font-bold"
                style={{ color: '#303150', fontFamily }}
              >
                חישוב {getCalculationLabel(calculationType)}
              </h2>
              <p className="text-xs" style={{ color: '#7E7F90' }}>
                {monthLabel}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-icon"
            aria-label="סגור חלון"
            disabled={isSaving}
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#69ADFF' }} />
            </div>
          ) : (
            <>
              {/* Section 1: Calculation Type */}
              <div>
                <label
                  className="text-sm font-medium mb-2 block"
                  style={{ color: '#7E7F90', fontFamily }}
                >
                  סוג חישוב
                </label>
                <div className="grid grid-cols-2 gap-2" role="group" aria-label="סוג חישוב">
                  <button
                    type="button"
                    onClick={() => setCalculationType('maaser')}
                    aria-pressed={calculationType === 'maaser'}
                    className="py-3 px-4 rounded-xl font-medium transition-all"
                    style={{
                      backgroundColor: calculationType === 'maaser' ? '#69ADFF' : '#F7F7F8',
                      color: calculationType === 'maaser' ? '#FFFFFF' : '#7E7F90',
                      fontFamily,
                    }}
                  >
                    מעשרות (10%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalculationType('chomesh')}
                    aria-pressed={calculationType === 'chomesh'}
                    className="py-3 px-4 rounded-xl font-medium transition-all"
                    style={{
                      backgroundColor: calculationType === 'chomesh' ? '#69ADFF' : '#F7F7F8',
                      color: calculationType === 'chomesh' ? '#FFFFFF' : '#7E7F90',
                      fontFamily,
                    }}
                  >
                    חומש (20%)
                  </button>
                </div>
              </div>

              {/* Section 2: Income Selection */}
              <div>
                <label
                  className="text-sm font-medium mb-2 block"
                  style={{ color: '#7E7F90', fontFamily }}
                >
                  הכנסות החודש
                </label>

                {allIncomeItems.length === 0 ? (
                  <div className="text-center py-6 rounded-xl" style={{ background: '#F7F7F8' }}>
                    <p className="text-sm" style={{ color: '#7E7F90' }}>
                      לא נמצאו הכנסות בחודש זה
                    </p>
                  </div>
                ) : (
                  <div
                    className="rounded-xl overflow-hidden"
                    style={{ border: '1px solid #F7F7F8' }}
                  >
                    {allIncomeItems.map((item, index) => {
                      const isObligated = incomeToggles.get(item.key) !== false;
                      const itemOffsetSummary = offsetSummary.find(
                        (s) => s.incomeCategory === item.category
                      );
                      const hasOffset = itemOffsetSummary && itemOffsetSummary.offsetExpenses > 0;

                      return (
                        <div
                          key={item.key}
                          className="p-3 transition-colors"
                          style={{
                            borderBottom:
                              index < allIncomeItems.length - 1 ? '1px solid #F7F7F8' : 'none',
                            background: isObligated ? 'rgba(13, 186, 204, 0.03)' : 'transparent',
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0 ml-3">
                              <div className="flex items-center gap-1.5">
                                <SensitiveData
                                  as="p"
                                  className="text-sm font-medium truncate"
                                  style={{ color: '#303150', fontFamily }}
                                >
                                  {item.description}
                                </SensitiveData>
                                {item.isRecurring && (
                                  <span
                                    className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0"
                                    style={{
                                      color: '#69ADFF',
                                      backgroundColor: 'rgba(105, 173, 255, 0.1)',
                                    }}
                                  >
                                    <RefreshCw className="w-2.5 h-2.5" strokeWidth={1.5} />
                                    קבועה
                                  </span>
                                )}
                              </div>
                              <SensitiveData
                                as="p"
                                className="text-xs"
                                style={{ color: '#0DBACC' }}
                                dir="ltr"
                              >
                                {formatCurrency(item.amount)}
                              </SensitiveData>
                            </div>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={isObligated}
                              aria-label={`${item.description} - חייב ב${getCalculationLabel(calculationType)}`}
                              onClick={() => handleToggleIncome(item.key)}
                              className="relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none"
                              style={{
                                backgroundColor: isObligated ? '#0DBACC' : '#E8E8ED',
                                boxShadow: isObligated ? '0 0 8px rgba(13, 186, 204, 0.3)' : 'none',
                              }}
                            >
                              <span
                                className="absolute rounded-full bg-white shadow transition-transform duration-200"
                                style={{
                                  width: '1.25rem',
                                  height: '1.25rem',
                                  top: '0.125rem',
                                  left: '0.125rem',
                                  transform: isObligated ? 'translateX(1.25rem)' : 'translateX(0)',
                                }}
                              />
                            </button>
                          </div>

                          {/* Offset details inline */}
                          {isObligated && hasOffset && (
                            <div className="mt-1.5 mr-0.5 space-y-0.5">
                              <div className="flex items-center justify-between text-[11px]">
                                <span style={{ color: '#F18AB5' }}>
                                  ↳ קיזוז הוצאות
                                </span>
                                <SensitiveData
                                  as="span"
                                  style={{ color: '#F18AB5' }}
                                  dir="ltr"
                                >
                                  -{formatCurrency(itemOffsetSummary.offsetExpenses)}
                                </SensitiveData>
                              </div>
                              <div className="flex items-center justify-between text-[11px] font-medium">
                                <span style={{ color: '#0DBACC' }}>
                                  ↳ נטו לחישוב
                                </span>
                                <SensitiveData
                                  as="span"
                                  style={{ color: '#0DBACC' }}
                                  dir="ltr"
                                >
                                  {formatCurrency(itemOffsetSummary.netIncome)}
                                </SensitiveData>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Income subtotal */}
                {allIncomeItems.length > 0 && (
                  <div
                    className="mt-3 rounded-xl px-3 py-2"
                    style={{ background: 'rgba(13, 186, 204, 0.06)' }}
                  >
                    {totalOffset > 0 && (
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs" style={{ color: '#7E7F90' }}>
                          סך קיזוז הוצאות
                        </span>
                        <SensitiveData
                          as="span"
                          className="text-xs font-medium"
                          style={{ color: '#F18AB5' }}
                          dir="ltr"
                        >
                          -{formatCurrency(totalOffset)}
                        </SensitiveData>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium" style={{ color: '#303150', fontFamily }}>
                        סך הכנסות חייבות ב{getCalculationLabel(calculationType)}
                        {totalOffset > 0 ? ' (נטו)' : ''}
                      </span>
                      <SensitiveData
                        as="span"
                        className="text-sm font-bold"
                        style={{ color: '#0DBACC' }}
                        dir="ltr"
                      >
                        {formatCurrency(obligatedIncomeTotal)}
                      </SensitiveData>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 2.5: Expense Offset Configuration */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowOffsetSection(!showOffsetSection)}
                  className="flex items-center gap-2 w-full text-sm font-medium mb-2 transition-colors"
                  style={{ color: '#7E7F90', fontFamily }}
                >
                  <Link2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                  <span>קיזוז הוצאות מהכנסות</span>
                  {offsets.length > 0 && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: 'rgba(105, 173, 255, 0.1)', color: '#69ADFF' }}
                    >
                      {offsets.length}
                    </span>
                  )}
                  <span className="flex-1" />
                  {showOffsetSection ? (
                    <ChevronUp className="w-4 h-4" strokeWidth={1.75} />
                  ) : (
                    <ChevronDown className="w-4 h-4" strokeWidth={1.75} />
                  )}
                </button>

                {showOffsetSection && (
                  <div
                    className="rounded-xl p-3 space-y-3"
                    style={{ border: '1px solid #F7F7F8', background: 'rgba(105, 173, 255, 0.02)' }}
                  >
                    <p className="text-[11px]" style={{ color: '#BDBDCB' }}>
                      קשר קטגוריות הוצאה לקטגוריות הכנסה. ההוצאות יקוזזו מההכנסות לפני חישוב המעשר.
                    </p>

                    {/* Existing offsets */}
                    {Array.from(offsetsByIncome.entries()).map(([incCat, expCats]) => (
                      <div
                        key={incCat}
                        className="rounded-lg p-2.5"
                        style={{ background: '#F7F7F8' }}
                      >
                        <div className="flex items-center gap-1.5 mb-2">
                          <span
                            className="text-xs font-semibold"
                            style={{ color: '#303150', fontFamily }}
                          >
                            {getCategoryDisplayName(incCat, 'income', customCategories)}
                          </span>
                          <span className="text-[10px]" style={{ color: '#BDBDCB' }}>←</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {expCats.map((expCat) => (
                            <span
                              key={expCat}
                              className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg"
                              style={{
                                background: 'rgba(241, 138, 181, 0.08)',
                                color: '#F18AB5',
                              }}
                            >
                              {getCategoryDisplayName(expCat, 'expense', customCategories)}
                              <button
                                type="button"
                                onClick={() => handleRemoveOffset(incCat, expCat)}
                                className="p-0.5 rounded hover:bg-white/50 transition-colors"
                                aria-label={`הסר קיזוז ${getCategoryDisplayName(expCat, 'expense', customCategories)}`}
                              >
                                <Trash2 className="w-2.5 h-2.5" strokeWidth={2} />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}

                    {/* Add new offset */}
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <StyledSelect
                          value={newOffsetIncome}
                          onChange={setNewOffsetIncome}
                          placeholder="קטגוריית הכנסה..."
                          aria-label="קטגוריית הכנסה"
                          size="sm"
                          options={availableIncomeCategories.map((catId) => ({
                            value: catId,
                            label: getCategoryDisplayName(catId, 'income', customCategories),
                          }))}
                        />
                        <StyledSelect
                          value={newOffsetExpense}
                          onChange={setNewOffsetExpense}
                          placeholder="קטגוריית הוצאה..."
                          aria-label="קטגוריית הוצאה"
                          size="sm"
                          disabled={!newOffsetIncome}
                          options={availableExpenseCategories
                            .filter((c) => !usedExpenseCategories.has(c.id))
                            .map((cat) => ({
                              value: cat.id,
                              label: cat.nameHe,
                            }))}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddOffset}
                        disabled={!newOffsetIncome || !newOffsetExpense}
                        className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-medium transition-all"
                        style={{
                          backgroundColor:
                            newOffsetIncome && newOffsetExpense ? '#69ADFF' : '#F7F7F8',
                          color: newOffsetIncome && newOffsetExpense ? '#FFFFFF' : '#BDBDCB',
                        }}
                      >
                        <Plus className="w-3.5 h-3.5" strokeWidth={2} />
                        הוסף קיזוז
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 3: Donations Deduction */}
              <div>
                <label
                  className="text-sm font-medium mb-2 block"
                  style={{ color: '#7E7F90', fontFamily }}
                >
                  קיזוז תרומות/מעשרות ששולמו
                </label>

                <div className="rounded-xl p-3" style={{ border: '1px solid #F7F7F8' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: '#303150', fontFamily }}>
                      סך תרומות/מעשרות ששולמו החודש
                    </span>
                    <div className="flex items-center gap-2">
                      <SensitiveData
                        as="span"
                        className="text-sm font-bold"
                        style={{ color: '#F18AB5' }}
                        dir="ltr"
                      >
                        {formatCurrency(totalDonationsPaid)}
                      </SensitiveData>
                      {hasDonationDetails && (
                        <button
                          type="button"
                          onClick={() => setShowDonationDetails(!showDonationDetails)}
                          className="p-1 rounded-lg transition-colors hover:bg-[#F7F7F8]"
                          aria-label="הצג פירוט תרומות"
                          aria-expanded={showDonationDetails}
                        >
                          {showDonationDetails ? (
                            <ChevronUp className="w-4 h-4" style={{ color: '#7E7F90' }} strokeWidth={1.75} />
                          ) : (
                            <ChevronDown className="w-4 h-4" style={{ color: '#7E7F90' }} strokeWidth={1.75} />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {showDonationDetails && hasDonationDetails && (
                    <div
                      className="mt-3 pt-3 space-y-2"
                      style={{ borderTop: '1px solid #F7F7F8' }}
                    >
                      {recurringDonationTransactions.map((rt) => (
                        <div
                          key={`recurring-donation-${rt.id}`}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="flex items-center gap-1 truncate ml-2" style={{ color: '#7E7F90' }}>
                            <SensitiveData as="span">{rt.name}</SensitiveData>
                            <span
                              className="inline-flex items-center gap-0.5 text-[9px] px-1 py-0.5 rounded-full flex-shrink-0"
                              style={{ color: '#69ADFF', backgroundColor: 'rgba(105, 173, 255, 0.1)' }}
                            >
                              <RefreshCw className="w-2 h-2" strokeWidth={1.5} />
                              קבועה
                            </span>
                          </span>
                          <SensitiveData
                            as="span"
                            style={{ color: '#F18AB5' }}
                            dir="ltr"
                            className="flex-shrink-0"
                          >
                            {formatCurrency(rt.amount)}
                          </SensitiveData>
                        </div>
                      ))}
                      {donationTransactions.map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between text-xs">
                          <SensitiveData
                            as="span"
                            style={{ color: '#7E7F90' }}
                            className="truncate ml-2"
                          >
                            {tx.description}
                          </SensitiveData>
                          <SensitiveData
                            as="span"
                            style={{ color: '#F18AB5' }}
                            dir="ltr"
                            className="flex-shrink-0"
                          >
                            {formatCurrency(tx.amount)}
                          </SensitiveData>
                        </div>
                      ))}
                    </div>
                  )}

                  {!hasDonationDetails && (
                    <p className="text-xs mt-1" style={{ color: '#BDBDCB' }}>
                      לא נמצאו תשלומי תרומות או מעשרות בחודש זה
                    </p>
                  )}
                </div>
              </div>

              {/* Section 4: Summary */}
              <div
                className="rounded-xl p-4"
                style={{
                  background: 'rgba(105, 173, 255, 0.05)',
                  border: '1px solid rgba(105, 173, 255, 0.12)',
                }}
              >
                <h3
                  className="text-sm font-semibold mb-3"
                  style={{ color: '#303150', fontFamily }}
                >
                  סיכום
                </h3>

                <div className="space-y-2">
                  {/* Offset line (only if active) */}
                  {totalOffset > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: '#7E7F90' }}>
                        קיזוז הוצאות מהכנסות
                      </span>
                      <SensitiveData
                        as="span"
                        className="text-sm font-semibold"
                        style={{ color: '#F18AB5' }}
                        dir="ltr"
                      >
                        -{formatCurrency(totalOffset)}
                      </SensitiveData>
                    </div>
                  )}

                  {/* Obligation */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: '#7E7F90' }}>
                      חובת {getCalculationLabel(calculationType)} ({getCalculationPercentageLabel(calculationType)} מתוך{' '}
                      <SensitiveData as="span" dir="ltr">
                        {formatCurrency(obligatedIncomeTotal)}
                      </SensitiveData>
                      )
                    </span>
                    <SensitiveData
                      as="span"
                      className="text-sm font-semibold"
                      style={{ color: '#303150' }}
                      dir="ltr"
                    >
                      {formatCurrency(obligation)}
                    </SensitiveData>
                  </div>

                  {/* Paid */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: '#7E7F90' }}>
                      שולם בפועל
                    </span>
                    <SensitiveData
                      as="span"
                      className="text-sm font-semibold"
                      style={{ color: '#F18AB5' }}
                      dir="ltr"
                    >
                      {formatCurrency(totalDonationsPaid)}
                    </SensitiveData>
                  </div>

                  <div style={{ borderTop: '1px solid #F7F7F8', margin: '0.5rem 0' }} />

                  {/* Balance */}
                  <div className="flex items-center justify-between">
                    {balance.remaining > 0 ? (
                      <>
                        <span className="text-sm font-medium" style={{ color: '#303150', fontFamily }}>
                          נותר לתשלום
                        </span>
                        <SensitiveData
                          as="span"
                          className="text-base font-bold"
                          style={{ color: '#303150' }}
                          dir="ltr"
                        >
                          {formatCurrency(balance.remaining)}
                        </SensitiveData>
                      </>
                    ) : balance.credit > 0 ? (
                      <>
                        <span className="text-sm font-medium" style={{ color: '#0DBACC', fontFamily }}>
                          זכות לחודש הבא
                        </span>
                        <SensitiveData
                          as="span"
                          className="text-base font-bold"
                          style={{ color: '#0DBACC' }}
                          dir="ltr"
                        >
                          {formatCurrency(balance.credit)}
                        </SensitiveData>
                      </>
                    ) : (
                      <>
                        <span className="text-sm font-medium" style={{ color: '#0DBACC', fontFamily }}>
                          מאוזן
                        </span>
                        <span className="text-base font-bold" style={{ color: '#0DBACC' }}>
                          ✓
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary flex-1"
            disabled={isSaving}
          >
            ביטול
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="btn-primary flex-1"
            disabled={isSaving || isLoading}
          >
            {isSaving ? (
              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
            ) : (
              'אישור'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
