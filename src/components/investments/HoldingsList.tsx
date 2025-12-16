'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, TrendingUp, BarChart3 } from 'lucide-react';
import { Holding, InvestmentCalculation } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';
import ConfirmDialog from '@/components/modals/ConfirmDialog';

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
    <div className="card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">האחזקות שלי</h3>
            <p className="text-sm text-gray-500">
              {holdings.length} נכסים • {formatCurrency(totalValue)}
            </p>
          </div>
        </div>
        <button onClick={onAdd} className="btn-primary">
          <Plus className="w-4 h-4" />
          הוסף נכס
        </button>
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
      <div className="space-y-3">
        {holdings.map((holding) => {
          const currentAllocation = totalValue > 0 
            ? (holding.currentValue / totalValue) * 100 
            : 0;
          const calc = getCalculation(holding.id);
          const allocationDiff = currentAllocation - holding.targetAllocation;

          return (
            <div
              key={holding.id}
              className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              {/* Icon */}
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900 truncate">{holding.name}</p>
                  {holding.symbol && (
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                      {holding.symbol}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  {holding.type === 'etf' ? 'קרן סל' : 'קרן מחקה'}
                </p>
              </div>

              {/* Value */}
              <div className="text-left flex-shrink-0">
                <p className="font-bold text-gray-900">{formatCurrency(holding.currentValue)}</p>
                <p className="text-xs text-gray-500">
                  {currentAllocation.toFixed(1)}% נוכחי
                </p>
              </div>

              {/* Allocation */}
              <div className="text-left flex-shrink-0 w-24">
                <p className={cn(
                  "font-medium",
                  allocationDiff > 5 ? "text-red-500" : 
                  allocationDiff < -5 ? "text-green-500" : "text-gray-700"
                )}>
                  יעד: {holding.targetAllocation}%
                </p>
                {calc && calc.amountToInvest > 0 && (
                  <p className="text-xs text-indigo-600 font-medium">
                    להשקיע: {formatCurrency(calc.amountToInvest)}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => onEdit(holding)}
                  className="p-2 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteConfirm({ isOpen: true, id: holding.id, name: holding.name })}
                  className="p-2 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        {holdings.length === 0 && (
          <div className="text-center py-12 text-gray-400">
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
    </div>
  );
}

