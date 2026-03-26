'use client';

import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, FileSpreadsheet, Loader2, Download, Calendar } from 'lucide-react';

interface ExportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function getDefaultDateRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

export default function ExportExcelModal({ isOpen, onClose }: ExportExcelModalProps) {
  const defaultRange = getDefaultDateRange();
  const [startDate, setStartDate] = useState(defaultRange.start);
  const [endDate, setEndDate] = useState(defaultRange.end);
  const [includeRecurring, setIncludeRecurring] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleExport = useCallback(async () => {
    if (!startDate || !endDate) {
      setErrorMsg('יש לבחור טווח תאריכים');
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setErrorMsg('תאריך סיום חייב להיות אחרי תאריך התחלה');
      return;
    }

    setErrorMsg(null);
    setIsExporting(true);

    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
        includeRecurring: String(includeRecurring),
      });

      const res = await fetch(`/api/transactions/export?${params}`);

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'שגיאה בייצוא');
      }

      const blob = await res.blob();
      const contentDisposition = res.headers.get('Content-Disposition') ?? '';
      const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
      const filename = filenameMatch?.[1] ?? `MyNeto-export-${startDate}-to-${endDate}.xlsx`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'שגיאה בייצוא');
    } finally {
      setIsExporting(false);
    }
  }, [startDate, endDate, includeRecurring, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-gray-900">ייצוא לאקסל</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body space-y-5 py-5 px-6">
          <p className="text-sm text-gray-500">
            בחר טווח תאריכים לייצוא התנועות הפיננסיות שלך לקובץ אקסל מסודר.
          </p>

          {/* Date Range */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Calendar className="w-4 h-4" />
              <span>טווח תאריכים</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label text-xs mb-1">מתאריך</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input w-full text-sm"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="label text-xs mb-1">עד תאריך</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="input w-full text-sm"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* Quick Select */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'חודש נוכחי', getRange: () => getDefaultDateRange() },
              {
                label: 'חודש קודם',
                getRange: () => {
                  const now = new Date();
                  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                  const end = new Date(now.getFullYear(), now.getMonth(), 0);
                  return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
                },
              },
              {
                label: '3 חודשים',
                getRange: () => {
                  const now = new Date();
                  const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
                  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                  return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
                },
              },
              {
                label: 'שנה נוכחית',
                getRange: () => {
                  const now = new Date();
                  const start = new Date(now.getFullYear(), 0, 1);
                  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                  return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
                },
              },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  const range = preset.getRange();
                  setStartDate(range.start);
                  setEndDate(range.end);
                }}
                className="px-3 py-1.5 text-xs font-medium rounded-full border border-gray-200 
                  text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 
                  transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Include Recurring */}
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                checked={includeRecurring}
                onChange={(e) => setIncludeRecurring(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-5 h-5 rounded border-2 border-gray-300 bg-white 
                peer-checked:bg-indigo-600 peer-checked:border-indigo-600 
                transition-colors flex items-center justify-center">
                {includeRecurring && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
            <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
              כלול תנועות קבועות (הכנסות והוצאות חודשיות)
            </span>
          </label>

          {/* Error */}
          {errorMsg && (
            <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 
              rounded-lg hover:bg-gray-100 transition-colors"
            disabled={isExporting}
          >
            ביטול
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || !startDate || !endDate}
            className="btn-primary flex items-center justify-center gap-2 px-5 py-2.5 text-sm 
              font-semibold min-w-[145px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>ייצוא לאקסל</span>
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
