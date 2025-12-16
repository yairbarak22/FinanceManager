'use client';

import { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

export default function ImportModal({ isOpen, onClose, onSuccess }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      setFile(droppedFile);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/transactions/import', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setResult(data);
        if (data.success > 0) {
          onSuccess();
        }
      } else {
        setResult({
          success: 0,
          failed: 0,
          errors: [data.error || 'שגיאה בייבוא הקובץ'],
        });
      }
    } catch {
      setResult({
        success: 0,
        failed: 0,
        errors: ['שגיאה בייבוא הקובץ'],
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal-content max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">ייבוא עסקאות</h3>
              <p className="text-sm text-gray-500">מקובץ Excel או CSV</p>
            </div>
          </div>
          <button onClick={handleClose} className="btn-icon">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* File Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
              isDragging
                ? 'border-pink-400 bg-pink-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />
            <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-600 mb-1">
              גרור קובץ לכאן או לחץ לבחירה
            </p>
            <p className="text-xs text-gray-400">
              Excel (.xlsx, .xls) או CSV
            </p>
          </div>

          {/* Selected File */}
          {file && (
            <div className="mt-4 p-3 bg-gray-50 rounded-xl flex items-center gap-3">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="mt-4 space-y-2">
              {result.success > 0 && (
                <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-xl text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>יובאו {result.success} עסקאות בהצלחה</span>
                </div>
              )}
              {result.failed > 0 && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 text-yellow-700 rounded-xl text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{result.failed} עסקאות נכשלו</span>
                </div>
              )}
              {result.errors.length > 0 && (
                <div className="p-3 bg-red-50 rounded-xl">
                  {result.errors.map((error, i) => (
                    <p key={i} className="text-sm text-red-600">
                      {error}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Format Info */}
          <div className="mt-4 p-3 bg-blue-50 rounded-xl">
            <p className="text-sm text-blue-800 font-medium mb-1">פורמט נדרש:</p>
            <p className="text-xs text-blue-600">
              עמודות: שם העסק, סכום התשלום, תאריך (DD/MM/YYYY), קטגוריה
            </p>
            <p className="text-xs text-blue-600 mt-1">
              סכום חיובי = הוצאה, סכום שלילי = הכנסה
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button onClick={handleClose} className="btn-secondary flex-1">
            סגור
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="btn-primary flex-1 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                מייבא...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                ייבא
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

