'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Loader2, ChevronDown, ChevronUp, Calculator, RefreshCw } from 'lucide-react';
import { Transaction, RecurringTransaction } from '@/lib/types';
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
} from '@/lib/maaserCalculations';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { SensitiveData } from '@/components/common/SensitiveData';

interface MaaserPreference {
  id: string;
  incomeSource: string;
  incomeCategory?: string | null;
  isObligated: boolean;
  calculationType: string;
}

// Unified income item for display (can be a regular transaction or a recurring one)
interface IncomeItem {
  key: string; // unique key for toggle map
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
  selectedMonth: string; // YYYY-MM format
}

export default function MaaserCalculatorModal({
  isOpen,
  onClose,
  transactions,
  recurringTransactions,
  selectedMonth,
}: MaaserCalculatorModalProps) {
  // State
  const [calculationType, setCalculationType] = useState<CalculationType>('maaser');
  const [incomeToggles, setIncomeToggles] = useState<Map<string, boolean>>(new Map());
  const [preferences, setPreferences] = useState<MaaserPreference[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDonationDetails, setShowDonationDetails] = useState(false);

  // Focus trap for accessibility
  const { containerRef, handleKeyDown } = useFocusTrap<HTMLDivElement>(isOpen, {
    onEscape: onClose,
  });

  // Get one-time income transactions for the selected month
  const monthlyIncomes = useMemo(
    () => getMonthlyIncomes(transactions, selectedMonth),
    [transactions, selectedMonth]
  );

  // Get recurring income transactions active in the selected month
  const activeRecurringIncomes = useMemo(
    () => getActiveRecurringIncomes(recurringTransactions, selectedMonth),
    [recurringTransactions, selectedMonth]
  );

  // Merge into a unified income list
  const allIncomeItems: IncomeItem[] = useMemo(() => {
    const items: IncomeItem[] = [];

    // Recurring incomes first (they are the stable ones)
    activeRecurringIncomes.forEach((rt) => {
      items.push({
        key: `recurring:${rt.name}`,
        description: rt.name,
        amount: rt.amount,
        category: rt.category,
        isRecurring: true,
      });
    });

    // Then one-time incomes
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

  // Get one-time donation transactions for the selected month
  const donationTransactions = useMemo(
    () => getMonthlyDonationTransactions(transactions, selectedMonth),
    [transactions, selectedMonth]
  );

  // Get recurring donation transactions active in the selected month
  const recurringDonationTransactions = useMemo(
    () => getActiveRecurringDonationTransactions(recurringTransactions, selectedMonth),
    [recurringTransactions, selectedMonth]
  );

  // Total donations paid this month (one-time + recurring)
  const totalDonationsPaid = useMemo(() => {
    const oneTime = getMonthlyDonationsTotal(transactions, selectedMonth);
    const recurring = getActiveRecurringDonationsTotal(recurringTransactions, selectedMonth);
    return oneTime + recurring;
  }, [transactions, recurringTransactions, selectedMonth]);

  // Are there any donation details to show?
  const hasDonationDetails =
    donationTransactions.length > 0 || recurringDonationTransactions.length > 0;

  // Fetch preferences from DB when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchPreferences = async () => {
      setIsLoading(true);
      try {
        const res = await apiFetch('/api/maaser-preferences');
        if (res.ok) {
          const data: MaaserPreference[] = await res.json();
          setPreferences(data);

          // Set calculation type from the first preference that has one
          const firstWithType = data.find((p) => p.calculationType);
          if (firstWithType) {
            setCalculationType(firstWithType.calculationType as CalculationType);
          }

          // Build initial toggle map from preferences + all income items
          const toggleMap = new Map<string, boolean>();
          allIncomeItems.forEach((item) => {
            const sourceKey = item.isRecurring
              ? item.description
              : item.description;
            const pref =
              data.find((p) => p.incomeSource === sourceKey) ||
              data.find((p) => p.incomeCategory === item.category);
            // Default: obligated (true)
            toggleMap.set(item.key, pref ? pref.isObligated : true);
          });
          setIncomeToggles(toggleMap);
        }
      } catch (err) {
        console.error('Error fetching maaser preferences:', err);
        // Default: all incomes are obligated
        const toggleMap = new Map<string, boolean>();
        allIncomeItems.forEach((item) => {
          toggleMap.set(item.key, true);
        });
        setIncomeToggles(toggleMap);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreferences();
  }, [isOpen, allIncomeItems]);

  // Calculate obligated income total
  const obligatedIncomeTotal = useMemo(() => {
    let total = 0;
    allIncomeItems.forEach((item) => {
      if (incomeToggles.get(item.key) !== false) {
        total += item.amount;
      }
    });
    return total;
  }, [allIncomeItems, incomeToggles]);

  // Calculate obligation
  const obligation = useMemo(
    () => calculateObligation(obligatedIncomeTotal, calculationType),
    [obligatedIncomeTotal, calculationType]
  );

  // Calculate balance
  const balance = useMemo(
    () => calculateBalance(obligation, totalDonationsPaid),
    [obligation, totalDonationsPaid]
  );

  // Toggle income obligated status
  const handleToggleIncome = useCallback((key: string) => {
    setIncomeToggles((prev) => {
      const next = new Map(prev);
      next.set(key, !prev.get(key));
      return next;
    });
  }, []);

  // Save preferences and close
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const prefsToSave = allIncomeItems.map((item) => ({
        incomeSource: item.description,
        incomeCategory: item.category,
        isObligated: incomeToggles.get(item.key) !== false,
        calculationType,
      }));

      await apiFetch('/api/maaser-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: prefsToSave }),
      });

      onClose();
    } catch (err) {
      console.error('Error saving maaser preferences:', err);
    } finally {
      setIsSaving(false);
    }
  }, [allIncomeItems, incomeToggles, calculationType, onClose]);

  if (!isOpen) return null;

  const monthLabel = getHebrewMonthName(selectedMonth);

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
                style={{
                  color: '#303150',
                  fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                }}
              >
                חישוב {getCalculationLabel(calculationType)}
              </h2>
              <p
                className="text-xs"
                style={{ color: '#7E7F90' }}
              >
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
              <Loader2
                className="w-8 h-8 animate-spin"
                style={{ color: '#69ADFF' }}
              />
            </div>
          ) : (
            <>
              {/* Section 1: Calculation Type Selection */}
              <div>
                <label
                  className="text-sm font-medium mb-2 block"
                  style={{
                    color: '#7E7F90',
                    fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                  }}
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
                      backgroundColor:
                        calculationType === 'maaser' ? '#69ADFF' : '#F7F7F8',
                      color: calculationType === 'maaser' ? '#FFFFFF' : '#7E7F90',
                      fontFamily: 'var(--font-nunito), system-ui, sans-serif',
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
                      backgroundColor:
                        calculationType === 'chomesh' ? '#69ADFF' : '#F7F7F8',
                      color: calculationType === 'chomesh' ? '#FFFFFF' : '#7E7F90',
                      fontFamily: 'var(--font-nunito), system-ui, sans-serif',
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
                  style={{
                    color: '#7E7F90',
                    fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                  }}
                >
                  הכנסות החודש
                </label>

                {allIncomeItems.length === 0 ? (
                  <div
                    className="text-center py-6 rounded-xl"
                    style={{ background: '#F7F7F8' }}
                  >
                    <p
                      className="text-sm"
                      style={{ color: '#7E7F90' }}
                    >
                      לא נמצאו הכנסות בחודש זה
                    </p>
                  </div>
                ) : (
                  <div
                    className="rounded-xl overflow-hidden"
                    style={{ border: '1px solid #F7F7F8' }}
                  >
                    {allIncomeItems.map((item, index) => {
                      const isObligated =
                        incomeToggles.get(item.key) !== false;
                      return (
                        <div
                          key={item.key}
                          className="flex items-center justify-between p-3 transition-colors"
                          style={{
                            borderBottom:
                              index < allIncomeItems.length - 1
                                ? '1px solid #F7F7F8'
                                : 'none',
                            background: isObligated
                              ? 'rgba(13, 186, 204, 0.03)'
                              : 'transparent',
                          }}
                        >
                          <div className="flex-1 min-w-0 ml-3">
                            <div className="flex items-center gap-1.5">
                              <SensitiveData
                                as="p"
                                className="text-sm font-medium truncate"
                                style={{
                                  color: '#303150',
                                  fontFamily:
                                    'var(--font-nunito), system-ui, sans-serif',
                                }}
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

                          {/* Toggle */}
                          <button
                            type="button"
                            role="switch"
                            aria-checked={isObligated}
                            aria-label={`${item.description} - חייב ב${getCalculationLabel(calculationType)}`}
                            onClick={() => handleToggleIncome(item.key)}
                            className="relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none"
                            style={{
                              backgroundColor: isObligated ? '#0DBACC' : '#E8E8ED',
                              boxShadow: isObligated
                                ? '0 0 8px rgba(13, 186, 204, 0.3)'
                                : 'none',
                            }}
                          >
                            <span
                              className="absolute rounded-full bg-white shadow transition-transform duration-200"
                              style={{
                                width: '1.25rem',
                                height: '1.25rem',
                                top: '0.125rem',
                                left: '0.125rem',
                                transform: isObligated
                                  ? 'translateX(1.25rem)'
                                  : 'translateX(0)',
                              }}
                            />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Income subtotal */}
                {allIncomeItems.length > 0 && (
                  <div
                    className="mt-3 flex items-center justify-between px-3 py-2 rounded-xl"
                    style={{ background: 'rgba(13, 186, 204, 0.06)' }}
                  >
                    <span
                      className="text-sm font-medium"
                      style={{
                        color: '#303150',
                        fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                      }}
                    >
                      סך הכנסות חייבות ב{getCalculationLabel(calculationType)}
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
                )}
              </div>

              {/* Section 3: Donations Deduction */}
              <div>
                <label
                  className="text-sm font-medium mb-2 block"
                  style={{
                    color: '#7E7F90',
                    fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                  }}
                >
                  קיזוז תרומות/מעשרות ששולמו
                </label>

                <div
                  className="rounded-xl p-3"
                  style={{ border: '1px solid #F7F7F8' }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="text-sm"
                      style={{
                        color: '#303150',
                        fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                      }}
                    >
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
                          onClick={() =>
                            setShowDonationDetails(!showDonationDetails)
                          }
                          className="p-1 rounded-lg transition-colors hover:bg-[#F7F7F8]"
                          aria-label="הצג פירוט תרומות"
                          aria-expanded={showDonationDetails}
                        >
                          {showDonationDetails ? (
                            <ChevronUp
                              className="w-4 h-4"
                              style={{ color: '#7E7F90' }}
                              strokeWidth={1.75}
                            />
                          ) : (
                            <ChevronDown
                              className="w-4 h-4"
                              style={{ color: '#7E7F90' }}
                              strokeWidth={1.75}
                            />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Donation details (collapsible) */}
                  {showDonationDetails && hasDonationDetails && (
                    <div
                      className="mt-3 pt-3 space-y-2"
                      style={{ borderTop: '1px solid #F7F7F8' }}
                    >
                      {/* Recurring donations */}
                      {recurringDonationTransactions.map((rt) => (
                        <div
                          key={`recurring-donation-${rt.id}`}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="flex items-center gap-1 truncate ml-2" style={{ color: '#7E7F90' }}>
                            <SensitiveData as="span">
                              {rt.name}
                            </SensitiveData>
                            <span
                              className="inline-flex items-center gap-0.5 text-[9px] px-1 py-0.5 rounded-full flex-shrink-0"
                              style={{
                                color: '#69ADFF',
                                backgroundColor: 'rgba(105, 173, 255, 0.1)',
                              }}
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
                      {/* One-time donations */}
                      {donationTransactions.map((tx) => (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between text-xs"
                        >
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
                    <p
                      className="text-xs mt-1"
                      style={{ color: '#BDBDCB' }}
                    >
                      לא נמצאו תשלומי תרומות או מעשרות בחודש זה
                    </p>
                  )}
                </div>
              </div>

              {/* Section 4: Summary & Balance */}
              <div
                className="rounded-xl p-4"
                style={{
                  background: 'rgba(105, 173, 255, 0.05)',
                  border: '1px solid rgba(105, 173, 255, 0.12)',
                }}
              >
                <h3
                  className="text-sm font-semibold mb-3"
                  style={{
                    color: '#303150',
                    fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                  }}
                >
                  סיכום
                </h3>

                <div className="space-y-2">
                  {/* Obligation */}
                  <div className="flex items-center justify-between">
                    <span
                      className="text-sm"
                      style={{ color: '#7E7F90' }}
                    >
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
                    <span
                      className="text-sm"
                      style={{ color: '#7E7F90' }}
                    >
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

                  {/* Divider */}
                  <div style={{ borderTop: '1px solid #F7F7F8', margin: '0.5rem 0' }} />

                  {/* Balance */}
                  <div className="flex items-center justify-between">
                    {balance.remaining > 0 ? (
                      <>
                        <span
                          className="text-sm font-medium"
                          style={{
                            color: '#303150',
                            fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                          }}
                        >
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
                        <span
                          className="text-sm font-medium"
                          style={{
                            color: '#0DBACC',
                            fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                          }}
                        >
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
                        <span
                          className="text-sm font-medium"
                          style={{
                            color: '#0DBACC',
                            fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                          }}
                        >
                          מאוזן
                        </span>
                        <span
                          className="text-base font-bold"
                          style={{ color: '#0DBACC' }}
                        >
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
