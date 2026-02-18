'use client';

import { useState, useMemo } from 'react';
import {
  Home,
  Heart,
  Plane,
  PartyPopper,
  ShieldCheck,
  Wallet,
  Edit3,
  Plus,
  Minus,
  Loader2,
  Zap,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils';

export interface QuickCreateData {
  name: string;
  category: string;
  targetAmount: number;
  years: number;
}

interface GoalQuickTemplatesProps {
  onQuickCreate: (data: QuickCreateData) => Promise<void>;
  isCreating: boolean;
  onCustomClick: () => void;
}

const TEMPLATES: {
  name: string;
  category: string;
  targetAmount: number;
  years: number;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  gradient: string;
}[] = [
  {
    name: 'קניית דירה',
    category: 'home',
    targetAmount: 1_500_000,
    years: 15,
    icon: Home,
    gradient: 'linear-gradient(135deg, #C1DDFF 0%, #69ADFF 100%)',
  },
  {
    name: 'חתונת הילד',
    category: 'wedding',
    targetAmount: 250_000,
    years: 5,
    icon: Heart,
    gradient: 'linear-gradient(135deg, #B4F1F1 0%, #0DBACC 100%)',
  },
  {
    name: 'חופשה משפחתית',
    category: 'vacation',
    targetAmount: 15_000,
    years: 1,
    icon: Plane,
    gradient: 'linear-gradient(135deg, #FFC0DB 0%, #F18AB5 100%)',
  },
  {
    name: 'חגים',
    category: 'holidays',
    targetAmount: 3_000,
    years: 1,
    icon: PartyPopper,
    gradient: 'linear-gradient(135deg, #E3D6FF 0%, #9F7FE0 100%)',
  },
  {
    name: 'קרן חירום',
    category: 'emergency',
    targetAmount: 50_000,
    years: 2,
    icon: ShieldCheck,
    gradient: 'linear-gradient(135deg, #B4F1F1 0%, #0DBACC 100%)',
  },
  {
    name: 'חיסכון כללי',
    category: 'saving',
    targetAmount: 100_000,
    years: 3,
    icon: Wallet,
    gradient: 'linear-gradient(135deg, #C1DDFF 0%, #69ADFF 100%)',
  },
];


export default function GoalQuickTemplates({
  onQuickCreate,
  isCreating,
  onCustomClick,
}: GoalQuickTemplatesProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [amounts, setAmounts] = useState<Record<number, number>>({});
  const [yearValues, setYearValues] = useState<Record<number, number>>({});
  const [creatingIdx, setCreatingIdx] = useState<number | null>(null);
  const [justCreatedIdx, setJustCreatedIdx] = useState<number | null>(null);

  const getAmount = (i: number) => amounts[i] ?? TEMPLATES[i].targetAmount;
  const getYears = (i: number) => yearValues[i] ?? TEMPLATES[i].years;

  const monthlyCalc = useMemo(() => {
    if (selectedIdx === null) return 0;
    const amount = getAmount(selectedIdx);
    const yrs = getYears(selectedIdx);
    const totalMonths = yrs * 12;
    return totalMonths > 0 ? Math.ceil(amount / totalMonths) : 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIdx, amounts, yearValues]);

  const handleCardClick = (i: number) => {
    setSelectedIdx(selectedIdx === i ? null : i);
  };

  const handleCreate = async (idx: number) => {
    const t = TEMPLATES[idx];
    setCreatingIdx(idx);
    try {
      await onQuickCreate({
        name: t.name,
        category: t.category,
        targetAmount: getAmount(idx),
        years: getYears(idx),
      });
      setJustCreatedIdx(idx);
      setTimeout(() => {
        setJustCreatedIdx(null);
        setSelectedIdx(null);
        setAmounts((prev) => {
          const next = { ...prev };
          delete next[idx];
          return next;
        });
        setYearValues((prev) => {
          const next = { ...prev };
          delete next[idx];
          return next;
        });
      }, 1400);
    } finally {
      setCreatingIdx(null);
    }
  };

  const selectedTemplate = selectedIdx !== null ? TEMPLATES[selectedIdx] : null;

  return (
    <Card variant="default" className="p-0 overflow-hidden h-full lg:max-h-[600px] flex flex-col">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 flex-shrink-0" style={{ borderBottom: '1px solid #F7F7F8' }}>
        <div className="flex items-center gap-3 mb-1">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #0DBACC 0%, #69ADFF 100%)' }}
          >
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3
              className="text-lg font-bold"
              style={{
                color: '#303150',
                fontFamily: 'var(--font-nunito), system-ui, sans-serif',
              }}
            >
              הוספה מהירה
            </h3>
            <p style={{ color: '#7E7F90', fontSize: '0.75rem' }}>
              לחץ על תבנית, התאם ויצר בלחיצה אחת
            </p>
          </div>
        </div>
      </div>

      {/* Template Grid + Edit Panel — fixed height area */}
      <div className="px-5 py-4 flex-1 min-h-0 flex flex-col overflow-y-auto">
        <div className="grid grid-cols-2 gap-2.5">
          {TEMPLATES.map((t, i) => {
            const Icon = t.icon;
            const isSelected = selectedIdx === i;
            const wasCreated = justCreatedIdx === i;

            return (
              <motion.button
                key={t.category}
                type="button"
                onClick={() => handleCardClick(i)}
                className="rounded-2xl p-3.5 text-start transition-all duration-200"
                style={{
                  backgroundColor: wasCreated
                    ? 'rgba(13, 186, 204, 0.08)'
                    : isSelected
                      ? 'rgba(105, 173, 255, 0.07)'
                      : 'white',
                  border: isSelected
                    ? '2px solid #69ADFF'
                    : wasCreated
                      ? '2px solid #0DBACC'
                      : '1.5px solid #F0F0F5',
                  boxShadow: isSelected
                    ? '0 4px 16px rgba(105, 173, 255, 0.18)'
                    : 'none',
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                whileHover={!isSelected ? { scale: 1.03, y: -1 } : {}}
                whileTap={{ scale: 0.97 }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: wasCreated ? '#0DBACC' : t.gradient }}
                  >
                    {wasCreated ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                      >
                        <Check className="w-3.5 h-3.5 text-white" />
                      </motion.div>
                    ) : (
                      <Icon className="w-3.5 h-3.5 text-white" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className="font-bold text-[0.8rem] leading-snug"
                      style={{
                        color: wasCreated ? '#0DBACC' : '#303150',
                        fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                      }}
                    >
                      {wasCreated ? 'נוסף!' : t.name}
                    </p>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Fixed-height edit area — always present, content swaps via crossfade */}
        <div className="flex-1 flex flex-col mt-3">
          <AnimatePresence mode="wait">
            {selectedIdx !== null && selectedTemplate && justCreatedIdx === null ? (
              <motion.div
                key={`edit-${selectedIdx}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col"
              >
                <div
                  className="rounded-2xl p-4 space-y-3 flex-1 flex flex-col"
                  style={{
                    backgroundColor: '#FAFAFC',
                    border: '1px solid #EEEEF2',
                  }}
                >
                  {/* Amount Input */}
                  <div>
                    <label
                      className="block text-xs font-medium mb-1.5"
                      style={{ color: '#7E7F90' }}
                    >
                      סכום יעד
                    </label>
                    <div className="relative">
                      <span
                        className="absolute end-3 top-1/2 -translate-y-1/2 text-sm font-medium"
                        style={{ color: '#BDBDCB' }}
                      >
                        ₪
                      </span>
                      <input
                        type="number"
                        min={1000}
                        step={1000}
                        value={getAmount(selectedIdx)}
                        onChange={(e) => {
                          const val = Math.max(0, Number(e.target.value));
                          setAmounts((prev) => ({ ...prev, [selectedIdx]: val }));
                        }}
                        className="w-full py-2 pe-10 ps-3 rounded-xl border text-sm font-medium tabular-nums hide-spinner transition-colors focus:outline-none focus:ring-2 focus:ring-[#69ADFF]/30 focus:border-[#69ADFF]"
                        style={{
                          borderColor: '#E8E8ED',
                          color: '#303150',
                          direction: 'ltr',
                          textAlign: 'right',
                          fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                        }}
                      />
                    </div>
                  </div>

                  {/* Years Stepper */}
                  <div>
                    <label
                      className="block text-xs font-medium mb-1.5"
                      style={{ color: '#7E7F90' }}
                    >
                      תקופה
                    </label>
                    <div className="flex items-center gap-2">
                      <motion.button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setYearValues((prev) => ({
                            ...prev,
                            [selectedIdx!]: Math.max(1, getYears(selectedIdx!) - 1),
                          }));
                        }}
                        className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-[#EEEEF2] active:bg-[#E4E4EA]"
                        style={{ backgroundColor: '#F4F4F7' }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Minus className="w-3.5 h-3.5" style={{ color: '#7E7F90' }} />
                      </motion.button>

                      <div
                        className="flex-1 text-center py-1.5 rounded-xl"
                        style={{ backgroundColor: 'white', border: '1px solid #E8E8ED' }}
                      >
                        <span
                          className="font-bold text-sm"
                          style={{
                            color: '#303150',
                            fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                          }}
                        >
                          {getYears(selectedIdx)}
                        </span>
                        <span
                          className="text-xs ms-1"
                          style={{ color: '#9B9CAD' }}
                        >
                          {getYears(selectedIdx) === 1 ? 'שנה' : 'שנים'}
                        </span>
                      </div>

                      <motion.button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setYearValues((prev) => ({
                            ...prev,
                            [selectedIdx!]: Math.min(30, getYears(selectedIdx!) + 1),
                          }));
                        }}
                        className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-[#EEEEF2] active:bg-[#E4E4EA]"
                        style={{ backgroundColor: '#F4F4F7' }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Plus className="w-3.5 h-3.5" style={{ color: '#7E7F90' }} />
                      </motion.button>
                    </div>
                  </div>

                  {/* Monthly Contribution Preview */}
                  <div
                    className="flex items-center justify-center gap-1.5 py-1.5 rounded-xl"
                    style={{ backgroundColor: 'rgba(105, 173, 255, 0.06)' }}
                  >
                    <span className="text-xs" style={{ color: '#7E7F90' }}>
                      הפרשה חודשית:
                    </span>
                    <span
                      className="font-bold text-sm tabular-nums"
                      style={{
                        color: '#69ADFF',
                        fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                      }}
                    >
                      {formatCurrency(monthlyCalc)}
                    </span>
                  </div>

                  {/* Spacer to push button down */}
                  <div className="flex-1" />

                  {/* Create Button */}
                  <motion.button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCreate(selectedIdx);
                    }}
                    disabled={creatingIdx === selectedIdx || isCreating}
                    className="w-full py-2.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:brightness-105 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{
                      background: 'linear-gradient(135deg, #0DBACC 0%, #69ADFF 100%)',
                      fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                      boxShadow: '0 4px 16px rgba(13, 186, 204, 0.3)',
                    }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {creatingIdx === selectedIdx ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        מוסיף יעד...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        הוסף יעד
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col items-center justify-center"
              >
                <div className="text-center py-6">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2"
                    style={{ backgroundColor: '#F7F7F8' }}
                  >
                    <Zap className="w-4.5 h-4.5" style={{ color: '#BDBDCB' }} />
                  </div>
                  <p className="text-xs" style={{ color: '#BDBDCB' }}>
                    בחר תבנית למעלה כדי להתחיל
                  </p>
                </div>

                {/* Custom Button */}
                <motion.button
                  type="button"
                  onClick={onCustomClick}
                  className="w-full mt-auto rounded-2xl p-3 flex items-center justify-center gap-2 transition-colors hover:bg-[#F7F7F8]"
                  style={{
                    border: '2px dashed #E0E0EA',
                    color: '#7E7F90',
                    fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span className="font-medium text-sm">מותאם אישית</span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Card>
  );
}
