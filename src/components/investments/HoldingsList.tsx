'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, TrendingUp, BarChart3 } from 'lucide-react';
import { Holding, InvestmentCalculation } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';
import ConfirmDialog from '@/components/modals/ConfirmDialog';
import Card from '@/components/ui/Card';

interface HoldingsListProps {
  holdings: Holding[];
  calculations: InvestmentCalculation[];
  onAdd: () => void;
  onEdit: (holding: Holding) => void;
  onDelete: (id: string) => void;
}

export default function HoldingsList({ 
  holdings, 
  calculations, 
  onAdd, 
  onEdit, 
  onDelete 
}: HoldingsListProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; name: string }>({
    isOpen: false,
    id: '',
    name: '',
  });

  const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
  const totalAllocation = holdings.reduce((sum, h) => sum + h.targetAllocation, 0);
  const isAllocationValid = Math.abs(totalAllocation - 100) < 0.01;

  // Get calculation for a specific holding
  const getCalculation = (holdingId: string) => {
    return calculations.find(c => c.holdingId === holdingId);
  };

  return (
    <Card padding="md">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
          </div>
          <h3 className="font-semibold text-slate-900">האחזקות שלי</h3>
        </div>
        <button onClick={onAdd} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
          <Plus className="w-4 h-4" />
          הוסף
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100">
          <p className="text-xs text-slate-500">סה"כ נכסים</p>
          <p className="text-base font-bold text-indigo-600">{holdings.length}</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
          <p className="text-xs text-slate-500">שווי תיק</p>
          <p className="text-base font-bold text-slate-900">{formatCurrency(totalValue)}</p>
        </div>
      </div>

      {/* Allocation Warning */}
      {holdings.length > 0 && !isAllocationValid && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex items-center gap-2">
          <span className="text-amber-600 text-sm">
            ⚠️ סכום הפילוחים הוא {totalAllocation.toFixed(1)}% במקום 100%
          </span>
        </div>
      )}

      {/* Holdings List */}
      <div className="space-y-2">
        {holdings.map((holding) => {
          const currentAllocation = totalValue > 0
            ? (holding.currentValue / totalValue) * 100
            : 0;
          const calc = getCalculation(holding.id);
          const allocationDiff = currentAllocation - holding.targetAllocation;

          return (
            <div
              key={holding.id}
              className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 rounded-lg bg-slate-50 transition-all"
            >
              {/* Top row: Icon + Details + Value (mobile) */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Icon */}
                <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-4 h-4 text-slate-600" />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 text-sm truncate">{holding.name}</p>
                  <p className="text-xs text-slate-500 truncate">
                    {holding.type === 'etf' ? 'קרן סל' : 'קרן מחקה'}
                    {holding.symbol && ` • ${holding.symbol}`}
                  </p>
                </div>

                {/* Value - mobile only */}
                <p className="text-sm font-bold text-slate-900 flex-shrink-0 sm:hidden">
                  {formatCurrency(holding.currentValue)}
                </p>
              </div>

              {/* Bottom row (mobile) / Continue (desktop): Value + Allocation + Actions */}
              <div className="flex items-center gap-2 justify-end mr-12 sm:mr-0">
                {/* Value - desktop only */}
                <p className="hidden sm:block text-sm font-bold text-slate-900 flex-shrink-0">
                  {formatCurrency(holding.currentValue)}
                </p>

                {/* Allocation badge */}
                <span className={cn(
                  "text-xs px-2 py-1 rounded-full font-medium",
                  allocationDiff > 5 ? "bg-rose-100 text-rose-700" :
                  allocationDiff < -5 ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                )}>
                  {currentAllocation.toFixed(1)}% / {holding.targetAllocation}%
                </span>

                {/* Actions */}
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => onEdit(holding)}
                    className="p-1.5 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-600"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm({ isOpen: true, id: holding.id, name: holding.name })}
                    className="p-1.5 rounded hover:bg-red-100 text-slate-500 hover:text-red-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {holdings.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>אין אחזקות עדיין</p>
            <p className="text-sm mt-1">הוסף את האחזקות שלך כדי להתחיל</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: '', name: '' })}
        onConfirm={() => onDelete(deleteConfirm.id)}
        title="מחיקת אחזקה"
        message={`האם אתה בטוח שברצונך למחוק את "${deleteConfirm.name}"?`}
      />
    </Card>
  );
}

