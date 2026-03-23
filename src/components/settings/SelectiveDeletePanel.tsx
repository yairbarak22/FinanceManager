'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle,
  Trash2,
  Loader2,
  Check,
  Receipt,
  Repeat,
  Landmark,
  TrendingUp,
  FileText,
  Tags,
  Heart,
  PieChart,
  BarChart3,
  UserCog,
  type LucideIcon,
} from 'lucide-react';
import { apiFetch } from '@/lib/utils';
import type { DataDomain } from '@/lib/userDataDeletion';

const FONT = 'var(--font-nunito), system-ui, sans-serif';

const ICON_MAP: Record<string, LucideIcon> = {
  Receipt,
  Repeat,
  Landmark,
  TrendingUp,
  FileText,
  Tags,
  Heart,
  PieChart,
  BarChart3,
  UserCog,
};

interface DomainMeta {
  label: string;
  description: string;
  icon: string;
}

export interface DeletionPreviewData {
  counts: Record<DataDomain, number>;
  domains: DataDomain[];
  meta: Record<DataDomain, DomainMeta>;
  dependencies: Partial<Record<DataDomain, DataDomain[]>>;
}

interface SelectiveDeletePanelProps {
  previewData?: DeletionPreviewData | null;
  previewLoading?: boolean;
  previewError?: string | null;
  onRetryPreview?: () => void;
  onCancel: () => void;
  onDeleteComplete?: () => void;
}

type Phase = 'select' | 'deleting' | 'done';

