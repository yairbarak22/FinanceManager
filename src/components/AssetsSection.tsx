'use client';

import { useState } from 'react';
import { Plus, Trash2, TrendingUp, HelpCircle, FolderOpen, Link } from 'lucide-react';
import { Asset, AssetValueHistory } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';
import { getCategoryInfo } from '@/lib/categories';
import { getAssetValueForMonth, getTotalAssetsForMonth } from '@/lib/assetUtils';
import ConfirmDialog from './modals/ConfirmDialog';
import { SensitiveData } from './common/SensitiveData';

// Portfolio sync asset name constant
const PORTFOLIO_SYNC_ASSET_NAME = 'תיק מסחר עצמאי';

function isPortfolioSyncAsset(assetName: string): boolean {
  return assetName === PORTFOLIO_SYNC_ASSET_NAME;
}

interface AssetsSectionProps {
  assets: Asset[];
  onAdd: () => void;
  onEdit: (asset: Asset) => void;
  onDelete: (id: string) => void;
  onViewDocuments: (asset: Asset) => void;
  selectedMonth?: string; // Format: 'YYYY-MM' or 'all'
  assetHistory?: AssetValueHistory[];
}

export default function AssetsSection({ 
  assets, 
  onAdd, 
  onEdit, 
  onDelete, 
  onViewDocuments,
  selectedMonth = 'all',
  assetHistory = []
}: AssetsSectionProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; name: string }>({
    isOpen: false,
    id: '',
    name: '',
  });
  
  // Calculate total assets for the selected month
  const totalAssets = getTotalAssetsForMonth(assets, assetHistory, selectedMonth);

  return (
    <div className="h-full flex flex-col">
      {/* Header - Fixed */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(13, 186, 204, 0.1)' }}
          >
            <TrendingUp className="w-5 h-5" style={{ color: '#0DBACC' }} strokeWidth={1.5} />
          </div>
          <div>
            <h3 
              className="font-semibold"
              style={{ 
                fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                color: '#303150'
              }}
            >
              נכסים
            </h3>
            <SensitiveData 
              as="p" 
              className="text-xs font-medium"
              style={{ color: '#0DBACC' }}
            >
              {formatCurrency(totalAssets)}
            </SensitiveData>
          </div>
        </div>
        <button 
          id="btn-add-asset" 
          onClick={onAdd} 
          className="text-sm font-medium flex items-center gap-1 hover:opacity-80 transition-opacity"
          style={{ color: '#69ADFF' }}
        >
          <Plus className="w-4 h-4" strokeWidth={1.5} />
          הוסף
        </button>
      </div>

      {/* Assets List - Scrollable */}
      <div className="overflow-y-scroll flex-1 min-h-0 scrollbar-assets scrollbar-edge-left scrollbar-fade-bottom">
        {assets.map((asset, index) => {
          const categoryInfo = getCategoryInfo(asset.category, 'asset');
          // Use icon from categoryInfo, or fallback to HelpCircle if not found
          const Icon = categoryInfo?.icon || HelpCircle;
          // Get value for the selected month (uses history if available)
          const displayValue = getAssetValueForMonth(asset, assetHistory, selectedMonth);

          const isSyncAsset = isPortfolioSyncAsset(asset.name);

          return (
            <div
              key={asset.id}
              onClick={!isSyncAsset ? () => onEdit(asset) : undefined}
              onKeyDown={!isSyncAsset ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onEdit(asset);
                }
              } : undefined}
              role={!isSyncAsset ? 'button' : undefined}
              tabIndex={!isSyncAsset ? 0 : undefined}
              aria-label={!isSyncAsset ? `ערוך נכס: ${asset.name}` : undefined}
              className={cn(
                "group relative p-3 bg-white transition-all duration-200",
                !isSyncAsset && "hover:bg-[#F7F7F8] hover:shadow-sm cursor-pointer active:scale-[0.98]",
                index < assets.length - 1 && "border-b"
              )}
              style={{ borderColor: '#F7F7F8' }}
            >
              {/* Edge Indicator - only for non-sync assets */}
              {!isSyncAsset && (
                <div className="absolute right-0 top-2 bottom-2 w-0.5 bg-[#69ADFF] opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
              )}

              {/* Row 1: Icon + Name + Category */}
              <div className="flex items-start gap-3 mb-2">
                {/* Icon */}
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(13, 186, 204, 0.1)' }}
                >
                  <Icon className="w-4 h-4" style={{ color: '#0DBACC' }} strokeWidth={1.5} />
                </div>

                {/* Details - full width, allow wrapping */}
                <div className="flex-1">
                  <SensitiveData 
                    as="p" 
                    className="font-medium text-sm leading-tight"
                    style={{ 
                      fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                      color: '#303150'
                    }}
                  >
                    {asset.name}
                  </SensitiveData>
                  <SensitiveData 
                    as="p" 
                    className="text-xs mt-0.5"
                    style={{ color: '#7E7F90' }}
                  >
                    {categoryInfo?.nameHe}
                  </SensitiveData>
                </div>
              </div>

              {/* Row 2: Value + Actions */}
              <div className="flex items-center justify-between mr-12">
                {/* Value - Historical value for selected month */}
                <SensitiveData 
                  as="p" 
                  className="text-sm font-semibold"
                  style={{ 
                    fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                    color: '#0DBACC'
                  }}
                >
                  {formatCurrency(displayValue)}
                </SensitiveData>

                {/* Actions */}
                <div className="flex gap-1">
                  {isSyncAsset ? (
                    /* Sync indicator for portfolio sync asset */
                    <div 
                      className="flex items-center gap-1 px-2 py-1 rounded-full text-xs"
                      style={{ 
                        background: 'rgba(13, 186, 204, 0.1)',
                        color: '#0DBACC'
                      }}
                      title="מסונכרן מתיק השקעות"
                    >
                      <Link className="w-3 h-3" strokeWidth={1.5} />
                      <span>מסונכרן</span>
                    </div>
                  ) : (
                    /* Regular actions for non-sync assets */
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewDocuments(asset);
                        }}
                        className="p-1.5 rounded hover:bg-[#F7F7F8] transition-colors"
                        style={{ color: '#7E7F90' }}
                        title="מסמכים"
                        aria-label={`צפייה במסמכים של ${asset.name}`}
                      >
                        <FolderOpen className="w-3.5 h-3.5" strokeWidth={1.5} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm({ isOpen: true, id: asset.id, name: asset.name });
                        }}
                        className="p-1.5 rounded hover:bg-red-50 transition-colors"
                        style={{ color: '#7E7F90' }}
                        aria-label={`מחיקת ${asset.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        
        {assets.length === 0 && (
          <p 
            className="text-center text-sm py-4"
            style={{ color: '#7E7F90' }}
          >
            אין נכסים
          </p>
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
