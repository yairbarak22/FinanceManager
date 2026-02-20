'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileText, AlertCircle, CheckCircle2, Loader2, Download } from 'lucide-react';
import { apiFetch } from '@/lib/utils';

interface ImportResult {
  success: boolean;
  added: number;
  updated: number;
  errors: Array<{ row: number; symbol: string; error: string }>;
  message: string;
}

interface PreviewRow {
  symbol: string;
  quantity: string;
  valid: boolean;
  error?: string;
}

interface ImportPortfolioDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Parse CSV content for preview
 */
function parseCSVForPreview(content: string): PreviewRow[] {
  const lines = content.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const symbolIndex = headers.findIndex((h) => 
    ['symbol', 'סמל', 'ticker', 'קוד', 'קוד נייר'].includes(h)
  );
  const quantityIndex = headers.findIndex((h) => 
    ['quantity', 'כמות', 'units', 'יחידות', 'מספר יחידות'].includes(h)
  );

  if (symbolIndex === -1 || quantityIndex === -1) return [];

  const rows: PreviewRow[] = [];
  for (let i = 1; i < Math.min(lines.length, 11); i++) { // Max 10 preview rows
    const cells = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    const symbol = cells[symbolIndex] || '';
    const quantity = cells[quantityIndex] || '';
    
    const qty = parseFloat(quantity);
    const valid = !!symbol && !isNaN(qty) && qty > 0;
    
    rows.push({
      symbol: symbol.toUpperCase(),
      quantity,
      valid,
      error: !symbol ? 'סמל חסר' : (!valid ? 'כמות לא תקינה' : undefined),
    });
  }

  return rows;
}

