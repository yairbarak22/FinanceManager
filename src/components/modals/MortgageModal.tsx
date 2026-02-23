'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { X, Plus, Trash2, Calculator, ChevronDown, Loader2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { calculateTrackMonthlyPayment } from '@/lib/loanCalculations';
import type { Liability } from '@/lib/types';

const TRACK_TYPES = [
  { value: 'prime', label: 'פריים' },
  { value: 'fixed_unlinked', label: 'קבועה לא צמודה (קל"צ)' },
  { value: 'fixed_linked', label: 'קבועה צמודה (ק"צ)' },
  { value: 'variable_5', label: 'משתנה כל 5 שנים' },
  { value: 'variable_other', label: 'משתנה אחר' },
  { value: 'eligibility', label: 'זכאות' },
  { value: 'other', label: 'אחר' },
];

interface TrackState {
  key: string;
  trackType: string;
  amount: string;
  termValue: string;
  termUnit: 'years' | 'months';
  interestRate: string;
  loanMethod: 'spitzer' | 'equal_principal';
  isCollapsed: boolean;
}

interface MortgageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  mortgage?: Liability | null;
}

function createEmptyTrack(): TrackState {
  return {
    key: crypto.randomUUID(),
    trackType: '',
    amount: '',
    termValue: '',
    termUnit: 'years',
    interestRate: '',
    loanMethod: 'spitzer',
    isCollapsed: false,
  };
}

function getTermMonths(t: TrackState): number {
  const v = parseInt(t.termValue) || 0;
  return t.termUnit === 'years' ? v * 12 : v;
}

function getTermYears(t: TrackState): number | undefined {
  return t.termUnit === 'years' ? (parseInt(t.termValue) || undefined) : undefined;
}

function computeMonthly(t: TrackState): number {
  const amount = parseFloat(t.amount) || 0;
  const rate = parseFloat(t.interestRate) || 0;
  const months = getTermMonths(t);
  if (amount <= 0 || months <= 0) return 0;
  return calculateTrackMonthlyPayment(amount, rate, months, t.loanMethod);
}

function isTrackValid(t: TrackState): boolean {
  return !!t.trackType && (parseFloat(t.amount) || 0) > 0 && getTermMonths(t) > 0;
}

function fmt(n: number): string {
  return Math.round(n).toLocaleString('he-IL');
}