export default function SelectiveDeletePanel({
  previewData,
  previewLoading = false,
  previewError = null,
  onRetryPreview,
  onCancel,
  onDeleteComplete,
}: SelectiveDeletePanelProps) {
  const [phase, setPhase] = useState<Phase>('select');
  const [selected, setSelected] = useState<Set<DataDomain>>(new Set());
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletedResult, setDeletedResult] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    setPhase('select');
    setSelected(new Set());
    setConfirmed(false);
    setError(null);
    setDeletedResult(null);
  }, []);

  const totalSelected = useMemo(() => {
    if (!previewData) return 0;
    let sum = 0;
    for (const d of selected) {
      sum += previewData.counts[d] ?? 0;
    }
    return sum;
  }, [selected, previewData]);

  const dependencyWarnings = useMemo(() => {
    if (!previewData) return [];
    const warnings: string[] = [];
    for (const [domain, deps] of Object.entries(previewData.dependencies)) {
      if (selected.has(domain as DataDomain) && deps) {
        const missing = (deps as DataDomain[]).filter((d) => !selected.has(d));
        if (missing.length > 0) {
          const depLabels = missing
            .map((d) => previewData.meta[d]?.label ?? d)
            .join(', ');
          warnings.push(
            `"${previewData.meta[domain as DataDomain]?.label}" דורש מחיקת: ${depLabels}`
          );
        }
      }
    }
    return warnings;
  }, [selected, previewData]);

  const canDelete =
    selected.size > 0 && dependencyWarnings.length === 0 && confirmed;

  const toggleDomain = (domain: DataDomain) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(domain)) {
        next.delete(domain);
      } else {
        next.add(domain);
        const deps = previewData?.dependencies[domain];
        if (deps) {
          for (const dep of deps) {
            next.add(dep as DataDomain);
          }
        }
      }
      return next;
    });
  };

  const selectAll = () => {
    if (!previewData) return;
    setSelected(new Set(previewData.domains));
  };

  const selectNone = () => {
    setSelected(new Set());
  };

  const handleDelete = async () => {
    setPhase('deleting');
    setError(null);
    try {
      const res = await apiFetch('/api/user/delete-selected-data', {
        method: 'POST',
        body: JSON.stringify({ domains: [...selected] }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'שגיאה במחיקת הנתונים');
        setPhase('select');
        return;
      }
      setDeletedResult(data.deleted);
      setPhase('done');
    } catch {
      setError('שגיאה בחיבור לשרת. נסה שוב.');
      setPhase('select');
    }
  };

  const handleDone = () => {
    onDeleteComplete?.();
    onCancel();
  };

  const skeletonRows = Array.from({ length: 6 }, (_, i) => (
    <div
      key={i}
      className="flex items-center gap-3 p-3 rounded-xl animate-pulse"
      style={{ border: '1px solid rgba(0,0,0,0.04)' }}
    >
      <div className="w-5 h-5 rounded-md bg-gray-100 shrink-0" />
      <div className="w-8 h-8 rounded-lg bg-gray-100 shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 bg-gray-100 rounded w-24" />
        <div className="h-2.5 bg-gray-50 rounded w-36" />
      </div>
      <div className="h-3 bg-gray-100 rounded w-8" />
    </div>
  ));

  return (
    <div id="delete-data-panel">
      {/* Content */}
      <div
        className="overflow-y-auto"
        style={{ maxHeight: 'min(70vh, 32rem)' }}
      >
        {phase === 'select' && (
          <div>
            {previewLoading ? (
              <div className="space-y-2">{skeletonRows}</div>
            ) : previewError ? (
              <div className="text-center py-8">
                <p
                  className="text-sm mb-3"
                  style={{ color: '#F18AB5', fontFamily: FONT }}
                >
                  {previewError}
                </p>
                {onRetryPreview && (
                  <button
                    type="button"
                    onClick={onRetryPreview}
                    className="text-sm font-medium px-4 py-2 rounded-xl"
                    style={{
                      color: '#69ADFF',
                      background: 'rgba(105, 173, 255, 0.08)',
                      fontFamily: FONT,
                    }}
                  >
                    נסה שוב
                  </button>
                )}
              </div>
            ) : previewData ? (
              <>
                {/* Quick actions */}
                <div className="flex gap-2 mb-4">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                    style={{
                      color: '#69ADFF',
                      background: 'rgba(105, 173, 255, 0.08)',
                      fontFamily: FONT,
                    }}
                  >
                    סמן הכל
                  </button>
                  <button
                    type="button"
                    onClick={selectNone}
                    className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                    style={{
                      color: '#7E7F90',
                      background: 'rgba(126, 127, 144, 0.08)',
                      fontFamily: FONT,
                    }}
                  >
                    נקה בחירה
                  </button>
                </div>

                {/* Domain list */}
                <div className="space-y-2">
                  {previewData.domains.map((domain) => {
                    const meta = previewData.meta[domain];
                    const count = previewData.counts[domain];
                    const isSelected = selected.has(domain);
                    const IconComp = ICON_MAP[meta.icon] ?? Receipt;

                    return (
                      <button
                        key={domain}
                        type="button"
                        onClick={() => toggleDomain(domain)}
                        disabled={count === 0}
                        className="w-full flex items-center gap-3 p-3 rounded-xl text-start transition-all duration-150"
                        style={{
                          background: isSelected
                            ? 'rgba(241, 138, 181, 0.06)'
                            : count === 0
                              ? 'rgba(0,0,0,0.02)'
                              : 'transparent',
                          border: isSelected
                            ? '1px solid rgba(241, 138, 181, 0.25)'
                            : '1px solid rgba(0,0,0,0.04)',
                          opacity: count === 0 ? 0.5 : 1,
                          cursor: count === 0 ? 'default' : 'pointer',
                        }}
                      >
                        <div
                          className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all duration-150"
                          style={{
                            backgroundColor: isSelected
                              ? '#F18AB5'
                              : 'transparent',
                            border: isSelected
                              ? '1.5px solid #F18AB5'
                              : '1.5px solid #BDBDCB',
                          }}
                        >
                          {isSelected && (
                            <Check
                              className="w-3 h-3 text-white"
                              strokeWidth={2.5}
                            />
                          )}
                        </div>

                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: isSelected
                              ? 'rgba(241, 138, 181, 0.12)'
                              : 'rgba(126, 127, 144, 0.08)',
                          }}
                        >
                          <IconComp
                            className="w-4 h-4"
                            style={{
                              color: isSelected ? '#F18AB5' : '#7E7F90',
                            }}
                            strokeWidth={1.75}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p
                            className="text-[0.8125rem] font-medium"
                            style={{ color: '#303150', fontFamily: FONT }}
                          >
                            {meta.label}
                          </p>
                          <p
                            className="text-[0.6875rem] mt-0.5 truncate"
                            style={{ color: '#BDBDCB', fontFamily: FONT }}
                          >
                            {meta.description}
                          </p>
                        </div>

                        <span
                          className="text-xs font-medium tabular-nums shrink-0"
                          style={{
                            color: count > 0 ? '#7E7F90' : '#BDBDCB',
                            fontFamily: FONT,
                          }}
                        >
                          {count === 0
                            ? 'ריק'
                            : count.toLocaleString('he-IL')}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Dependency warnings */}
                {dependencyWarnings.length > 0 && (
                  <div
                    className="mt-4 p-3 rounded-xl text-xs"
                    style={{
                      background: 'rgba(255, 183, 77, 0.08)',
                      border: '1px solid rgba(255, 183, 77, 0.25)',
                      color: '#E09B3D',
                      fontFamily: FONT,
                    }}
                  >
                    {dependencyWarnings.map((w, i) => (
                      <p key={i} className={i > 0 ? 'mt-1' : ''}>
                        {w}
                      </p>
                    ))}
                  </div>
                )}

                {/* Inline confirmation checkbox */}
                {selected.size > 0 && dependencyWarnings.length === 0 && (
                  <label
                    className="flex items-start gap-2.5 mt-4 p-3 rounded-xl cursor-pointer select-none"
                    style={{
                      background: 'rgba(241, 138, 181, 0.04)',
                      border: '1px solid rgba(241, 138, 181, 0.12)',
                    }}
                  >
                    <div
                      className="w-[18px] h-[18px] mt-0.5 rounded flex items-center justify-center shrink-0 transition-all duration-150"
                      style={{
                        backgroundColor: confirmed
                          ? '#F18AB5'
                          : 'transparent',
                        border: confirmed
                          ? '1.5px solid #F18AB5'
                          : '1.5px solid #BDBDCB',
                      }}
                    >
                      {confirmed && (
                        <Check
                          className="w-3 h-3 text-white"
                          strokeWidth={2.5}
                        />
                      )}
                    </div>
                    <input
                      type="checkbox"
                      checked={confirmed}
                      onChange={(e) => setConfirmed(e.target.checked)}
                      className="sr-only"
                    />
                    <span
                      className="text-xs leading-relaxed"
                      style={{ color: '#7E7F90', fontFamily: FONT }}
                    >
                      אני מבין/ה ש-
                      <strong style={{ color: '#F18AB5' }}>
                        {totalSelected.toLocaleString('he-IL')} רשומות
                      </strong>{' '}
                      יימחקו לצמיתות ולא ניתן יהיה לשחזר אותן.
                    </span>
                  </label>
                )}

                {error && (
                  <div
                    className="mt-3 flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
                    style={{
                      background: 'rgba(241, 138, 181, 0.1)',
                      border: '1px solid rgba(241, 138, 181, 0.3)',
                      color: '#F18AB5',
                      fontFamily: FONT,
                    }}
                  >
                    <AlertTriangle className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                    {error}
                  </div>
                )}
              </>
            ) : null}
          </div>
        )}

        {phase === 'deleting' && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2
              className="w-8 h-8 animate-spin mb-3"
              style={{ color: '#F18AB5' }}
            />
            <p
              className="text-sm font-medium"
              style={{ color: '#303150', fontFamily: FONT }}
            >
              מוחק נתונים...
            </p>
            <p
              className="text-xs mt-1"
              style={{ color: '#BDBDCB', fontFamily: FONT }}
            >
              הפעולה עשויה להימשך מספר שניות
            </p>
          </div>
        )}

        {phase === 'done' && (
          <div className="flex flex-col items-center justify-center py-10">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
              style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}
            >
              <Check
                className="w-6 h-6"
                style={{ color: '#10B981' }}
                strokeWidth={2}
              />
            </div>
            <p
              className="text-[0.9375rem] font-semibold mb-1"
              style={{ color: '#303150', fontFamily: FONT }}
            >
              המחיקה הושלמה בהצלחה
            </p>
            <p
              className="text-xs mb-4"
              style={{ color: '#7E7F90', fontFamily: FONT }}
            >
              הנתונים שנבחרו נמחקו לצמיתות
            </p>

            {deletedResult && (
              <div
                className="w-full rounded-xl p-3 mb-4"
                style={{
                  background: 'rgba(16, 185, 129, 0.04)',
                  border: '1px solid rgba(16, 185, 129, 0.15)',
                }}
              >
                {Object.entries(deletedResult)
                  .filter(([, v]) => v > 0)
                  .map(([domain, count]) => (
                    <div
                      key={domain}
                      className="flex items-center justify-between py-1"
                    >
                      <span
                        className="text-xs"
                        style={{ color: '#7E7F90', fontFamily: FONT }}
                      >
                        {previewData?.meta[domain as DataDomain]?.label ??
                          domain}
                      </span>
                      <span
                        className="text-xs font-medium tabular-nums"
                        style={{ color: '#10B981', fontFamily: FONT }}
                      >
                        {(count as number).toLocaleString('he-IL')} נמחקו
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pt-4 mt-4 border-t border-[#F7F7F8]">
        {phase === 'select' && (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary flex-1"
            >
              ביטול
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={!canDelete}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all duration-200"
              style={{
                backgroundColor: canDelete
                  ? '#F18AB5'
                  : 'rgba(241, 138, 181, 0.3)',
                cursor: canDelete ? 'pointer' : 'not-allowed',
                fontFamily: FONT,
              }}
            >
              מחק ({selected.size})
              <Trash2 className="w-4 h-4" strokeWidth={1.75} />
            </button>
          </div>
        )}

        {phase === 'done' && (
          <button
            type="button"
            onClick={handleDone}
            className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
            style={{
              color: '#303150',
              background: 'rgba(48, 49, 80, 0.06)',
              fontFamily: FONT,
            }}
          >
            סגור
          </button>
        )}
      </div>
    </div>
  );
}
