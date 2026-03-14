'use client';

import { useState, useRef, useEffect } from 'react';
import { Trash2, FileText } from 'lucide-react';
import { formatCurrencyAmount, type CurrencyCode } from '@/lib/utils';
import type { AdminTransaction, FinanceRecordType, TransactionStatus } from '@/types/admin-cfo';
import TypeBadge from './TypeBadge';
import TransactionStatusBadge from './TransactionStatusBadge';

interface TransactionRowProps {
  transaction: AdminTransaction;
  gridCols: string;
  onUpdate?: (id: string, updates: Record<string, unknown>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export default function TransactionRow({ transaction: txn, gridCols, onUpdate, onDelete }: TransactionRowProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(txn.title);
  const [isEditingAmount, setIsEditingAmount] = useState(false);
  const [editedAmount, setEditedAmount] = useState(String(txn.amount));
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [editedCategory, setEditedCategory] = useState(txn.category ?? '');
  const [isEditingDate, setIsEditingDate] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setEditedTitle(txn.title); }, [txn.title]);
  useEffect(() => { setEditedAmount(String(txn.amount)); }, [txn.amount]);
  useEffect(() => { setEditedCategory(txn.category ?? ''); }, [txn.category]);

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
    if (!trimmed || trimmed === txn.title) { setEditedTitle(txn.title); return; }
    onUpdate?.(txn.id, { title: trimmed });
  };

  const saveAmountEdit = () => {
    setIsEditingAmount(false);
    const num = parseFloat(editedAmount);
    if (isNaN(num) || num === txn.amount) { setEditedAmount(String(txn.amount)); return; }
    onUpdate?.(txn.id, { amount: num });
  };

  const saveCategoryEdit = () => {
    const trimmed = editedCategory.trim();
    setIsEditingCategory(false);
    if (trimmed === (txn.category ?? '')) { setEditedCategory(txn.category ?? ''); return; }
    onUpdate?.(txn.id, { category: trimmed });
  };

  const handleKeyDown = (e: React.KeyboardEvent, save: () => void, cancel: () => void) => {
    if (e.key === 'Enter') { e.preventDefault(); save(); }
    else if (e.key === 'Escape') cancel();
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsEditingDate(false);
    if (e.target.value) {
      onUpdate?.(txn.id, { date: new Date(e.target.value).toISOString() });
    }
  };

  const dateValue = txn.date
    ? new Date(txn.date).toISOString().split('T')[0]
    : '';

  const dateLabel = txn.date
    ? new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'short' }).format(new Date(txn.date))
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
            onKeyDown={(e) => handleKeyDown(e, saveTitleEdit, () => { setEditedTitle(txn.title); setIsEditingTitle(false); })}
            className="w-full h-8 text-sm text-[#303150] bg-white border border-[#69ADFF] rounded-lg px-2 focus:outline-none focus:ring-2 focus:ring-[#69ADFF]/20"
          />
        ) : (
          <span
            onClick={() => onUpdate && setIsEditingTitle(true)}
            className="text-sm text-[#303150] truncate cursor-text hover:text-[#69ADFF] transition-colors"
          >
            {txn.title}
          </span>
        )}
      </div>

      {/* Type Badge */}
      <div className="px-2 py-2 flex items-center">
        <div className="w-full">
          <TypeBadge
            type={txn.type}
            onChange={onUpdate ? (type: FinanceRecordType) => onUpdate(txn.id, { type }) : undefined}
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
            onKeyDown={(e) => handleKeyDown(e, saveAmountEdit, () => { setEditedAmount(String(txn.amount)); setIsEditingAmount(false); })}
            className="w-full h-8 text-sm text-[#303150] bg-white border border-[#69ADFF] rounded-lg px-2 focus:outline-none focus:ring-2 focus:ring-[#69ADFF]/20"
            min="0"
            step="0.01"
          />
        ) : (
          <span
            onClick={() => onUpdate && setIsEditingAmount(true)}
            className="text-sm font-medium text-[#303150] cursor-text hover:text-[#69ADFF] transition-colors"
          >
            {formatCurrencyAmount(txn.amount, txn.currency as CurrencyCode)}
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
            onKeyDown={(e) => handleKeyDown(e, saveCategoryEdit, () => { setEditedCategory(txn.category ?? ''); setIsEditingCategory(false); })}
            className="w-full h-8 text-sm text-[#303150] bg-white border border-[#69ADFF] rounded-lg px-2 focus:outline-none focus:ring-2 focus:ring-[#69ADFF]/20"
          />
        ) : (
          <span
            onClick={() => onUpdate && setIsEditingCategory(true)}
            className="text-sm text-[#7E7F90] truncate cursor-text hover:text-[#69ADFF] transition-colors"
          >
            {txn.category || '—'}
          </span>
        )}
      </div>

      {/* Date */}
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
          <TransactionStatusBadge
            status={txn.status}
            onChange={onUpdate ? (status: TransactionStatus) => onUpdate(txn.id, { status }) : undefined}
          />
        </div>
      </div>

      {/* Receipt */}
      <div className="px-4 py-2.5 flex items-center justify-center">
        {txn.receiptUrl ? (
          <a
            href={txn.receiptUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#7E7F90] hover:text-[#4F46E5] transition-colors"
          >
            <FileText className="w-4 h-4" />
          </a>
        ) : (
          <span className="text-[#BDBDCB]">—</span>
        )}
      </div>

      {/* Delete */}
      <div className="px-2 py-2.5 flex items-center justify-center">
        {onDelete && (
          <button
            onClick={() => onDelete(txn.id)}
            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all"
            title="מחק תנועה"
          >
            <Trash2 className="w-3.5 h-3.5 text-[#BDBDCB] hover:text-red-500 transition-colors" strokeWidth={1.75} />
          </button>
        )}
      </div>
    </div>
  );
}