export function ImportPortfolioDialog({ isOpen, onClose, onSuccess }: ImportPortfolioDialogProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setResult(null);

    // Validate file type
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      setError('יש להעלות קובץ CSV בלבד');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('הקובץ גדול מדי (מקסימום 5MB)');
      return;
    }

    setSelectedFile(file);

    // Read and preview
    try {
      const content = await file.text();
      const cleanContent = content.replace(/^\uFEFF/, ''); // Remove BOM
      const previewRows = parseCSVForPreview(cleanContent);
      
      if (previewRows.length === 0) {
        setError('הקובץ חייב להכיל עמודות Symbol ו-Quantity');
        setSelectedFile(null);
        return;
      }

      setPreview(previewRows);
    } catch {
      setError('שגיאה בקריאת הקובץ');
      setSelectedFile(null);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleImport = async () => {
    if (!selectedFile) return;

    setIsImporting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await apiFetch('/api/portfolio/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'שגיאה בייבוא');
      }

      setResult(data);
      
      if (data.success) {
        // Auto-close and refresh after 2 seconds on success
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בייבוא התיק');
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreview([]);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="import-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999]"
      />

      {/* Modal */}
      <motion.div
        key="import-modal"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-[9999]"
      >
        <div
          className="bg-[#FFFFFF] rounded-3xl overflow-hidden mx-4"
          style={{
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            fontFamily: 'var(--font-nunito), system-ui, sans-serif',
          }}
          dir="rtl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#F7F7F8]">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(105, 173, 255, 0.1)' }}
              >
                <Upload className="w-5 h-5 text-[#69ADFF]" strokeWidth={1.75} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#303150]">ייבוא תיק</h3>
                <p className="text-sm text-[#7E7F90]">העלה קובץ CSV עם החזקות</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-[#F7F7F8] transition-colors"
            >
              <X className="w-5 h-5 text-[#BDBDCB]" strokeWidth={1.75} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Success Result */}
            {result?.success && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-8"
              >
                <div className="w-16 h-16 bg-[#0DBACC]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-[#0DBACC]" strokeWidth={1.75} />
                </div>
                <h4 className="text-lg font-bold text-[#303150] mb-2">הייבוא הושלם!</h4>
                <p className="text-[#7E7F90] mb-4">
                  {result.added > 0 && `${result.added} נכסים חדשים נוספו`}
                  {result.added > 0 && result.updated > 0 && ' • '}
                  {result.updated > 0 && `${result.updated} נכסים עודכנו`}
                </p>
                {result.errors.length > 0 && (
                  <p className="text-sm text-[#F18AB5]">
                    {result.errors.length} שורות עם שגיאות
                  </p>
                )}
              </motion.div>
            )}

            {/* Error Display */}
            {error && (
              <div className="mb-4 p-4 bg-[#FFC0DB]/20 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-[#F18AB5] flex-shrink-0 mt-0.5" strokeWidth={1.75} />
                <p className="text-sm text-[#F18AB5]">{error}</p>
              </div>
            )}

            {/* Drag & Drop Zone */}
            {!selectedFile && !result?.success && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all
                  ${isDragging
                    ? 'border-[#69ADFF] bg-[#69ADFF]/5'
                    : 'border-[#E8E8ED] hover:border-[#69ADFF] hover:bg-[#F7F7F8]'
                  }
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                <div className="w-16 h-16 bg-[#F7F7F8] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-[#7E7F90]" strokeWidth={1.5} />
                </div>
                
                <p className="text-[#303150] font-medium mb-1">
                  גרור קובץ CSV לכאן
                </p>
                <p className="text-sm text-[#7E7F90] mb-4">
                  או לחץ לבחירת קובץ
                </p>
                
                <div className="text-xs text-[#BDBDCB] space-y-1">
                  <p>פורמט נתמך: Symbol, Quantity</p>
                  <p>תמיכה בעברית: סמל, כמות</p>
                </div>
              </div>
            )}

            {/* File Preview */}
            {selectedFile && !result?.success && (
              <div className="space-y-4">
                {/* Selected File */}
                <div className="flex items-center gap-3 p-3 bg-[#F7F7F8] rounded-xl">
                  <FileText className="w-5 h-5 text-[#69ADFF]" strokeWidth={1.75} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#303150] truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-[#7E7F90]">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    onClick={handleReset}
                    className="p-1.5 rounded-lg hover:bg-[#E8E8ED] transition-colors"
                  >
                    <X className="w-4 h-4 text-[#7E7F90]" strokeWidth={1.75} />
                  </button>
                </div>

                {/* Preview Table */}
                {preview.length > 0 && (
                  <div className="border border-[#E8E8ED] rounded-xl overflow-hidden">
                    <div className="max-h-48 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-[#F7F7F8] sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-right font-medium text-[#7E7F90]">סמל</th>
                            <th className="px-3 py-2 text-right font-medium text-[#7E7F90]">כמות</th>
                            <th className="px-3 py-2 text-center font-medium text-[#7E7F90]">סטטוס</th>
                          </tr>
                        </thead>
                        <tbody>
                          {preview.map((row, index) => (
                            <tr key={index} className="border-t border-[#F7F7F8]">
                              <td className="px-3 py-2 text-[#303150] font-mono">{row.symbol || '-'}</td>
                              <td className="px-3 py-2 text-[#303150]" dir="ltr">{row.quantity || '-'}</td>
                              <td className="px-3 py-2 text-center">
                                {row.valid ? (
                                  <CheckCircle2 className="w-4 h-4 text-[#0DBACC] mx-auto" />
                                ) : (
                                  <span className="text-xs text-[#F18AB5]">{row.error}</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="px-3 py-2 bg-[#F7F7F8] text-xs text-[#7E7F90] text-center">
                      מציג עד 10 שורות ראשונות
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Sample Format Download */}
            {!selectedFile && !result?.success && (
              <div className="mt-4 pt-4 border-t border-[#F7F7F8] text-center">
                <a
                  href="data:text/csv;charset=utf-8,%EF%BB%BFSymbol,Quantity%0AAAPL,10%0ASPY,5%0A1159250.TA,100"
                  download="portfolio-template.csv"
                  className="inline-flex items-center gap-2 text-sm text-[#69ADFF] hover:underline"
                >
                  <Download className="w-4 h-4" strokeWidth={1.75} />
                  הורד קובץ לדוגמה
                </a>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          {!result?.success && (
            <div className="flex gap-3 p-6 pt-0">
              <button
                onClick={handleClose}
                className="flex-1 px-5 py-2.5 text-[#303150] bg-[#F7F7F8] rounded-xl hover:bg-[#E8E8ED] transition-colors font-medium"
              >
                ביטול
              </button>
              <button
                onClick={handleImport}
                disabled={!selectedFile || isImporting}
                className="flex-1 px-5 py-2.5 text-white bg-[#69ADFF] rounded-xl hover:bg-[#5A9EE6] transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed font-medium"
              >
                {isImporting ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  'ייבוא'
                )}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