function SegmentedControl({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex rounded-xl p-1" style={{ backgroundColor: '#F7F7F8' }}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className="flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200"
          style={{
            backgroundColor: value === opt.value ? '#FFFFFF' : 'transparent',
            color: value === opt.value ? '#303150' : '#7E7F90',
            boxShadow: value === opt.value ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            fontFamily: 'var(--font-nunito), system-ui, sans-serif',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function TrackTypeSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownStyle({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
  }, [isOpen]);

  const selectedLabel = TRACK_TYPES.find((t) => t.value === value)?.label;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full px-4 py-3 bg-white border rounded-xl text-sm
          flex items-center justify-between gap-2
          hover:border-[#69ADFF] hover:bg-[#F7F7F8]
          focus:outline-none focus:ring-2 focus:ring-[rgba(105,173,255,0.2)] focus:border-transparent
          transition-all duration-200
          ${!selectedLabel ? 'text-[#BDBDCB]' : 'text-[#303150]'}
        `}
        style={{ borderColor: '#E8E8ED', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
      >
        <span className="flex-1 text-right truncate">
          {selectedLabel || 'בחר סוג מסלול'}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-[#7E7F90] transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {mounted && createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'fixed',
                top: dropdownStyle.top,
                left: dropdownStyle.left,
                width: dropdownStyle.width,
              }}
              className="z-[12000] bg-white rounded-2xl shadow-xl border border-[#F7F7F8] overflow-hidden"
              dir="rtl"
            >
              <div className="max-h-48 overflow-y-auto py-1">
                {TRACK_TYPES.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`
                      w-full px-4 py-2.5 text-sm flex items-center justify-between gap-2
                      hover:bg-[#F7F7F8] transition-colors text-right
                      ${value === option.value ? 'bg-[#F7F7F8] text-[#69ADFF]' : 'text-[#303150]'}
                    `}
                    style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
                  >
                    <span className="flex-1">{option.label}</span>
                    {value === option.value && (
                      <Check className="w-4 h-4 text-[#69ADFF] flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

function mortgageToTracks(mortgage: Liability): TrackState[] {
  if (!mortgage.tracks || mortgage.tracks.length === 0) {
    return [createEmptyTrack()];
  }
  return mortgage.tracks.map((t) => {
    const termYears = t.termYears ?? Math.floor(t.termMonths / 12);
    const isExactYears = termYears > 0 && termYears * 12 === t.termMonths;
    return {
      key: crypto.randomUUID(),
      trackType: t.trackType,
      amount: String(t.amount),
      termValue: isExactYears ? String(termYears) : String(t.termMonths),
      termUnit: isExactYears ? 'years' as const : 'months' as const,
      interestRate: String(t.interestRate),
      loanMethod: t.loanMethod,
      isCollapsed: false,
    };
  });
}

export default function MortgageModal({ isOpen, onClose, onSave, mortgage }: MortgageModalProps) {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [tracks, setTracks] = useState<TrackState[]>([createEmptyTrack()]);
  const [isLoading, setIsLoading] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  const isEditMode = !!mortgage;

  useEffect(() => {
    if (!isOpen) return;
    if (mortgage) {
      setName(mortgage.name);
      const sd = mortgage.startDate
        ? new Date(mortgage.startDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
      setStartDate(sd);
      setTracks(mortgageToTracks(mortgage));
    } else {
      setName('');
      setStartDate(new Date().toISOString().split('T')[0]);
      setTracks([createEmptyTrack()]);
    }
    setIsLoading(false);
  }, [isOpen, mortgage]);

  const updateTrack = useCallback((key: string, patch: Partial<TrackState>) => {
    setTracks((prev) => prev.map((t) => (t.key === key ? { ...t, ...patch } : t)));
  }, []);

  const addTrack = useCallback(() => {
    setTracks((prev) => {
      const collapsed = prev.map((t) => (isTrackValid(t) ? { ...t, isCollapsed: true } : t));
      return [...collapsed, createEmptyTrack()];
    });
    setTimeout(() => bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' }), 150);
  }, []);

  const removeTrack = useCallback((key: string) => {
    setTracks((prev) => (prev.length <= 1 ? prev : prev.filter((t) => t.key !== key)));
  }, []);

  const monthlyPayments = useMemo(() => {
    const map: Record<string, number> = {};
    tracks.forEach((t) => { map[t.key] = computeMonthly(t); });
    return map;
  }, [tracks]);

  const totalAmount = useMemo(() => tracks.reduce((s, t) => s + (parseFloat(t.amount) || 0), 0), [tracks]);
  const totalMonthly = useMemo(() => Object.values(monthlyPayments).reduce((a, b) => a + b, 0), [monthlyPayments]);

  const canSubmit = name.trim() !== '' && tracks.length > 0 && tracks.every(isTrackValid);

  const handleSubmit = async () => {
    if (!canSubmit || isLoading) return;
    setIsLoading(true);
    try {
      await onSave({
        isMortgage: true,
        name: name.trim(),
        startDate,
        tracks: tracks.map((t, i) => ({
          trackType: t.trackType,
          amount: parseFloat(t.amount) || 0,
          termMonths: getTermMonths(t),
          termYears: getTermYears(t),
          interestRate: parseFloat(t.interestRate) || 0,
          loanMethod: t.loanMethod,
          monthlyPayment: Math.round(monthlyPayments[t.key] * 100) / 100,
          order: i,
        })),
      });
      onClose();
    } catch {
      // parent handles error
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={() => !isLoading && onClose()}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="modal-content max-w-lg w-full flex flex-col"
        style={{ maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header flex-shrink-0">
          <h2
            className="text-xl font-bold"
            style={{ color: '#303150', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
          >
            {isEditMode ? 'עריכת משכנתא' : 'הוספת משכנתא'}
          </h2>
          <button onClick={onClose} className="btn-icon" disabled={isLoading}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div ref={bodyRef} className="modal-body flex-1 overflow-y-auto space-y-6" style={{ maxHeight: '60vh' }}>
          {/* Section A: General Details */}
          <div className="space-y-4">
            <div>
              <label className="label">שם המשכנתא</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='לדוגמה: משכנתא לדירה בלוד'
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">תאריך תחילה</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input"
              />
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid #F7F7F8' }} />

          {/* Section B: Tracks */}
          <div>
            <p
              className="text-sm font-semibold mb-4"
              style={{ color: '#303150', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
            >
              מסלולי המשכנתא
            </p>

            <div className="space-y-4">
              <AnimatePresence initial={false}>
                {tracks.map((track, idx) => (
                  <motion.div
                    key={track.key}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.25 }}
                    className="relative rounded-3xl p-5 border transition-shadow duration-200"
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#F7F7F8',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                    }}
                  >
                    {/* Track Header (collapsed or badge) */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold"
                          style={{ backgroundColor: 'rgba(105, 173, 255, 0.1)', color: '#69ADFF' }}
                        >
                          {idx + 1}
                        </span>
                        <span
                          className="text-sm font-semibold"
                          style={{ color: '#303150', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
                        >
                          {TRACK_TYPES.find((tt) => tt.value === track.trackType)?.label || `מסלול ${idx + 1}`}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {tracks.length > 1 && track.isCollapsed && (
                          <div className="flex items-center gap-3 text-xs me-3" style={{ color: '#7E7F90' }}>
                            <span>{fmt(parseFloat(track.amount) || 0)} ₪</span>
                            <span style={{ color: '#0DBACC', fontWeight: 500 }}>
                              {fmt(monthlyPayments[track.key])} ₪/חודש
                            </span>
                          </div>
                        )}
                        {tracks.length > 1 && (
                          <button
                            type="button"
                            onClick={() => updateTrack(track.key, { isCollapsed: !track.isCollapsed })}
                            className="btn-icon"
                          >
                            <motion.div
                              animate={{ rotate: track.isCollapsed ? 0 : 180 }}
                              transition={{ duration: 0.15 }}
                            >
                              <ChevronDown className="w-4 h-4" style={{ color: '#7E7F90' }} />
                            </motion.div>
                          </button>
                        )}
                        {tracks.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTrack(track.key)}
                            className="btn-icon hover:!bg-[rgba(241,138,181,0.1)]"
                            title="מחק מסלול"
                          >
                            <Trash2 className="w-4 h-4" style={{ color: '#7E7F90' }} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Track Body */}
                    <AnimatePresence initial={false}>
                      {!track.isCollapsed && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: 'easeOut' }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div className="space-y-3">
                            {/* Track Type */}
                            <div>
                              <label className="label">סוג מסלול</label>
                              <TrackTypeSelect
                                value={track.trackType}
                                onChange={(v) => updateTrack(track.key, { trackType: v })}
                              />
                            </div>

                            {/* Amount + Interest */}
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="label">סכום (₪)</label>
                                <input
                                  type="number"
                                  value={track.amount}
                                  onChange={(e) => updateTrack(track.key, { amount: e.target.value })}
                                  placeholder="0"
                                  className="input"
                                  min="0"
                                  step="1000"
                                  required
                                />
                              </div>
                              <div>
                                <label className="label">ריבית שנתית (%)</label>
                                <input
                                  type="number"
                                  value={track.interestRate}
                                  onChange={(e) => updateTrack(track.key, { interestRate: e.target.value })}
                                  placeholder="0"
                                  className="input"
                                  min="0"
                                  max="30"
                                  step="0.01"
                                />
                              </div>
                            </div>

                            {/* Term */}
                            <div>
                              <label className="label">תקופה</label>
                              <div className="flex items-center gap-3">
                                <input
                                  type="number"
                                  value={track.termValue}
                                  onChange={(e) => updateTrack(track.key, { termValue: e.target.value })}
                                  placeholder="0"
                                  className="input flex-1"
                                  min="1"
                                  step="1"
                                  required
                                />
                                <div className="flex-shrink-0 w-[160px]">
                                  <SegmentedControl
                                    options={[
                                      { value: 'years', label: 'שנים' },
                                      { value: 'months', label: 'חודשים' },
                                    ]}
                                    value={track.termUnit}
                                    onChange={(v) => updateTrack(track.key, { termUnit: v as 'years' | 'months' })}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Loan Method */}
                            <div>
                              <label className="label">שיטת החזר</label>
                              <SegmentedControl
                                options={[
                                  { value: 'spitzer', label: 'שפיצר' },
                                  { value: 'equal_principal', label: 'קרן שווה' },
                                ]}
                                value={track.loanMethod}
                                onChange={(v) => updateTrack(track.key, { loanMethod: v as 'spitzer' | 'equal_principal' })}
                              />
                            </div>

                            {/* Calculated Monthly Payment */}
                            <div>
                              <div className="flex items-center gap-2 mb-1.5">
                                <label className="label !mb-0">החזר חודשי</label>
                                <span className="text-[10px]" style={{ color: '#BDBDCB' }}>מחושב אוטומטית</span>
                              </div>
                              <div className="relative">
                                <input
                                  type="text"
                                  value={monthlyPayments[track.key] > 0 ? `${fmt(monthlyPayments[track.key])} ₪` : '—'}
                                  readOnly
                                  className="input cursor-not-allowed"
                                  style={{ backgroundColor: '#F7F7F8', color: '#0DBACC', fontWeight: 600 }}
                                />
                                <Calculator
                                  className="w-4 h-4 absolute top-1/2 -translate-y-1/2 pointer-events-none"
                                  style={{ left: '12px', color: '#0DBACC' }}
                                />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Add Track Button */}
              <button
                type="button"
                onClick={addTrack}
                className="w-full py-4 px-6 flex items-center justify-center gap-2 rounded-xl transition-all duration-200 active:scale-[0.98]"
                style={{
                  border: '2px dashed #E8E8ED',
                  color: '#7E7F90',
                  fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#69ADFF';
                  e.currentTarget.style.color = '#69ADFF';
                  e.currentTarget.style.backgroundColor = 'rgba(105,173,255,0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E8E8ED';
                  e.currentTarget.style.color = '#7E7F90';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Plus className="w-5 h-5" />
                הוסף מסלול
              </button>
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div
          className="flex-shrink-0 p-6 flex flex-col gap-4"
          style={{
            borderTop: '1px solid #F7F7F8',
            boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.06)',
          }}
        >
          {/* Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium" style={{ color: '#7E7F90' }}>סה&quot;כ משכנתא</p>
              <p
                className="text-lg font-bold"
                style={{ color: '#303150', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
              >
                {fmt(totalAmount)} ₪
              </p>
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: '#7E7F90' }}>החזר חודשי כולל</p>
              <p
                className="text-lg font-bold px-2 py-0.5 rounded-lg inline-block"
                style={{
                  color: '#0DBACC',
                  backgroundColor: totalMonthly > 0 ? 'rgba(13, 186, 204, 0.08)' : 'transparent',
                  fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                }}
              >
                {fmt(totalMonthly)} ₪
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={isLoading}>
              ביטול
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="btn-primary flex-1"
              disabled={!canSubmit || isLoading}
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (isEditMode ? 'עדכון משכנתא' : 'שמירת משכנתא')}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
