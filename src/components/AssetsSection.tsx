'use client';

import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, TrendingUp, HelpCircle, FolderOpen } from 'lucide-react';
import { Asset } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';
import { getCategoryInfo } from '@/lib/categories';
import ConfirmDialog from './modals/ConfirmDialog';
import HelpTrigger from './ai/HelpTrigger';
import { SensitiveData } from './common/SensitiveData';

interface AssetsSectionProps {
  assets: Asset[];
  onAdd: () => void;
  onEdit: (asset: Asset) => void;
  onDelete: (id: string) => void;
  onViewDocuments: (asset: Asset) => void;
}

export default function AssetsSection({ assets, onAdd, onEdit, onDelete, onViewDocuments }: AssetsSectionProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; name: string }>({
    isOpen: false,
    id: '',
    name: '',
  });
  const totalAssets = assets.reduce((sum, a) => sum + a.value, 0);

  // Dynamic context data for AI Help (summary only, not full asset list)
  const assetsContextData = useMemo(() => {
    const categories = [...new Set(assets.map(a => getCategoryInfo(a.category, 'asset')?.nameHe || a.category))];
    return {
      סהכ_נכסים: assets.length,
      שווי_כולל: totalAssets,
      קטגוריות: categories.join(', '),
    };
  }, [assets, totalAssets]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">נכסים</h3>
            <SensitiveData as="p" className="text-xs text-emerald-600 font-medium">
              {formatCurrency(totalAssets)}
            </SensitiveData>
          </div>
          <HelpTrigger
            id="btn-ai-help-assets"
            topicId="assets"
            contextData={assetsContextData}
            size="sm"
          />
        </div>
        <button id="btn-add-asset" onClick={onAdd} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
          <Plus className="w-4 h-4" />
          הוסף
        </button>
      </div>

      {/* Assets List */}
      <div className="space-y-2">
        {assets.map((asset) => {
          const categoryInfo = getCategoryInfo(asset.category, 'asset');
          // Use icon from categoryInfo, or fallback to HelpCircle if not found
          const Icon = categoryInfo?.icon || HelpCircle;

          return (
            <div
              key={asset.id}
              className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 bg-slate-50 rounded-lg"
            >
              {/* Top row: Icon + Details + Value (mobile) */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Icon */}
                <div
                  className={cn(
                    'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                    categoryInfo?.bgColor || 'bg-slate-100'
                  )}
                >
                  <Icon className={cn('w-4 h-4', categoryInfo?.textColor || 'text-slate-600')} />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <SensitiveData as="p" className="font-medium text-slate-900 text-sm truncate">
                    {asset.name}
                  </SensitiveData>
                  <SensitiveData as="p" className="text-xs text-slate-500 truncate">{categoryInfo?.nameHe}</SensitiveData>
                </div>

                {/* Value - visible on mobile in this row */}
                <SensitiveData as="p" className="text-sm font-bold text-green-600 flex-shrink-0 sm:hidden">
                  {formatCurrency(asset.value)}
                </SensitiveData>
              </div>

              {/* Bottom row (mobile) / Continue (desktop): Value + Actions */}
              <div className="flex items-center gap-2 justify-end sm:gap-1 mr-12 sm:mr-0">
                {/* Value - visible on desktop */}
                <SensitiveData as="p" className="hidden sm:block text-sm font-bold text-slate-900 flex-shrink-0 ml-2">
                  {formatCurrency(asset.value)}
                </SensitiveData>

                {/* Actions */}
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => onViewDocuments(asset)}
                    className="p-1.5 rounded hover:bg-indigo-100 text-slate-500 hover:text-indigo-600"
                    title="מסמכים"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onEdit(asset)}
                    className="p-1.5 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-600"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm({ isOpen: true, id: asset.id, name: asset.name })}
                    className="p-1.5 rounded hover:bg-red-100 text-slate-500 hover:text-red-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        
        {assets.length === 0 && (
          <p className="text-center text-slate-500 text-sm py-4">אין נכסים</p>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: '', name: '' })}
        onConfirm={() => onDelete(deleteConfirm.id)}
        title="מחיקת נכס"
        message={`האם אתה בטוח שברצונך למחוק את "${deleteConfirm.name}"?`}
      />
    </div>
  );
}
