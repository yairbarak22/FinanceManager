'use client';

import { useState, useRef, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { formatCurrencyAmount, type CurrencyCode } from '@/lib/utils';
import type { AdminSubscription, FinanceRecordType, SubscriptionStatus, BillingCycle } from '@/types/admin-cfo';
import TypeBadge from './TypeBadge';
import SubscriptionStatusBadge from './SubscriptionStatusBadge';
import BillingCycleBadge from './BillingCycleBadge';

interface SubscriptionRowProps {
  subscription: AdminSubscription;
  gridCols: string;
  onUpdate?: (id: string, updates: Record<string, unknown>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export default function SubscriptionRow({ subscription: sub, gridCols, onUpdate, onDelete }: SubscriptionRowProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(sub.title);
  const [isEditingAmount, setIsEditingAmount] = useState(false);
  const [editedAmount, setEditedAmount] = useState(String(sub.amount));
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [editedCategory, setEditedCategory] = useState(sub.category ?? '');
  const [isEditingDate, setIsEditingDate] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setEditedTitle(sub.title); }, [sub.title]);
  useEffect(() => { setEditedAmount(String(sub.amount)); }, [sub.amount]);
  useEffect(() => { setEditedCategory(sub.category ?? ''); }, [sub.category]);

  useEffect(() => {
    if (isEditingTitle && titleRef.current) { titleRef.current.focus(); titleRef.current.select(); }
  }, [isEditingTitle]);
  useEffect(() => {
    if (isEditingAmount && amountRef.current) { amountRef.current.focus(); amountRef.current.select(); }
  }, [isEditingAmount]);
  useEffect(() => {
    if (isEditingCategory && categoryRef.current) { categoryRef.current.focus(); categoryRef.current.select(); }
  }, [isEditingCategory]);

  const saveTitleEdit = () => {
    const trimmed = editedTitle.trim();
    setIsEditingTitle(false);
    if (!trimmed || trimmed === sub.title) { setEditedTitle(sub.title); return; }
    onUpdate?.(sub.id, { title: trimmed });
  };

  const saveAmountEdit = () => {
    setIsEditingAmount(false);
    const num = parseFloat(editedAmount);
    if (isNaN(num) || num === sub.amount) { setEditedAmount(String(sub.amount)); return; }
    onUpdate?.(sub.id, { amount: num });
  };

  const saveCategoryEdit = () => {
    const trimmed = editedCategory.trim();
    setIsEditingCategory(false);
    if (trimmed === (sub.category ?? '')) { setEditedCategory(sub.category ?? ''); return; }
    onUpdate?.(sub.id, { category: trimmed });
  };

  const handleKeyDown = (e: React.KeyboardEvent, save: () => void, cancel: () => void) => {
    if (e.key === 'Enter') { e.preventDefault(); save(); }
    else if (e.key === 'Escape') cancel();
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsEditingDate(false);
    if (e.target.value) {
      onUpdate?.(sub.id, { nextBillingDate: new Date(e.target.value).toISOString() });
    }
  };

  const dateValue = sub.nextBillingDate
    ? new Date(sub.nextBillingDate).toISOString().split('T')[0]
    : '';

  const dateLabel = sub.nextBillingDate
    ? new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'short' }).format(new Date(sub.nextBillingDate))
    : '—';

  return (
    <div className={`${gridCols} border-b border-[#F7F7F8] last:border-b-0 hover:bg-[#FAFAFA] transition-colors group`}>
      {/* Title */}
      <div className="px-4 py-2.5 flex items-center min-w-0">
        {isEditingTitle ? (
          <input
            ref={titleRef}
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onBlur={saveTitleEdit}
            onKeyDown={(e) => handleKeyDown(e, saveTitleEdit, () => { setEditedTitle(sub.title); setIsEditingTitle(false); })}
            className="w-full h-8 text-sm text-[#303150] bg-white border border-[#69ADFF] rounded-lg px-2 focus:outline-none focus:ring-2 focus:ring-[#69ADFF]/20"
          />
        ) : (
          <span
            onClick={() => onUpdate && setIsEditingTitle(true)}
            className="text-sm text-[#303150] truncate cursor-text hover:text-[#69ADFF] transition-colors"
          >
            {sub.title}
          </span>
        )}
      </div>

      {/* Type Badge */}
      <div className="px-2 py-2 flex items-center">
        <div className="w-full">
          <TypeBadge
            type={sub.type}
            onChange={onUpdate ? (type: FinanceRecordType) => onUpdate(sub.id, { type }) : undefined}
          />
        </div>
      </div>

      {/* Amount */}
      <div className="px-4 py-2.5 flex items-center">
        {isEditingAmount ? (
          <input
            ref={amountRef}
            type="number"
            value={editedAmount}
            onChange={(e) => setEditedAmount(e.target.value)}
            onBlur={saveAmountEdit}
            onKeyDown={(e) => handleKeyDown(e, saveAmountEdit, () => { setEditedAmount(String(sub.amount)); setIsEditingAmount(false); })}
            className="w-full h-8 text-sm text-[#303150] bg-white border border-[#69ADFF] rounded-lg px-2 focus:outline-none focus:ring-2 focus:ring-[#69ADFF]/20"
            min="0"
            step="0.01"
          />
        ) : (
          <span
            onClick={() => onUpdate && setIsEditingAmount(true)}
            className="text-sm font-medium text-[#303150] cursor-text hover:text-[#69ADFF] transition-colors"
          >
            {formatCurrencyAmount(sub.amount, sub.currency as CurrencyCode)}
          </span>
        )}
      </div>

      {/* Category */}
      <div className="px-4 py-2.5 flex items-center min-w-0">
        {isEditingCategory ? (
          <input
            ref={categoryRef}
            type="text"
            value={editedCategory}
            onChange={(e) => setEditedCategory(e.target.value)}
            onBlur={saveCategoryEdit}
            onKeyDown={(e) => handleKeyDown(e, saveCategoryEdit, () => { setEditedCategory(sub.category ?? ''); setIsEditingCategory(false); })}
            className="w-full h-8 text-sm text-[#303150] bg-white border border-[#69ADFF] rounded-lg px-2 focus:outline-none focus:ring-2 focus:ring-[#69ADFF]/20"
          />
        ) : (
          <span
            onClick={() => onUpdate && setIsEditingCategory(true)}
            className="text-sm text-[#7E7F90] truncate cursor-text hover:text-[#69ADFF] transition-colors"
          >
            {sub.category || '—'}
          </span>
        )}
      </div>

      {/* Billing Cycle */}
      <div className="px-2 py-2 flex items-center">
        <div className="w-full">
          <BillingCycleBadge
            cycle={sub.billingCycle}
            onChange={onUpdate ? (billingCycle: BillingCycle) => onUpdate(sub.id, { billingCycle }) : undefined}
          />
        </div>
      </div>

      {/* Next Billing Date */}
      <div className="px-4 py-2.5 flex items-center">
        {isEditingDate ? (
          <input
            type="date"
            defaultValue={dateValue}
            onChange={handleDateChange}
            onBlur={() => setIsEditingDate(false)}
            autoFocus
            className="w-full h-8 text-sm text-[#303150] bg-white border border-[#69ADFF] rounded-lg px-2 focus:outline-none focus:ring-2 focus:ring-[#69ADFF]/20"
          />
        ) : (
          <span
            onClick={() => onUpdate && setIsEditingDate(true)}
            className="text-sm text-[#7E7F90] cursor-text hover:text-[#69ADFF] transition-colors"
          >
            {dateLabel}
          </span>
        )}
      </div>

      {/* Status Badge */}
      <div className="px-2 py-2 flex items-center">
        <div className="w-full">
          <SubscriptionStatusBadge
            status={sub.status}
            onChange={onUpdate ? (status: SubscriptionStatus) => onUpdate(sub.id, { status }) : undefined}
          />
        </div>
      </div>

      {/* Delete */}
      <div className="px-2 py-2.5 flex items-center justify-center">
        {onDelete && (
          <button
            onClick={() => onDelete(sub.id)}
            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all"
            title="מחק מנוי"
          >
            <Trash2 className="w-3.5 h-3.5 text-[#BDBDCB] hover:text-red-500 transition-colors" strokeWidth={1.75} />
          </button>
        )}
      </div>
    </div>
  );
}
